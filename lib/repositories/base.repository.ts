import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

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

    let query = this.supabase.from(this.tableName).select('*', { count: 'exact' })

    // Aplicar filtros
    query = this.applyFilters(query, filters)

    // Aplicar ordenação
    query = query.order(orderBy as string, { ascending: orderDirection === 'asc' })

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
      .insert(data as any)
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
      .update(data as any)
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
    return this.update(id, { ativo: false } as any)
  }

  /**
   * Reativa um registro marcado como inativo
   */
  async restore(id: string): Promise<Row> {
    return this.update(id, { ativo: true } as any)
  }

  // ==========================================================================
  // MÉTODOS DE CONTAGEM
  // ==========================================================================

  /**
   * Conta total de registros
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })

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
  protected applyFilters(query: any, filters: Record<string, any>): any {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else {
          query = query.eq(key, value)
        }
      }
    })

    return query
  }

  /**
   * Busca com query customizada
   * Para casos onde os métodos padrão não são suficientes
   */
  protected async executeQuery<T = Row>(
    queryBuilder: (query: any) => any
  ): Promise<T[]> {
    const baseQuery = this.supabase.from(this.tableName).select('*')
    const query = queryBuilder(baseQuery)

    const { data, error } = await query

    if (error) {
      throw new RepositoryError(`Erro ao executar query em ${this.tableName}`, error)
    }

    return (data || []) as T[]
  }

  /**
   * Busca com query customizada (single result)
   */
  protected async executeQuerySingle<T = Row>(
    queryBuilder: (query: any) => any
  ): Promise<T | null> {
    const baseQuery = this.supabase.from(this.tableName).select('*')
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
  filters?: Record<string, any>
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
  public readonly originalError?: any

  constructor(message: string, originalError?: any) {
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
