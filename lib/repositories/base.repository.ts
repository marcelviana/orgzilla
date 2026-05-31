import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

type FilterValue = string | number | boolean | null | undefined | Array<string | number | boolean>

type Filters = Record<string, FilterValue>

type QueryResult = { data: unknown; error: PostgrestError | null; count?: number | null }

/**
 * Interface estrutural mínima do query builder do PostgREST.
 *
 * O tipo concreto retornado por `supabase.from(table).select(...)` depende
 * das relações da tabela (inferência genérica) e o resolver do ESLint o trata
 * como `any`. Em vez de propagar `any`, descrevemos aqui apenas os métodos
 * encadeáveis que os repositories realmente usam, mantendo type-safety.
 */
interface SelectQueryBuilder extends PromiseLike<QueryResult> {
  eq: (column: string, value: FilterValue) => SelectQueryBuilder
  neq: (column: string, value: FilterValue) => SelectQueryBuilder
  in: (column: string, values: Array<string | number | boolean>) => SelectQueryBuilder
  is: (column: string, value: null | boolean) => SelectQueryBuilder
  gte: (column: string, value: string | number) => SelectQueryBuilder
  lte: (column: string, value: string | number) => SelectQueryBuilder
  gt: (column: string, value: string | number) => SelectQueryBuilder
  lt: (column: string, value: string | number) => SelectQueryBuilder
  like: (column: string, pattern: string) => SelectQueryBuilder
  ilike: (column: string, pattern: string) => SelectQueryBuilder
  or: (filters: string) => SelectQueryBuilder
  contains: (column: string, value: unknown) => SelectQueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => SelectQueryBuilder
  range: (from: number, to: number) => SelectQueryBuilder
  limit: (count: number) => SelectQueryBuilder
  single: () => PromiseLike<QueryResult>
  maybeSingle: () => PromiseLike<QueryResult>
}

/**
 * Base Repository
 *
 * Repository genérico com operações CRUD básicas.
 * IMPORTANTE: Repositories apenas acessam dados. Lógica de negócio vai em Services.
 *
 * @template TableName - Nome da tabela no banco
 * @template Row - Tipo da linha (Row)
 * @template Insert - Tipo para inserção (Insert)
 * @template Update - Tipo para atualização (Update)
 */
export abstract class BaseRepository<
  TableName extends keyof Database['public']['Tables'],
  Row = Database['public']['Tables'][TableName]['Row'],
  Insert = Database['public']['Tables'][TableName]['Insert'],
  Update = Database['public']['Tables'][TableName]['Update']
