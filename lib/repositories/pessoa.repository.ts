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
