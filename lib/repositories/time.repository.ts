import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Time, TimeInsert, TimeUpdate, TimeComRelacionamentos } from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

/**
 * Time Repository
 *
 * Repository para acesso a dados da tabela 'time'.
 * IMPORTANTE: Apenas acessa dados. Lógica de negócio vai em TimeService.
 */
export class TimeRepository extends BaseRepository<'time', Time, TimeInsert, TimeUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'time')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca time com todos os relacionamentos
   */
  async findByIdWithRelationships(id: string): Promise<TimeComRelacionamentos | null> {
    const { data, error } = await this.supabase
      .from('time')
      .select(`
        *,
        gestor:gestor_id (*),
        time_pai:time_pai_id (*),
        times_filhos:time!time_pai_id (*),
        membros:pessoa (
          *,
          cargo:cargo_id (*)
        ),
        vagas:vaga_time (
          *,
          cargo:cargo_id (
            *,
            trilha:trilha_id (*),
            nivel:nivel_id (*)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar time com relacionamentos', error)
    }

    return data as TimeComRelacionamentos
  }

  /**
   * Busca time com relacionamentos básicos (sem membros e vagas)
   */
  async findByIdWithBasicRelationships(id: string): Promise<TimeComRelacionamentosBasicos | null> {
    const { data, error } = await this.supabase
      .from('time')
      .select(`
        *,
        gestor:gestor_id (*),
        time_pai:time_pai_id (*),
        times_filhos:time!time_pai_id (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar time com relacionamentos básicos', error)
    }

    return data as TimeComRelacionamentosBasicos
  }

  /**
   * Busca times filhos de um time pai
   */
  async findByTimePaiId(timePaiId: string): Promise<Time[]> {
    return this.executeQuery((query) => query.eq('time_pai_id', timePaiId))
  }

  /**
   * Busca times que não têm time pai (times raiz)
   */
  async findRootTeams(): Promise<Time[]> {
    return this.executeQuery((query) => query.is('time_pai_id', null))
  }

  /**
   * Busca times gerenciados por uma pessoa
   */
  async findByGestorId(gestorId: string): Promise<Time[]> {
    return this.executeQuery((query) => query.eq('gestor_id', gestorId))
  }

  /**
   * Busca times sem gestor
   */
  async findWithoutGestor(): Promise<Time[]> {
    return this.executeQuery((query) => query.is('gestor_id', null))
  }

  /**
   * Busca times por nome (case-insensitive)
   */
  async findByNome(nome: string): Promise<Time[]> {
    return this.executeQuery((query) => query.ilike('nome', `%${nome}%`))
  }

  /**
   * Busca toda a hierarquia de um time (todos os filhos recursivamente)
   * NOTA: Esta implementação busca apenas 1 nível. Para hierarquia completa,
   * use o serviço que implementa recursão.
   */
  async findHierarchy(timeId: string): Promise<TimeHierarchy | null> {
    const time = await this.findByIdWithBasicRelationships(timeId)

    if (!time) {
      return null
    }

    const filhos = await this.findByTimePaiId(timeId)

    return {
      ...time,
      filhos,
    }
  }

  /**
   * Busca times com vagas abertas
   */
  async findWithVagas(): Promise<Time[]> {
    const { data, error } = await this.supabase
      .from('time')
      .select(`
        *,
        vagas:vaga_time!inner (id)
      `)
      .eq('vaga_time.ativo', true)
      .eq('ativo', true)

    if (error) {
      throw new RepositoryError('Erro ao buscar times com vagas', error)
    }

    return (data || []) as Time[]
  }

  /**
   * Conta membros de um time
   */
  async countMembros(timeId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('pessoa')
      .select('*', { count: 'exact', head: true })
      .eq('time_id', timeId)
      .eq('ativo', true)

    if (error) {
      throw new RepositoryError('Erro ao contar membros do time', error)
    }

    return count || 0
  }

  /**
   * Conta vagas abertas de um time
   */
  async countVagas(timeId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('vaga_time')
      .select('quantidade')
      .eq('time_id', timeId)
      .eq('ativo', true)

    if (error) {
      throw new RepositoryError('Erro ao contar vagas do time', error)
    }

    return (data || []).reduce((total, vaga) => total + vaga.quantidade, 0)
  }

  /**
   * Conta times filhos de um time
   */
  async countFilhos(timeId: string): Promise<number> {
    return this.count({ time_pai_id: timeId })
  }

  /**
   * Verifica se um time é ancestral de outro (para evitar ciclos)
   * NOTA: Esta verificação básica vai apenas 1 nível. Para verificação completa,
   * use o serviço que implementa recursão.
   */
  async isAncestor(timeId: string, possibleDescendantId: string): Promise<boolean> {
    const descendant = await this.findById(possibleDescendantId)

    if (!descendant || !descendant.time_pai_id) {
      return false
    }

    return descendant.time_pai_id === timeId
  }

  /**
   * Busca com filtros
   */
  async findWithFilters(filters: TimeFilters): Promise<Time[]> {
    let query = this.supabase.from('time').select('*')

    // Filtro de busca por nome
    if (filters.busca) {
      query = query.ilike('nome', `%${filters.busca}%`)
    }

    // Filtro por time pai
    if (filters.time_pai_id) {
      query = query.eq('time_pai_id', filters.time_pai_id)
    }

    // Filtro por gestor
    if (filters.gestor_id) {
      query = query.eq('gestor_id', filters.gestor_id)
    }

    // Filtro por ativo
    if (filters.ativo !== undefined) {
      query = query.eq('ativo', filters.ativo)
    }

    // Filtro apenas times raiz
    if (filters.apenas_raiz) {
      query = query.is('time_pai_id', null)
    }

    const { data, error } = await query

    if (error) {
      throw new RepositoryError('Erro ao buscar times com filtros', error)
    }

    return (data || []) as Time[]
  }

  /**
   * Busca todos os IDs da hierarquia (time + todos os descendentes)
   * NOTA: Implementação simplificada (1 nível). Para hierarquia completa,
   * use o serviço.
   */
  async getHierarchyIds(timeId: string): Promise<string[]> {
    const ids = [timeId]
    const filhos = await this.findByTimePaiId(timeId)

    filhos.forEach((filho) => {
      ids.push(filho.id)
    })

    return ids
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface TimeComRelacionamentosBasicos extends Time {
  gestor?: {
    id: string
    nome: string
    email_corporativo: string | null
  } | null
  time_pai?: {
    id: string
    nome: string
  } | null
  times_filhos?: Array<{
    id: string
    nome: string
  }>
}

export interface TimeHierarchy extends TimeComRelacionamentosBasicos {
  filhos: Time[]
}

export interface TimeFilters {
  busca?: string
  time_pai_id?: string
  gestor_id?: string
  ativo?: boolean
  apenas_raiz?: boolean
}
