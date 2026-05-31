import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, VagaTime, VagaTimeInsert, VagaTimeUpdate, Usuario } from '@/lib/types'
import { VagaTimeRepository, TimeRepository, CargoRepository } from '@/lib/repositories'
import { AuditoriaService } from './auditoria.service'
import { PermissaoService } from './permissao.service'

/**
 * Vaga Service
 *
 * Service para gerenciamento de vagas em times.
 *
 * RESPONSABILIDADES:
 * - Validações
 * - CRUD de vagas
 * - Busca de vagas por time/cargo
 * - Registro de auditoria
 * - Verificação de permissões
 */
export class VagaService {
  private supabase: SupabaseClient<Database>
  private vagaRepo: VagaTimeRepository
  private timeRepo: TimeRepository
  private cargoRepo: CargoRepository
  private auditoriaService: AuditoriaService
  private permissaoService: PermissaoService

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.vagaRepo = new VagaTimeRepository(supabase)
    this.timeRepo = new TimeRepository(supabase)
    this.cargoRepo = new CargoRepository(supabase)
    this.auditoriaService = new AuditoriaService(supabase)
    this.permissaoService = new PermissaoService(supabase)
  }

  // ==========================================================================
  // CRUD COM LÓGICA DE NEGÓCIO
  // ==========================================================================

  /**
   * Cria uma vaga
   *
   * LÓGICA:
   * 1. Valida dados
   * 2. Verifica permissões
   * 3. Verifica se já existe vaga para time+cargo
   * 4. Cria vaga
   * 5. Registra auditoria
   */
  async criar(timeId: string, cargoId: string, quantidade: number, usuarioLogado: Usuario): Promise<ServiceResult<VagaTime>> {
    try {
      // 1. VALIDAÇÕES
      const validacao = await this.validar({ time_id: timeId, cargo_id: cargoId, quantidade })
      if (!validacao.valido) {
        return { success: false, error: validacao.erro }
      }

      // 2. PERMISSÕES
      if (!this.permissaoService.podeCriar(usuarioLogado, 'time')) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'criar vagas'),
        }
      }

      // 3. VERIFICAR SE JÁ EXISTE
      const jaExiste = await this.vagaRepo.existsByTimeAndCargo(timeId, cargoId)
      if (jaExiste) {
        return {
          success: false,
          error: 'Já existe uma vaga para este time e cargo. Edite a vaga existente.',
        }
      }

      // 4. CRIAR VAGA
      const vaga = await this.vagaRepo.create({
        time_id: timeId,
        cargo_id: cargoId,
        quantidade,
        ativo: true,
      })

      // 5. AUDITORIA
      await this.auditoriaService.registrarCriacao('vaga_time', vaga.id, vaga, usuarioLogado.id)

      return { success: true, data: vaga }
    } catch (error) {
      console.error('[VagaService] Erro ao criar vaga:', error)
      return { success: false, error: 'Erro ao criar vaga. Tente novamente.' }
    }
  }

  /**
   * Atualiza uma vaga
   */
  async atualizar(id: string, dados: VagaTimeUpdate, usuarioLogado: Usuario): Promise<ServiceResult<VagaTime>> {
    try {
      // 1. VALIDAÇÕES
      const validacao = await this.validar(dados, id)
      if (!validacao.valido) {
        return { success: false, error: validacao.erro }
      }

      // 2. PERMISSÕES
      const vaga = await this.vagaRepo.findById(id)
      if (!vaga) {
        return { success: false, error: 'Vaga não encontrada' }
      }

      const podeEditar = await this.permissaoService.podeEditar(usuarioLogado, 'time', vaga.time_id)
      if (!podeEditar) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'editar vagas'),
        }
      }

      // 3. ATUALIZAR VAGA
      const vagaAnterior = vaga
      const vagaAtualizada = await this.vagaRepo.update(id, dados)

      // 4. AUDITORIA
      await this.auditoriaService.registrarMudancas('vaga_time', id, vagaAnterior, vagaAtualizada, usuarioLogado.id)

      return { success: true, data: vagaAtualizada }
    } catch (error) {
      console.error('[VagaService] Erro ao atualizar vaga:', error)
      return { success: false, error: 'Erro ao atualizar vaga. Tente novamente.' }
    }
  }

  /**
   * Desativa uma vaga
   */
  async desativar(id: string, usuarioLogado: Usuario): Promise<ServiceResult<VagaTime>> {
    try {
      const vaga = await this.vagaRepo.findById(id)
      if (!vaga) {
        return { success: false, error: 'Vaga não encontrada' }
      }

      const podeEditar = await this.permissaoService.podeEditar(usuarioLogado, 'time', vaga.time_id)
      if (!podeEditar) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'desativar vagas'),
        }
      }

      const vagaDesativada = await this.vagaRepo.softDelete(id)
      await this.auditoriaService.registrarEdicao('vaga_time', id, 'ativo', true, false, usuarioLogado.id)

      return { success: true, data: vagaDesativada }
    } catch (error) {
      console.error('[VagaService] Erro ao desativar vaga:', error)
      return { success: false, error: 'Erro ao desativar vaga. Tente novamente.' }
    }
  }

  /**
   * Deleta uma vaga (hard delete)
   */
  async deletar(id: string, usuarioLogado: Usuario): Promise<ServiceResult<void>> {
    try {
      const vaga = await this.vagaRepo.findById(id)
      if (!vaga) {
        return { success: false, error: 'Vaga não encontrada' }
      }

      const podeEditar = await this.permissaoService.podeEditar(usuarioLogado, 'time', vaga.time_id)
      if (!podeEditar) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'deletar vagas'),
        }
      }

      await this.auditoriaService.registrarExclusao('vaga_time', id, vaga, usuarioLogado.id)
      await this.vagaRepo.delete(id)

      return { success: true }
    } catch (error) {
      console.error('[VagaService] Erro ao deletar vaga:', error)
      return { success: false, error: 'Erro ao deletar vaga. Tente novamente.' }
    }
  }

  // ==========================================================================
  // BUSCA
  // ==========================================================================

  /**
   * Busca vagas de um time
   */
  async buscarVagasTime(timeId: string) {
    return await this.vagaRepo.findByTimeIdWithRelationships(timeId)
  }

  /**
   * Busca vagas ativas de um time
   */
  async buscarVagasAtivasTime(timeId: string) {
    const vagas = await this.vagaRepo.findByTimeIdWithRelationships(timeId)
    return vagas.filter((v) => v.ativo)
  }

  /**
   * Busca vagas de um cargo
   */
  async buscarVagasCargo(cargoId: string) {
    return await this.vagaRepo.findByCargoIdWithRelationships(cargoId)
  }

  /**
   * Busca todas as vagas ativas do sistema
   */
  async buscarVagasAtivas() {
    return await this.vagaRepo.findActiveVagasWithRelationships()
  }

  /**
   * Conta total de vagas de um time
   */
  async contarVagasTime(timeId: string): Promise<number> {
    return await this.vagaRepo.countVagasByTime(timeId)
  }

  /**
   * Conta total de vagas de um cargo
   */
  async contarVagasCargo(cargoId: string): Promise<number> {
    return await this.vagaRepo.countVagasByCargo(cargoId)
  }

  /**
   * Conta total de vagas ativas do sistema
   */
  async contarVagasAtivas(): Promise<number> {
    return await this.vagaRepo.countTotalVagasAtivas()
  }

  // ==========================================================================
  // RELATÓRIOS
  // ==========================================================================

  /**
   * Gera relatório de vagas por time
   */
  async gerarRelatorioVagasPorTime() {
    const times = await this.timeRepo.findActive()
    const relatorio = []

    for (const time of times) {
      const totalVagas = await this.contarVagasTime(time.id)
      const vagas = await this.buscarVagasAtivasTime(time.id)

      relatorio.push({
        time: time.nome,
        total_vagas: totalVagas,
        vagas,
      })
    }

    return relatorio
  }

  /**
   * Gera relatório de vagas por cargo
   */
  async gerarRelatorioVagasPorCargo() {
    const cargos = await this.cargoRepo.findActive()
    const relatorio = []

    for (const cargo of cargos) {
      const totalVagas = await this.contarVagasCargo(cargo.id)
      const vagas = await this.buscarVagasCargo(cargo.id)

      relatorio.push({
        cargo: cargo.nome,
        total_vagas: totalVagas,
        vagas,
      })
    }

    return relatorio
  }

  // ==========================================================================
  // VALIDAÇÕES
  // ==========================================================================

  /**
   * Valida dados de vaga antes de salvar
   */
  private async validar(dados: VagaTimeInsert | VagaTimeUpdate, _id?: string): Promise<ValidationResult> {
    // Time obrigatório (apenas em criação)
    if ('time_id' in dados && !dados.time_id) {
      return { valido: false, erro: 'Time é obrigatório' }
    }

    // Cargo obrigatório (apenas em criação)
    if ('cargo_id' in dados && !dados.cargo_id) {
      return { valido: false, erro: 'Cargo é obrigatório' }
    }

    // Quantidade obrigatória e válida
    if ('quantidade' in dados) {
      if (!dados.quantidade || dados.quantidade < 1) {
        return { valido: false, erro: 'Quantidade deve ser maior que zero' }
      }
      if (dados.quantidade > 100) {
        return { valido: false, erro: 'Quantidade máxima é 100 vagas' }
      }
    }

    // Verifica se time existe
    if (dados.time_id) {
      const time = await this.timeRepo.findById(dados.time_id)
      if (!time) {
        return { valido: false, erro: 'Time não encontrado' }
      }
      if (!time.ativo) {
        return { valido: false, erro: 'Time está inativo' }
      }
    }

    // Verifica se cargo existe
    if (dados.cargo_id) {
      const cargo = await this.cargoRepo.findById(dados.cargo_id)
      if (!cargo) {
        return { valido: false, erro: 'Cargo não encontrado' }
      }
      if (!cargo.ativo) {
        return { valido: false, erro: 'Cargo está inativo' }
      }
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