> {
  protected readonly supabase: SupabaseClient<Database>
  protected readonly tableName: TableName

  constructor(supabase: SupabaseClient<Database>, tableName: TableName) {
    this.supabase = supabase
    this.tableName = tableName
  }

  // ==========================================================================
  // CRUD BÁSICO
  // ==========================================================================

  /**
   * Busca um registro por ID
   */
  async findById(id: string): Promise<Row | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw new RepositoryError(`Erro ao buscar ${this.tableName} por ID`, error)
    }

    return data as Row
  }

  /**
   * Busca todos os registros (sem paginação)
   * CUIDADO: Use apenas para tabelas pequenas
   */
  async findAll(): Promise<Row[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new RepositoryError(`Erro ao buscar todos ${this.tableName}`, error)
    }

    return (data || []) as Row[]
  }

  /**
   * Busca registros com paginação
   */
  async findMany(options: FindManyOptions = {}): Promise<PaginatedResult<Row>> {
    const {
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      orderDirection = 'desc',
      filters = {},
    } = options

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' }) as unknown as SelectQueryBuilder

    // Aplicar filtros
    query = this.applyFilters(query, filters)

    // Aplicar ordenação
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    // Aplicar paginação
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new RepositoryError(`Erro ao buscar ${this.tableName}`, error)
    }

    return {
      data: (data || []) as Row[],
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }
  }

  /**
   * Busca registros ativos (where ativo = true)
   */
  async findActive(): Promise<Row[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new RepositoryError(`Erro ao buscar ${this.tableName} ativos`, error)
    }

    return (data || []) as Row[]
  }

  /**
   * Cria um novo registro
   */
  async create(data: Insert): Promise<Row> {
    const { data: created, error } = await this.supabase
      .from(this.tableName)
      .insert(data as never)
      .select()
      .single()

    if (error) {
      throw new RepositoryError(`Erro ao criar ${this.tableName}`, error)
    }

    return created as Row
  }

  /**
   * Atualiza um registro por ID
   */
  async update(id: string, data: Update): Promise<Row> {
    const { data: updated, error } = await this.supabase
      .from(this.tableName)
      .update(data as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new RepositoryError(`Erro ao atualizar ${this.tableName}`, error)
    }

    return updated as Row
  }

  /**
   * Deleta um registro por ID (hard delete)
   * CUIDADO: Prefira usar softDelete quando possível
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) {
      throw new RepositoryError(`Erro ao deletar ${this.tableName}`, error)
    }
  }

  /**
   * Soft delete - marca como inativo
   * Funciona apenas para tabelas que têm campo 'ativo'
   */
  async softDelete(id: string): Promise<Row> {
    return this.update(id, { ativo: false } as Update)
  }

  /**
   * Reativa um registro marcado como inativo
   */
  async restore(id: string): Promise<Row> {
    return this.update(id, { ativo: true } as Update)
  }

  // ==========================================================================
  // MÉTODOS DE CONTAGEM
  // ==========================================================================

  /**
   * Conta total de registros
   */
  async count(filters: Filters = {}): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true }) as unknown as SelectQueryBuilder

    query = this.applyFilters(query, filters)

    const { count, error } = await query

    if (error) {
      throw new RepositoryError(`Erro ao contar ${this.tableName}`, error)
    }

    return count || 0
  }

  /**
   * Conta registros ativos
   */
  async countActive(): Promise<number> {
    return this.count({ ativo: true })
  }

  // ==========================================================================
  // MÉTODOS DE EXISTÊNCIA
  // ==========================================================================

  /**
   * Verifica se um registro existe por ID
   */
  async exists(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError(`Erro ao verificar existência em ${this.tableName}`, error)
    }

    return !!data
  }

  // ==========================================================================
  // MÉTODOS AUXILIARES
  // ==========================================================================

  /**
   * Aplica filtros à query
   * Subclasses podem sobrescrever para filtros customizados
   */
  protected applyFilters(query: SelectQueryBuilder, filters: Filters): SelectQueryBuilder {
    let result = query
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          result = result.in(key, value)
        } else {
          result = result.eq(key, value)
        }
      }
    })

    return result
  }

  /**
   * Busca com query customizada
   * Para casos onde os métodos padrão não são suficientes
   */
  protected async executeQuery<T = Row>(
    queryBuilder: (query: SelectQueryBuilder) => PromiseLike<QueryResult>
  ): Promise<T[]> {
    const baseQuery = this.supabase
      .from(this.tableName)
      .select('*') as unknown as SelectQueryBuilder
    const { data, error } = await queryBuilder(baseQuery)

    if (error) {
      throw new RepositoryError(`Erro ao executar query em ${this.tableName}`, error)
    }

    return (data || []) as T[]
  }

  /**
   * Busca com query customizada (single result)
   */
  protected async executeQuerySingle<T = Row>(
    queryBuilder: (query: SelectQueryBuilder) => { single: () => PromiseLike<QueryResult> }
  ): Promise<T | null> {
    const baseQuery = this.supabase
      .from(this.tableName)
      .select('*') as unknown as SelectQueryBuilder
    const query = queryBuilder(baseQuery)

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError(`Erro ao executar query em ${this.tableName}`, error)
    }

    return data as T
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface FindManyOptions {
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  filters?: Filters
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class RepositoryError extends Error {
  public readonly originalError?: PostgrestError | null

  constructor(message: string, originalError?: PostgrestError | null) {
    super(message)
    this.name = 'RepositoryError'
    this.originalError = originalError

    // Log do erro original para debugging
    if (originalError) {
      console.error('[RepositoryError]', message, {
        code: originalError.code,
        details: originalError.details,
        hint: originalError.hint,
        message: originalError.message,
      })
    }
  }
}
