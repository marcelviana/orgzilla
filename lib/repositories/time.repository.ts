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
        gestor:pessoa!gestor_id(*),
        time_pai:time!time_pai_id(*),
        times_filhos:time!time_pai_id(*),
        membros:pessoa!pessoa_time_id_fkey(
          *,
          cargo:cargo!cargo_id(*)
        ),
        vagas:vaga_time(
          *,
          cargo:cargo!cargo_id(
            *,
            trilha:trilha_carreira!trilha_id(*),
            nivel:nivel!nivel_id(*)
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

    // Supabase infere times_filhos como objeto | null na auto-referência; normalizamos para array
    const normalized = {
      ...data,
      times_filhos: Array.isArray(data.times_filhos)
        ? data.times_filhos
        : data.times_filhos
          ? [data.times_filhos]
          : [],
    }
    return normalized as unknown as TimeComRelacionamentos
  }

  /**
   * Busca time com relacionamentos básicos (sem membros e vagas)
   */
  async findByIdWithBasicRelationships(id: string): Promise<TimeComRelacionamentosBasicos | null> {
    const { data, error } = await this.supabase
      .from('time')
      .select(`
        *,
        gestor:pessoa!gestor_id(*),
        time_pai:time!time_pai_id(*),
        times_filhos:time!time_pai_id(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar time com relacionamentos básicos', error)
    }

    const normalizedBasico = {
      ...data,
      times_filhos: Array.isArray(data.times_filhos)
        ? data.times_filhos
        : data.times_filhos
          ? [data.times_filhos]
          : [],
    }
    return normalizedBasico as unknown as TimeComRelacionamentosBasicos
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

    return (data || [])
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

    return (data || [])
  }

  /**
   * Busca times ativos para dropdown de filtro.
   * Se timeIds for fornecido, restringe ao subconjunto (hierarquia do gestor).
   */
  async findAtivosParaFiltro(timeIds?: string[]): Promise<Array<{ id: string; nome: string }>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.supabase
      .from('time')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')

    if (timeIds && timeIds.length > 0) {
      query = query.in('id', timeIds)
    }

    const { data, error } = await query
    if (error) throw new RepositoryError('Erro ao buscar times para filtro', error)
    return (data ?? []) as Array<{ id: string; nome: string }>
  }

  /**
   * Busca estatísticas agregadas para uma lista de times em 4 queries fixas.
   * Substitui as 4N queries de countMembros/countVagas/countFilhos/findByIdWithBasicRelationships.
   */
  async findEstatisticasAgregadas(timeIds: string[]): Promise<Map<string, {
    membros: number
    vagas: number
    filhos: number
    gestor: { id: string; nome: string; email_corporativo: string | null } | null
    time_pai: { id: string; nome: string } | null
  }>> {
    if (timeIds.length === 0) return new Map()

    const { data: membrosData, error: membrosError } = await this.supabase
      .from('pessoa')
      .select('time_id')
      .in('time_id', timeIds)
      .eq('ativo', true)

    if (membrosError) throw new RepositoryError('Erro ao agregar membros', membrosError)

    const { data: vagasData, error: vagasError } = await this.supabase
      .from('vaga_time')
      .select('time_id, quantidade')
      .in('time_id', timeIds)
      .eq('ativo', true)

    if (vagasError) throw new RepositoryError('Erro ao agregar vagas', vagasError)

    const { data: filhosData, error: filhosError } = await this.supabase
      .from('time')
      .select('time_pai_id')
      .in('time_pai_id', timeIds)
      .eq('ativo', true)

    if (filhosError) throw new RepositoryError('Erro ao agregar filhos', filhosError)

    const { data: relacionamentos, error: relError } = await this.supabase
      .from('time')
      .select(`
        id,
        gestor:pessoa!gestor_id(id, nome, email_corporativo),
        time_pai:time!time_pai_id(id, nome)
      `)
      .in('id', timeIds)
      .eq('ativo', true)

    if (relError) throw new RepositoryError('Erro ao buscar relacionamentos', relError)

    const membrosMap = new Map<string, number>()
    for (const m of membrosData ?? []) {
      if (m.time_id) membrosMap.set(m.time_id, (membrosMap.get(m.time_id) ?? 0) + 1)
    }

    const vagasMap = new Map<string, number>()
    for (const v of vagasData ?? []) {
      if (v.time_id) vagasMap.set(v.time_id, (vagasMap.get(v.time_id) ?? 0) + (v.quantidade ?? 0))
    }

    const filhosMap = new Map<string, number>()
    for (const f of filhosData ?? []) {
      if (f.time_pai_id) filhosMap.set(f.time_pai_id, (filhosMap.get(f.time_pai_id) ?? 0) + 1)
    }

    const result = new Map<string, {
      membros: number; vagas: number; filhos: number
      gestor: { id: string; nome: string; email_corporativo: string | null } | null
      time_pai: { id: string; nome: string } | null
    }>()

    for (const rel of relacionamentos ?? []) {
      result.set(rel.id, {
        membros: membrosMap.get(rel.id) ?? 0,
        vagas: vagasMap.get(rel.id) ?? 0,
        filhos: filhosMap.get(rel.id) ?? 0,
        gestor: (rel.gestor as { id: string; nome: string; email_corporativo: string | null } | null) ?? null,
        time_pai: (rel.time_pai as { id: string; nome: string } | null) ?? null,
      })
    }

    return result
  }

  /**
   * Conta times ativos, opcionalmente restrito a um subconjunto de IDs.
   */
  async countAtivos(timeIds?: string[]): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.supabase
      .from('time')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)

    if (timeIds && timeIds.length > 0) {
      query = query.in('id', timeIds)
    }

    const { count, error } = await query
    if (error) throw new RepositoryError('Erro ao contar times ativos', error)
    return count || 0
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
