import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Time, TimeInsert, TimeUpdate, Usuario } from '@/lib/types'
import { TimeRepository, PessoaRepository } from '@/lib/repositories'
import { AuditoriaService } from './auditoria.service'
import { PermissaoService } from './permissao.service'

/**
 * Time Service
 *
 * Service para gerenciamento de times com hierarquia recursiva.
 *
 * RESPONSABILIDADES:
 * - Validações (incluindo prevenção de ciclos na hierarquia)
 * - Gerenciamento de hierarquia recursiva
 * - Busca de pessoas em times (incluindo subtimes)
 * - Registro de auditoria
 * - Verificação de permissões
 */
export class TimeService {
  private supabase: SupabaseClient<Database>
  private timeRepo: TimeRepository
  private pessoaRepo: PessoaRepository
  private auditoriaService: AuditoriaService
  private permissaoService: PermissaoService

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.timeRepo = new TimeRepository(supabase)
    this.pessoaRepo = new PessoaRepository(supabase)
    this.auditoriaService = new AuditoriaService(supabase)
    this.permissaoService = new PermissaoService(supabase)
  }

  // ==========================================================================
  // CRUD COM LÓGICA DE NEGÓCIO
  // ==========================================================================

  /**
   * Cria um novo time
   *
   * LÓGICA:
   * 1. Valida dados
   * 2. Valida hierarquia (previne ciclos)
   * 3. Verifica permissões
   * 4. Cria time
   * 5. Registra auditoria
   */
  async criar(dados: TimeInsert, usuarioLogado: Usuario): Promise<ServiceResult<Time>> {
    try {
      // 1. VALIDAÇÕES
      const validacao = await this.validar(dados)
      if (!validacao.valido) {
        return { success: false, error: validacao.erro }
      }

      // 2. VALIDAR HIERARQUIA (prevenir ciclos)
      if (dados.time_pai_id) {
        const temCiclo = await this.validarCiclos(dados.time_pai_id, null)
        if (temCiclo) {
          return { success: false, error: 'Hierarquia inválida: detectado ciclo na estrutura de times' }
        }
      }

      // 3. PERMISSÕES
      if (!this.permissaoService.podeCriar(usuarioLogado, 'time')) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'criar times'),
        }
      }

      // 4. CRIAR TIME
      const time = await this.timeRepo.create({
        ...dados,
        ativo: dados.ativo !== undefined ? dados.ativo : true,
      })

      // 5. AUDITORIA
      await this.auditoriaService.registrarCriacao('time', time.id, time, usuarioLogado.id)

      return { success: true, data: time }
    } catch (error) {
      console.error('[TimeService] Erro ao criar time:', error)
      return { success: false, error: 'Erro ao criar time. Tente novamente.' }
    }
  }

  /**
   * Atualiza um time
   *
   * LÓGICA:
   * 1. Valida dados
   * 2. Valida hierarquia (previne ciclos)
   * 3. Verifica permissões
   * 4. Atualiza time
   * 5. Registra auditoria
   */
  async atualizar(id: string, dados: TimeUpdate, usuarioLogado: Usuario): Promise<ServiceResult<Time>> {
    try {
      // 1. VALIDAÇÕES
      const validacao = await this.validar(dados, id)
      if (!validacao.valido) {
        return { success: false, error: validacao.erro }
      }

      // 2. VALIDAR HIERARQUIA (prevenir ciclos)
      if (dados.time_pai_id) {
        const temCiclo = await this.validarCiclos(dados.time_pai_id, id)
        if (temCiclo) {
          return { success: false, error: 'Hierarquia inválida: isto criaria um ciclo na estrutura de times' }
        }
      }

      // 3. PERMISSÕES
      const podeEditar = await this.permissaoService.podeEditar(usuarioLogado, 'time', id)
      if (!podeEditar) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'editar times'),
        }
      }

      // 4. BUSCAR TIME ANTERIOR
      const timeAnterior = await this.timeRepo.findById(id)
      if (!timeAnterior) {
        return { success: false, error: 'Time não encontrado' }
      }

      // 5. ATUALIZAR TIME
      const time = await this.timeRepo.update(id, dados)

      // 6. AUDITORIA
      await this.auditoriaService.registrarMudancas('time', id, timeAnterior, time, usuarioLogado.id)

      return { success: true, data: time }
    } catch (error) {
      console.error('[TimeService] Erro ao atualizar time:', error)
      return { success: false, error: 'Erro ao atualizar time. Tente novamente.' }
    }
  }

  /**
   * Desativa um time
   */
  async desativar(id: string, usuarioLogado: Usuario): Promise<ServiceResult<Time>> {
    try {
      const podeEditar = await this.permissaoService.podeEditar(usuarioLogado, 'time', id)
      if (!podeEditar) {
        return {
          success: false,
          error: this.permissaoService.getMensagemErroPermissao(usuarioLogado, 'desativar times'),
        }
      }

      const time = await this.timeRepo.softDelete(id)
      await this.auditoriaService.registrarEdicao('time', id, 'ativo', true, false, usuarioLogado.id)

      return { success: true, data: time }
    } catch (error) {
      console.error('[TimeService] Erro ao desativar time:', error)
      return { success: false, error: 'Erro ao desativar time. Tente novamente.' }
    }
  }

  // ==========================================================================
  // HIERARQUIA
  // ==========================================================================

  /**
   * Busca hierarquia completa de um time (recursivo)
   *
   * Retorna árvore com todos os times filhos, netos, bisnetos, etc.
   */
  async buscarHierarquia(timeId: string): Promise<TimeComHierarquia | null> {
    try {
      const time = await this.timeRepo.findById(timeId)

      if (!time) {
        return null
      }

      // Busca filhos diretos
      const filhos = await this.timeRepo.findByTimePaiId(timeId)

      // Recursivamente busca hierarquia de cada filho
      const filhosComHierarquia: TimeComHierarquia[] = []

      for (const filho of filhos) {
        const hierarquiaFilho = await this.buscarHierarquia(filho.id)
        if (hierarquiaFilho) {
          filhosComHierarquia.push(hierarquiaFilho)
        }
      }

      return {
        ...time,
        filhos: filhosComHierarquia,
      }
    } catch (error) {
      console.error('[TimeService] Erro ao buscar hierarquia:', error)
      return null
    }
  }

  /**
   * Valida se há ciclos na hierarquia
   *
   * Previne que um time seja pai dele mesmo (direta ou indiretamente)
   *
   * @param timePaiId ID do time pai
   * @param timeFilhoId ID do time filho (null se criando novo time)
   * @returns true se há ciclo, false se OK
   */
  async validarCiclos(timePaiId: string, timeFilhoId: string | null): Promise<boolean> {
    try {
      // Se está criando um novo time, não há ciclo
      if (!timeFilhoId) {
        return false
      }

      // Um time não pode ser pai dele mesmo
      if (timePaiId === timeFilhoId) {
        return true
      }

      // Busca toda a hierarquia acima do time pai
      const ancestrais = await this.buscarAncestras(timePaiId)

      // Se o time filho está nos ancestrais do pai, há ciclo
      return ancestrais.includes(timeFilhoId)
    } catch (error) {
      console.error('[TimeService] Erro ao validar ciclos:', error)
      return true // Em caso de erro, previne a operação
    }
  }

  /**
   * Busca todos os ancestrais de um time (recursivo)
   */
  private async buscarAncestras(timeId: string): Promise<string[]> {
    const time = await this.timeRepo.findById(timeId)

    if (!time || !time.time_pai_id) {
      return []
    }

    const ancestrais = [time.time_pai_id]
    const ancestraisSuperiores = await this.buscarAncestras(time.time_pai_id)

    return [...ancestrais, ...ancestraisSuperiores]
  }

  /**
   * Busca todos os descendentes de um time (recursivo)
   */
  async buscarDescendentes(timeId: string): Promise<string[]> {
    const filhos = await this.timeRepo.findByTimePaiId(timeId)
    const descendentes: string[] = []

    for (const filho of filhos) {
      descendentes.push(filho.id)
      const subDescendentes = await this.buscarDescendentes(filho.id)
      descendentes.push(...subDescendentes)
    }

    return descendentes
  }

  // ==========================================================================
  // BUSCA DE PESSOAS
  // ==========================================================================

  /**
   * Busca todas as pessoas de um time (com ou sem subtimes)
   *
   * @param timeId ID do time
   * @param incluirSubtimes Se true, inclui pessoas de todos os subtimes
   */
  async buscarPessoasTime(timeId: string, incluirSubtimes: boolean = false): Promise<any[]> {
    try {
      if (!incluirSubtimes) {
        // Apenas pessoas do time específico
        return await this.pessoaRepo.findByTimeId(timeId)
      }

      // Busca pessoas do time + todos os subtimes
      const timesIds = [timeId]
      const descendentes = await this.buscarDescendentes(timeId)
      timesIds.push(...descendentes)

      return await this.pessoaRepo.findByTimeIds(timesIds)
    } catch (error) {
      console.error('[TimeService] Erro ao buscar pessoas do time:', error)
      return []
    }
  }

  /**
   * Conta pessoas de um time (com ou sem subtimes)
   */
  async contarPessoasTime(timeId: string, incluirSubtimes: boolean = false): Promise<number> {
    const pessoas = await this.buscarPessoasTime(timeId, incluirSubtimes)
    return pessoas.length
  }

  // ==========================================================================
  // BUSCA COM PERMISSÕES
  // ==========================================================================

  /**
   * Busca times com filtro de permissão
   */
  async buscarComPermissao(usuarioLogado: Usuario, filtros?: any) {
    try {
      // Admin vê todos os times
      if (usuarioLogado.tipo_perfil === 'admin') {
        return await this.timeRepo.findWithFilters(filtros || {})
      }

      // Gestor: apenas sua hierarquia
      if (usuarioLogado.tipo_perfil === 'gestor') {
        const timesHierarquia = await this.permissaoService.getTimesHierarquia(usuarioLogado)

        if (timesHierarquia.length === 0) {
          return []
        }

        const times = await this.timeRepo.findAll()
        return times.filter((time) => timesHierarquia.includes(time.id))
      }

      // Visualizador vê todos
      if (usuarioLogado.tipo_perfil === 'visualizador') {
        return await this.timeRepo.findWithFilters(filtros || {})
      }

      return []
    } catch (error) {
      console.error('[TimeService] Erro ao buscar times:', error)
      return []
    }
  }

  // ==========================================================================
  // VALIDAÇÕES
  // ==========================================================================

  /**
   * Valida dados de time antes de salvar
   */
  private async validar(dados: TimeInsert | TimeUpdate, id?: string): Promise<ValidationResult> {
    // Nome obrigatório (apenas em criação)
    if ('nome' in dados && !dados.nome) {
      return { valido: false, erro: 'Nome é obrigatório' }
    }

    // Gestor deve ser uma pessoa válida
    if (dados.gestor_id) {
      const gestor = await this.pessoaRepo.findById(dados.gestor_id)
      if (!gestor) {
        return { valido: false, erro: 'Gestor não encontrado' }
      }
      if (!gestor.ativo) {
        return { valido: false, erro: 'Gestor está inativo' }
      }
    }

    // Time pai deve existir
    if (dados.time_pai_id) {
      const timePai = await this.timeRepo.findById(dados.time_pai_id)
      if (!timePai) {
        return { valido: false, erro: 'Time pai não encontrado' }
      }
      if (!timePai.ativo) {
        return { valido: false, erro: 'Time pai está inativo' }
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

export interface TimeComHierarquia extends Time {
  filhos: TimeComHierarquia[]
}
