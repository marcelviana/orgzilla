import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, TrilhaCarreira, TrilhaCarreiraInsert, TrilhaCarreiraUpdate } from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

/**
 * TrilhaCarreira Repository
 *
 * Repository para acesso a dados da tabela 'trilha_carreira'.
 * IMPORTANTE: Apenas acessa dados. Lógica de negócio vai em TrilhaCarreiraService.
 */
export class TrilhaCarreiraRepository extends BaseRepository<
  'trilha_carreira',
  TrilhaCarreira,
  TrilhaCarreiraInsert,
  TrilhaCarreiraUpdate
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'trilha_carreira')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca trilha por nome
   */
  async findByNome(nome: string): Promise<TrilhaCarreira | null> {
    return this.executeQuerySingle((query) => query.eq('nome', nome))
  }

  /**
   * Busca trilhas por nome (case-insensitive, parcial)
   */
  async findByNomeLike(nome: string): Promise<TrilhaCarreira[]> {
    return this.executeQuery((query) => query.ilike('nome', `%${nome}%`))
  }

  /**
   * Busca trilha com todos os cargos
   */
  async findByIdWithCargos(id: string): Promise<TrilhaComCargos | null> {
    const { data, error } = await this.supabase
      .from('trilha_carreira')
      .select(`
        *,
        cargos:cargo (
          *,
          nivel:nivel_id (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar trilha com cargos', error)
    }

    return data as TrilhaComCargos
  }

  /**
   * Busca todas as trilhas com contagem de cargos
   */
  async findAllWithCargoCount(): Promise<TrilhaComContagem[]> {
    const trilhas = await this.findAll()

    const trilhasComContagem = await Promise.all(
      trilhas.map(async (trilha) => {
        const count = await this.countCargos(trilha.id)
        return {
          ...trilha,
          total_cargos: count,
        }
      })
    )

    return trilhasComContagem
  }

  /**
   * Conta quantos cargos usam esta trilha
   */
  async countCargos(trilhaId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('cargo')
      .select('*', { count: 'exact', head: true })
      .eq('trilha_id', trilhaId)

    if (error) {
      throw new RepositoryError('Erro ao contar cargos da trilha', error)
    }

    return count || 0
  }

  /**
   * Conta quantas pessoas estão em cargos desta trilha
   */
  async countPessoas(trilhaId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('pessoa')
      .select('cargo:cargo_id!inner(trilha_id)', { count: 'exact', head: true })
      .eq('cargo.trilha_id', trilhaId)

    if (error) {
      throw new RepositoryError('Erro ao contar pessoas da trilha', error)
    }

    return count || 0
  }

  /**
   * Verifica se uma trilha pode ser deletada (não tem cargos)
   */
  async canDelete(trilhaId: string): Promise<boolean> {
    const count = await this.countCargos(trilhaId)
    return count === 0
  }

  /**
   * Verifica se um nome de trilha já existe
   */
  async nomeExists(nome: string, excludeTrilhaId?: string): Promise<boolean> {
    let query = this.supabase.from('trilha_carreira').select('id').eq('nome', nome)

    if (excludeTrilhaId) {
      query = query.neq('id', excludeTrilhaId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError('Erro ao verificar nome da trilha', error)
    }

    return !!data
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface TrilhaComCargos extends TrilhaCarreira {
  cargos?: Array<{
    id: string
    nome: string
    nivel?: {
      id: string
      nome: string
    }
  }>
}

export interface TrilhaComContagem extends TrilhaCarreira {
  total_cargos: number
}
