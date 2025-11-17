import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Pessoa, PessoaInsert, PessoaUpdate, Usuario, StatusPessoa } from '@/lib/types'
import { PessoaRepository } from '@/lib/repositories'
import { AuditoriaService } from './auditoria.service'
import { HistoricoService } from './historico.service'
import { PermissaoService } from './permissao.service'

/**
 * Pessoa Service
 *
 * Service para gerenciamento de pessoas com TODA a lógica de negócio.
 *
 * RESPONSABILIDADES:
 * - Validações antes de criar/atualizar
 * - Gerenciamento de históricos (cargo, time, reajuste)
 * - Registro de auditoria
 * - Verificação de permissões
 * - Filtros por hierarquia (gestores)
 */
export class PessoaService {
  private supabase: SupabaseClient<Database>
  private pessoaRepo: PessoaRepository
  private auditoriaService: AuditoriaService
  private historicoService: HistoricoService
  private permissaoService: PermissaoService

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.pessoaRepo = new PessoaRepository(supabase)
    this.auditoriaService = new AuditoriaService(supabase)
    this.historicoService = new HistoricoService(supabase)
    this.permissaoService = new PermissaoService(supabase)
  }

  // ==========================================================================
  // CRUD COM LÓGICA DE NEGÓCIO
  // ==========================================================================

  /**
   * Cria uma nova pessoa
   *
   * LÓGICA:
   * 1. Valida dados
   * 2. Verifica permissões
   * 3. Cria pessoa
   * 4. Cria históricos iniciais (cargo, time)
   * 5. Registra auditoria
   */
  async criar(dados: PessoaInsert, usuarioLogado: Usuario): Promise<ServiceResult<Pessoa>> {
    try {
      // 1. VALIDAÇÕES
      const validacao = await this.validar(dados)
      if (!validacao.valido) {
        return { success: false, error: validacao.erro }
      }

      // 2. PERMISSÕES
      if (!this.permissaoService.podeCriar(usuarioLogado, 'pessoa')) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'criar pessoas'),
        }
      }

      // 3. CRIAR PESSOA
      const pessoa = await this.pessoaRepo.create({
        ...dados,
        ativo: dados.ativo !== undefined ? dados.ativo : true,
        status: dados.status || 'ativo',
      })

      // 4. CRIAR HISTÓRICOS INICIAIS
      const hoje = new Date().toISOString().split('T')[0]

      // Histórico de cargo
      if (pessoa.cargo_id) {
        await this.historicoService.criarHistoricoCargo(pessoa.id, pessoa.cargo_id, dados.data_inicio_cargo_atual || hoje)
      }

      // Histórico de time
      if (pessoa.time_id) {
        await this.historicoService.criarHistoricoTime(pessoa.id, pessoa.time_id, dados.data_entrada || hoje)
      }

      // Histórico de reajuste (se salário informado)
      if (pessoa.salario_atual) {
        await this.historicoService.criarHistoricoReajuste(
          pessoa.id,
          null, // sem salário anterior
          pessoa.salario_atual,
          dados.data_ultimo_reajuste || hoje,
          dados.motivo_ultimo_reajuste || 'Salário inicial'
        )
      }

      // 5. AUDITORIA
      await this.auditoriaService.registrarCriacao('pessoa', pessoa.id, pessoa, usuarioLogado.id)

      return { success: true, data: pessoa }
    } catch (error) {
      console.error('[PessoaService] Erro ao criar pessoa:', error)
      return { success: false, error: 'Erro ao criar pessoa. Tente novamente.' }
    }
  }

  /**
   * Atualiza uma pessoa
   *
   * LÓGICA:
   * 1. Valida dados
   * 2. Verifica permissões
   * 3. Busca pessoa atual
   * 4. Detecta mudanças (cargo, time, salário)
   * 5. Atualiza pessoa
   * 6. Cria históricos se mudou cargo/time/salário
   * 7. Registra auditoria
   */
  async atualizar(id: string, dados: PessoaUpdate, usuarioLogado: Usuario): Promise<ServiceResult<Pessoa>> {
    try {
      // 1. VALIDAÇÕES
      const validacao = await this.validar(dados, id)
      if (!validacao.valido) {
        return { success: false, error: validacao.erro }
      }

      // 2. PERMISSÕES
      const podeEditar = await this.permissaoService.podeEditar(usuarioLogado, 'pessoa', id)
      if (!podeEditar) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'editar pessoas'),
        }
      }

      // 3. BUSCAR PESSOA ATUAL
      const pessoaAnterior = await this.pessoaRepo.findById(id)
      if (!pessoaAnterior) {
        return { success: false, error: 'Pessoa não encontrada' }
      }

      // 4. DETECTAR MUDANÇAS
      const mudouCargo = dados.cargo_id && dados.cargo_id !== pessoaAnterior.cargo_id
      const mudouTime = dados.time_id && dados.time_id !== pessoaAnterior.time_id
      const mudouSalario = dados.salario_atual !== undefined && dados.salario_atual !== pessoaAnterior.salario_atual

      // 5. ATUALIZAR PESSOA
      const pessoa = await this.pessoaRepo.update(id, dados)

      // 6. CRIAR HISTÓRICOS
      // Mudança de cargo
      if (mudouCargo && dados.cargo_id) {
        await this.historicoService.processarMudancaCargo(id, dados.cargo_id)
      }

      // Mudança de time
      if (mudouTime && dados.time_id) {
        await this.historicoService.processarMudancaTime(id, dados.time_id)
      }

      // Mudança de salário
      if (mudouSalario && dados.salario_atual !== undefined) {
        // Verifica permissão para editar salário
        const podeEditarSalario = await this.permissaoService.podeEditarSalario(usuarioLogado, id)
        if (!podeEditarSalario) {
          return {
            success: false,
            error: 'Você não tem permissão para editar salários',
          }
        }

        await this.historicoService.processarMudancaSalario(
          id,
          pessoaAnterior.salario_atual,
          dados.salario_atual,
          dados.motivo_ultimo_reajuste
        )
      }

      // 7. AUDITORIA
      await this.auditoriaService.registrarMudancas('pessoa', id, pessoaAnterior, pessoa, usuarioLogado.id)

      return { success: true, data: pessoa }
    } catch (error) {
      console.error('[PessoaService] Erro ao atualizar pessoa:', error)
      return { success: false, error: 'Erro ao atualizar pessoa. Tente novamente.' }
    }
  }

  /**
   * Desativa uma pessoa (soft delete)
   *
   * LÓGICA:
   * 1. Verifica permissões
   * 2. Marca pessoa como inativa
   * 3. Finaliza históricos atuais (cargo, time)
   * 4. Registra auditoria
   */
  async desativar(id: string, usuarioLogado: Usuario): Promise<ServiceResult<Pessoa>> {
    try {
      // 1. PERMISSÕES
      const podeEditar = await this.permissaoService.podeEditar(usuarioLogado, 'pessoa', id)
      if (!podeEditar) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'desativar pessoas'),
        }
      }

      const pessoaAnterior = await this.pessoaRepo.findById(id)
      if (!pessoaAnterior) {
        return { success: false, error: 'Pessoa não encontrada' }
      }

      // 2. DESATIVAR
      const hoje = new Date().toISOString().split('T')[0]
      const pessoa = await this.pessoaRepo.update(id, {
        ativo: false,
        status: 'desligado',
        data_desligamento: hoje,
      })

      // 3. FINALIZAR HISTÓRICOS
      await this.historicoService.finalizarHistoricoCargoAtual(id, hoje)
      await this.historicoService.finalizarHistoricoTimeAtual(id, hoje)

      // 4. AUDITORIA
      await this.auditoriaService.registrarEdicao('pessoa', id, 'ativo', true, false, usuarioLogado.id)

      return { success: true, data: pessoa }
    } catch (error) {
      console.error('[PessoaService] Erro ao desativar pessoa:', error)
      return { success: false, error: 'Erro ao desativar pessoa. Tente novamente.' }
    }
  }

  /**
   * Reativa uma pessoa
   */
  async reativar(id: string, usuarioLogado: Usuario): Promise<ServiceResult<Pessoa>> {
    try {
      const podeEditar = await this.permissaoService.podeEditar(usuarioLogado, 'pessoa', id)
      if (!podeEditar) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'reativar pessoas'),
        }
      }

      const pessoa = await this.pessoaRepo.update(id, {
        ativo: true,
        status: 'ativo',
        data_desligamento: null,
      })

      await this.auditoriaService.registrarEdicao('pessoa', id, 'ativo', false, true, usuarioLogado.id)

      return { success: true, data: pessoa }
    } catch (error) {
      console.error('[PessoaService] Erro ao reativar pessoa:', error)
      return { success: false, error: 'Erro ao reativar pessoa. Tente novamente.' }
    }
  }

  // ==========================================================================
  // BUSCA COM PERMISSÕES
  // ==========================================================================

  /**
   * Busca pessoas com filtro de permissão
   *
   * LÓGICA:
   * - Admin: vê todas as pessoas
   * - Gestor: vê apenas pessoas de sua hierarquia
   * - Visualizador: vê todas as pessoas (mas não vê salários)
   */
  async buscarComPermissao(usuarioLogado: Usuario, filtros?: any) {
    try {
      // Admin e Visualizador veem todas
      if (usuarioLogado.tipo_perfil === 'admin' || usuarioLogado.tipo_perfil === 'visualizador') {
        return await this.pessoaRepo.findWithFilters(filtros || {})
      }

      // Gestor: apenas sua hierarquia
      if (usuarioLogado.tipo_perfil === 'gestor') {
        const timesHierarquia = await this.permissaoService.getTimesHierarquia(usuarioLogado)

        if (timesHierarquia.length === 0) {
          return []
        }

        return await this.pessoaRepo.findByTimeIds(timesHierarquia)
      }

      return []
    } catch (error) {
      console.error('[PessoaService] Erro ao buscar pessoas:', error)
      return []
    }
  }

  /**
   * Busca pessoa por ID com verificação de permissão
   */
  async buscarPorIdComPermissao(id: string, usuarioLogado: Usuario) {
    const podeVer = await this.permissaoService.podeVer(usuarioLogado, 'pessoa', id)

    if (!podeVer) {
      return null
    }

    return await this.pessoaRepo.findByIdWithRelationships(id)
  }

  // ==========================================================================
  // VALIDAÇÕES
  // ==========================================================================

  /**
   * Valida dados de pessoa antes de salvar
   */
  private async validar(dados: PessoaInsert | PessoaUpdate, id?: string): Promise<ValidationResult> {
    // Nome obrigatório (apenas em criação)
    if ('nome' in dados && !dados.nome) {
      return { valido: false, erro: 'Nome é obrigatório' }
    }

    // Email corporativo único
    if (dados.email_corporativo) {
      const emailExiste = await this.pessoaRepo.emailCorporativoExists(dados.email_corporativo, id)
      if (emailExiste) {
        return { valido: false, erro: 'Email corporativo já está em uso' }
      }
    }

    // Validar status
    if (dados.status) {
      const statusValidos: StatusPessoa[] = ['ativo', 'ferias', 'licenca', 'afastamento', 'desligado']
      if (!statusValidos.includes(dados.status)) {
        return { valido: false, erro: 'Status inválido' }
      }
    }

    // Validar salário (se informado)
    if (dados.salario_atual !== undefined && dados.salario_atual !== null && dados.salario_atual < 0) {
      return { valido: false, erro: 'Salário não pode ser negativo' }
    }

    return { valido: true }
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

interface ValidationResult {
  valido: boolean
  erro?: string
}
