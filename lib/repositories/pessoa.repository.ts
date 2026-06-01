import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  Pessoa,
  PessoaInsert,
  PessoaUpdate,
  StatusPessoa,
  PessoaComRelacionamentos,
} from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

/**
 * Pessoa Repository
 *
 * Repository para acesso a dados da tabela 'pessoa'.
 * IMPORTANTE: Apenas acessa dados. Lógica de negócio vai em PessoaService.
 */
export class PessoaRepository extends BaseRepository<'pessoa', Pessoa, PessoaInsert, PessoaUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'pessoa')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca pessoa com todos os relacionamentos
   */
  async findByIdWithRelationships(id: string): Promise<PessoaComRelacionamentos | null> {
    const { data, error } = await this.supabase
      .from('pessoa')
      .select(`
        *,
        cargo:cargo!cargo_id(
          *,
          trilha:trilha_carreira!trilha_id(*),
          nivel:nivel!nivel_id(*)
        ),
        time:time!time_id(
          *,
          gestor:pessoa!gestor_id(*),
          time_pai:time!time_pai_id(*)
        ),
        tags:pessoa_tag(
          tag:tag!tag_id(*)
        ),
        projetos:pessoa_projeto_produto(
          *,
          projeto_produto:projeto_produto!projeto_produto_id(*)
        ),
        historico_cargos:historico_cargo(
          *,
          cargo:cargo!cargo_id(*)
        ),
        historico_times:historico_time(
          *,
          time:time!time_id(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar pessoa com relacionamentos', error)
    }

    return data as PessoaComRelacionamentos
  }

  /**
   * Busca pessoa com relacionamentos básicos (sem histórico)
   */
  async findByIdWithBasicRelationships(id: string): Promise<PessoaComRelacionamentosBasicos | null> {
    const { data, error } = await this.supabase
      .from('pessoa')
      .select(`
        *,
        cargo:cargo!cargo_id(
          *,
          trilha:trilha_carreira!trilha_id(*),
          nivel:nivel!nivel_id(*)
        ),
        time:time!time_id(*),
        tags:pessoa_tag(
          tag:tag!tag_id(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar pessoa com relacionamentos básicos', error)
    }

    return data
  }

  /**
   * Busca pessoas por time
   */
  async findByTimeId(timeId: string): Promise<Pessoa[]> {
    return this.executeQuery((query) => query.eq('time_id', timeId))
  }

  /**
   * Busca pessoas por cargo
   */
  async findByCargoId(cargoId: string): Promise<Pessoa[]> {
    return this.executeQuery((query) => query.eq('cargo_id', cargoId))
  }

  /**
   * Busca pessoas por cargo com nome do time (join)
   */
  async findByCargoIdWithTime(cargoId: string): Promise<Array<Pessoa & { time_nome: string | null }>> {
    const { data, error } = await this.supabase
      .from('pessoa')
      .select('*, time:time!time_id(nome)')
      .eq('cargo_id', cargoId)
      .eq('ativo', true)

    if (error) throw new RepositoryError('Erro ao buscar pessoas por cargo', error)

    return (data ?? []).map((p) => ({
      ...p,
      time_nome: (p.time as { nome: string } | null)?.nome ?? null,
    }))
  }

  /**
   * Busca pessoas por status
   */
  async findByStatus(status: StatusPessoa): Promise<Pessoa[]> {
    return this.executeQuery((query) => query.eq('status', status))
  }

  /**
   * Busca pessoas ativas (status = 'ativo')
   */
  async findAtivas(): Promise<Pessoa[]> {
    return this.findByStatus('ativo')
  }

  /**
   * Busca pessoas por nome (case-insensitive)
   */
  async findByNome(nome: string): Promise<Pessoa[]> {
    return this.executeQuery((query) => query.ilike('nome', `%${nome}%`))
  }

  /**
   * Busca pessoas por email corporativo
   */
  async findByEmailCorporativo(email: string): Promise<Pessoa | null> {
    return this.executeQuerySingle((query) => query.eq('email_corporativo', email))
  }

  /**
   * Busca pessoas sem time
   */
  async findWithoutTime(): Promise<Pessoa[]> {
    return this.executeQuery((query) => query.is('time_id', null))
  }

  /**
   * Busca pessoas sem cargo
   */
  async findWithoutCargo(): Promise<Pessoa[]> {
    return this.executeQuery((query) => query.is('cargo_id', null))
  }

  /**
   * Busca pessoas por projeto
   */
  async findByProjetoId(projetoId: string): Promise<Pessoa[]> {
    const { data, error } = await this.supabase
      .from('pessoa_projeto_produto')
      .select('pessoa:pessoa!pessoa_id(*)')
      .eq('projeto_produto_id', projetoId)
      .eq('ativo', true)

    if (error) {
      throw new RepositoryError('Erro ao buscar pessoas por projeto', error)
    }

    return (data as Array<{ pessoa: Pessoa }> | null)?.map((item) => item.pessoa) ?? []
  }

  /**
   * Busca pessoas ativas em cargos de uma trilha,
   * incluindo nome do cargo, nível e time.
   * Usa duas queries para evitar comportamento incerto do filtro PostgREST em colunas de join.
   */
  async findByTrilhaId(trilhaId: string): Promise<Array<Pessoa & { cargo_nome: string | null; nivel_nome: string | null; time_nome: string | null }>> {
    // 1. Busca IDs de cargos ativos da trilha
    const { data: cargos, error: cargoError } = await this.supabase
      .from('cargo')
      .select('id, nome, nivel:nivel!nivel_id(nome)')
      .eq('trilha_id', trilhaId)
      .eq('ativo', true)

    if (cargoError) throw new RepositoryError('Erro ao buscar cargos da trilha', cargoError)
    if (!cargos || cargos.length === 0) return []

    const cargoMap = new Map(cargos.map((c) => [
      c.id,
      {
        nome: c.nome,
        nivel_nome: (c.nivel as { nome: string } | null)?.nome ?? null,
      },
    ]))

    // 2. Busca pessoas ativas com esses cargo_ids
    const { data, error } = await this.supabase
      .from('pessoa')
      .select('*, time:time!time_id(nome)')
      .in('cargo_id', [...cargoMap.keys()])
      .eq('ativo', true)

    if (error) throw new RepositoryError('Erro ao buscar pessoas da trilha', error)

    return (data ?? []).map((p) => ({
      ...p,
      cargo_nome: p.cargo_id ? (cargoMap.get(p.cargo_id)?.nome ?? null) : null,
      nivel_nome: p.cargo_id ? (cargoMap.get(p.cargo_id)?.nivel_nome ?? null) : null,
      time_nome: (p.time as { nome: string } | null)?.nome ?? null,
    }))
  }

  /**
   * Busca pessoas por tag
   */
  async findByTagId(tagId: string): Promise<Pessoa[]> {
    const { data, error } = await this.supabase
      .from('pessoa_tag')
      .select('pessoa:pessoa!pessoa_id(*)')
      .eq('tag_id', tagId)

    if (error) {
      throw new RepositoryError('Erro ao buscar pessoas por tag', error)
    }

    return (data as Array<{ pessoa: Pessoa }> | null)?.map((item) => item.pessoa) ?? []
  }

  /**
   * Busca pessoas por múltiplos IDs de times (hierarquia)
   */
  async findByTimeIds(timeIds: string[]): Promise<Pessoa[]> {
    return this.executeQuery((query) => query.in('time_id', timeIds))
  }

  /**
   * Conta pessoas por status
   */
  async countByStatus(status: StatusPessoa): Promise<number> {
    return this.count({ status })
  }

  /**
   * Conta pessoas por time
   */
  async countByTimeId(timeId: string): Promise<number> {
    return this.count({ time_id: timeId })
  }

  /**
   * Conta pessoas por cargo
   */
  async countByCargoId(cargoId: string): Promise<number> {
    return this.count({ cargo_id: cargoId })
  }

  /**
   * Busca com filtros avançados
   */
  async findWithFilters(filters: PessoaFilters): Promise<Pessoa[]> {
    let query = this.supabase.from('pessoa').select('*')

    // Filtro de busca por nome
    if (filters.busca) {
      query = query.or(`nome.ilike.%${filters.busca}%,email_corporativo.ilike.%${filters.busca}%`)
    }

    // Filtro por time
    if (filters.time_id) {
      query = query.eq('time_id', filters.time_id)
    }

    // Filtro por cargo
    if (filters.cargo_id) {
      query = query.eq('cargo_id', filters.cargo_id)
    }

    // Filtro por status
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    // Filtro por ativo
    if (filters.ativo !== undefined) {
      query = query.eq('ativo', filters.ativo)
    }

    const { data, error } = await query

    if (error) {
      throw new RepositoryError('Erro ao buscar pessoas com filtros', error)
    }

    return (data || [])
  }

  /**
   * Busca pessoas com filtros, paginação e hierarquia (para lista de pessoas).
   * Não expõe salário — remuneração é anexada pelo chamador via PessoaService.
   */
  async findComFiltrosPaginados(params: {
    filters: { search?: string; timeId?: string; cargoId?: string; status?: string }
    timeIdsHierarquia?: string[]
    pagination: { page: number; itemsPerPage: number }
  }): Promise<{ data: unknown[]; count: number | null }> {
    const { filters, timeIdsHierarquia, pagination } = params
    const selectFields = `
      id, nome, nome_social, email_corporativo, email_pessoal,
      foto_url, status, data_entrada, time_id,
      cargo:cargo_id (id, nome, nivel:nivel_id (nome), trilha:trilha_id (nome)),
      time:time_id (id, nome),
      tags:pessoa_tag (tag:tag_id (id, nome, cor))
    `
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.supabase
      .from('pessoa')
      .select(selectFields, { count: 'exact' })
      .eq('ativo', true)

    if (timeIdsHierarquia && timeIdsHierarquia.length > 0) {
      query = query.in('time_id', timeIdsHierarquia)
    }
    if (filters.search) {
      query = query.or(
        `nome.ilike.%${filters.search}%,email_corporativo.ilike.%${filters.search}%,email_pessoal.ilike.%${filters.search}%`
      )
    }
    if (filters.timeId && filters.timeId !== 'todos') {
      query = query.eq('time_id', filters.timeId)
    }
    if (filters.cargoId) {
      query = query.eq('cargo_id', filters.cargoId)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    query = query.order('nome')
    const from = (pagination.page - 1) * pagination.itemsPerPage
    const to = from + pagination.itemsPerPage - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw new RepositoryError('Erro ao buscar pessoas com filtros', error)
    return { data: data ?? [], count }
  }

  /**
   * Busca pessoas para seleção (ex.: modal de gestor de time).
   * Retorna id, nome e nomes de cargo/time (joins básicos).
   */
  async findParaSelecao(timeIdsHierarquia?: string[]): Promise<PessoaParaSelecao[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.supabase
      .from('pessoa')
      .select(`id, nome, cargo:cargo!cargo_id(nome), time:time!time_id(nome)`)
      .eq('ativo', true)
      .order('nome')

    if (timeIdsHierarquia && timeIdsHierarquia.length > 0) {
      query = query.in('time_id', timeIdsHierarquia)
    }

    const { data, error } = await query
    if (error) throw new RepositoryError('Erro ao buscar pessoas para seleção', error)
    return (data ?? []) as PessoaParaSelecao[]
  }

  /**
   * Conta pessoas ativas com status 'ativo', filtradas opcionalmente por times.
   */
  async countAtivasComStatus(timeIds?: string[]): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.supabase
      .from('pessoa')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .eq('status', 'ativo')

    if (timeIds && timeIds.length > 0) {
      query = query.in('time_id', timeIds)
    }

    const { count, error } = await query
    if (error) throw new RepositoryError('Erro ao contar pessoas ativas', error)
    return count || 0
  }

  /**
   * Conta pessoas ativas criadas num período (para tendências do dashboard).
   * dataFim exclusivo (lt). Se omitido, sem limite superior.
   */
  async countCriadasNoPeriodo(dataInicio: string, dataFim?: string, timeIds?: string[]): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.supabase
      .from('pessoa')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .gte('created_at', dataInicio)

    if (dataFim) {
      query = query.lt('created_at', dataFim)
    }
    if (timeIds && timeIds.length > 0) {
      query = query.in('time_id', timeIds)
    }

    const { count, error } = await query
    if (error) throw new RepositoryError('Erro ao contar pessoas por período', error)
    return count || 0
  }

  /**
   * Busca pessoas ativas com cargo e nível para distribuição por nível.
   */
  async findParaNivelDistribuicao(timeIds?: string[]): Promise<PessoaParaNivel[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.supabase
      .from('pessoa')
      .select(`id, cargo:cargo_id (id, nivel:nivel_id (id, nome))`)
      .eq('ativo', true)
      .eq('status', 'ativo')

    if (timeIds && timeIds.length > 0) {
      query = query.in('time_id', timeIds)
    }

    const { data, error } = await query
    if (error) throw new RepositoryError('Erro ao buscar distribuição por nível', error)
    return (data ?? []) as PessoaParaNivel[]
  }

  /**
   * Busca pessoas ativas com time para distribuição por time.
   */
  async findParaTimeDistribuicao(timeIds?: string[]): Promise<PessoaParaTime[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = this.supabase
      .from('pessoa')
      .select(`id, time:time_id (id, nome)`)
      .eq('ativo', true)
      .eq('status', 'ativo')

    if (timeIds && timeIds.length > 0) {
      query = query.in('time_id', timeIds)
    }

    const { data, error } = await query
    if (error) throw new RepositoryError('Erro ao buscar distribuição por time', error)
    return (data ?? []) as PessoaParaTime[]
  }

  /**
   * Verifica se email corporativo já está em uso
   */
  async emailCorporativoExists(email: string, excludePessoaId?: string): Promise<boolean> {
    let query = this.supabase
      .from('pessoa')
      .select('id')
      .eq('email_corporativo', email)

    if (excludePessoaId) {
      query = query.neq('id', excludePessoaId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError('Erro ao verificar email corporativo', error)
    }

    return !!data
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface PessoaComRelacionamentosBasicos extends Pessoa {
  cargo?: {
    id: string
    nome: string
    trilha?: {
      id: string
      nome: string
    }
    nivel?: {
      id: string
      nome: string
    }
  } | null
  time?: {
    id: string
    nome: string
  } | null
  tags?: Array<{
    tag: {
      id: string
      nome: string
      cor: string
    }
  }>
}

export interface PessoaFilters {
  busca?: string
  time_id?: string
  cargo_id?: string
  status?: StatusPessoa
  ativo?: boolean
}

export interface PessoaParaSelecao {
  id: string
  nome: string
  cargo?: { nome?: string | null } | null
  time?: { nome?: string | null } | null
}

export interface PessoaParaNivel {
  id: string
  cargo?: { nivel?: { nome?: string | null } | null } | null
}

export interface PessoaParaTime {
  id: string
  time?: { nome?: string | null } | null
}
