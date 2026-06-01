import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Cargo, CargoInsert, CargoUpdate, CargoComRelacionamentos } from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

/**
 * Cargo Repository
 *
 * Repository para acesso a dados da tabela 'cargo'.
 * IMPORTANTE: Apenas acessa dados. Lógica de negócio vai em CargoService.
 *
 * Um cargo é a combinação de uma trilha de carreira + um nível.
 * Exemplo: "Engenheiro de Software Sênior" = Trilha "Engenharia de Software" + Nível "L3"
 */
export class CargoRepository extends BaseRepository<'cargo', Cargo, CargoInsert, CargoUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'cargo')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca cargo com trilha e nível
   */
  async findByIdWithRelationships(id: string): Promise<CargoComRelacionamentos | null> {
    const { data, error } = await this.supabase
      .from('cargo')
      .select(`
        *,
        trilha:trilha_carreira!cargo_trilha_id_fkey(*),
        nivel:nivel!cargo_nivel_id_fkey(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar cargo com relacionamentos', error)
    }

    return data
  }

  /**
   * Busca todos os cargos com trilha e nível
   */
  async findAllWithRelationships(): Promise<CargoComRelacionamentos[]> {
    try {
      const { data, error } = await this.supabase
        .from('cargo')
        .select(`
          *,
          trilha:trilha_carreira!cargo_trilha_id_fkey(*),
          nivel:nivel!cargo_nivel_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[CargoRepository] Erro na query:', error)
        throw new RepositoryError('Erro ao buscar cargos com relacionamentos', error)
      }

      return (data || [])
    } catch (err) {
      console.error('[CargoRepository] Erro inesperado:', err)
      throw err
    }
  }

  /**
   * Busca cargos por trilha
   */
  async findByTrilhaId(trilhaId: string): Promise<Cargo[]> {
    return this.executeQuery((query) => query.eq('trilha_id', trilhaId))
  }

  /**
   * Busca cargos por nível
   */
  async findByNivelId(nivelId: string): Promise<Cargo[]> {
    return this.executeQuery((query) => query.eq('nivel_id', nivelId))
  }

  /**
   * Busca cargo por trilha + nível (combinação única)
   */
  async findByTrilhaAndNivel(trilhaId: string, nivelId: string): Promise<Cargo | null> {
    return this.executeQuerySingle((query) =>
      query.eq('trilha_id', trilhaId).eq('nivel_id', nivelId)
    )
  }

  /**
   * Busca cargos por nome (case-insensitive)
   */
  async findByNome(nome: string): Promise<Cargo[]> {
    return this.executeQuery((query) => query.ilike('nome', `%${nome}%`))
  }

  /**
   * Busca cargos ativos para dropdown de filtro.
   */
  async findAtivosParaFiltro(): Promise<Array<{ id: string; nome: string }>> {
    const { data, error } = await this.supabase
      .from('cargo')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')

    if (error) throw new RepositoryError('Erro ao buscar cargos para filtro', error)
    return (data ?? []) as Array<{ id: string; nome: string }>
  }

  /**
   * Busca cargos ativos de uma trilha com o nome do nível
   */
  async findByTrilhaIdWithNivel(trilhaId: string): Promise<Array<Cargo & { nivel_nome: string | null }>> {
    const { data, error } = await this.supabase
      .from('cargo')
      .select('*, nivel:nivel!cargo_nivel_id_fkey(nome)')
      .eq('trilha_id', trilhaId)
      .eq('ativo', true)
      .order('nome')

    if (error) throw new RepositoryError('Erro ao buscar cargos da trilha com nível', error)

    return (data ?? []).map((c) => ({
      ...c,
      nivel_nome: (c.nivel as { nome: string } | null)?.nome ?? null,
    }))
  }

  /**
   * Busca cargos ativos por trilha
   */
  async findActiveByTrilhaId(trilhaId: string): Promise<Cargo[]> {
    return this.executeQuery((query) => query.eq('trilha_id', trilhaId).eq('ativo', true))
  }

  /**
   * Busca cargos ativos por nível
   */
  async findActiveByNivelId(nivelId: string): Promise<Cargo[]> {
    return this.executeQuery((query) => query.eq('nivel_id', nivelId).eq('ativo', true))
  }

  /**
   * Conta quantas pessoas têm este cargo
   */
  async countPessoas(cargoId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('pessoa')
      .select('*', { count: 'exact', head: true })
      .eq('cargo_id', cargoId)

    if (error) {
      throw new RepositoryError('Erro ao contar pessoas do cargo', error)
    }

    return count || 0
  }

  /**
   * Conta quantas vagas existem para este cargo
   */
  async countVagas(cargoId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('vaga_time')
      .select('quantidade')
      .eq('cargo_id', cargoId)
      .eq('ativo', true)

    if (error) {
      throw new RepositoryError('Erro ao contar vagas do cargo', error)
    }

    return (data || []).reduce((total, vaga) => total + vaga.quantidade, 0)
  }

  /**
   * Conta cargos por trilha
   */
  async countByTrilhaId(trilhaId: string): Promise<number> {
    return this.count({ trilha_id: trilhaId })
  }

  /**
   * Conta cargos por nível
   */
  async countByNivelId(nivelId: string): Promise<number> {
    return this.count({ nivel_id: nivelId })
  }

  /**
   * Verifica se um cargo pode ser deletado (não tem pessoas nem vagas)
   */
  async canDelete(cargoId: string): Promise<boolean> {
    const [pessoasCount, vagasCount] = await Promise.all([
      this.countPessoas(cargoId),
      this.countVagas(cargoId),
    ])

    return pessoasCount === 0 && vagasCount === 0
  }

  /**
   * Verifica se já existe um cargo com a mesma combinação trilha + nível
   */
  async combinacaoExists(trilhaId: string, nivelId: string, excludeCargoId?: string): Promise<boolean> {
    let query = this.supabase
      .from('cargo')
      .select('id')
      .eq('trilha_id', trilhaId)
      .eq('nivel_id', nivelId)

    if (excludeCargoId) {
      query = query.neq('id', excludeCargoId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError('Erro ao verificar combinação trilha/nível', error)
    }

    return !!data
  }

  /**
   * Verifica se um nome de cargo já existe
   */
  async nomeExists(nome: string, excludeCargoId?: string): Promise<boolean> {
    let query = this.supabase.from('cargo').select('id').eq('nome', nome)

    if (excludeCargoId) {
      query = query.neq('id', excludeCargoId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError('Erro ao verificar nome do cargo', error)
    }

    return !!data
  }

  /**
   * Busca com filtros
   */
  async findWithFilters(filters: CargoFilters): Promise<Cargo[]> {
    let query = this.supabase.from('cargo').select('*')

    // Filtro de busca por nome
    if (filters.busca) {
      query = query.ilike('nome', `%${filters.busca}%`)
    }

    // Filtro por trilha
    if (filters.trilha_id) {
      query = query.eq('trilha_id', filters.trilha_id)
    }

    // Filtro por nível
    if (filters.nivel_id) {
      query = query.eq('nivel_id', filters.nivel_id)
    }

    // Filtro por ativo
    if (filters.ativo !== undefined) {
      query = query.eq('ativo', filters.ativo)
    }

    const { data, error } = await query

    if (error) {
      throw new RepositoryError('Erro ao buscar cargos com filtros', error)
    }

    return (data || [])
  }

  /**
   * Busca cargos ordenados por trilha e nível
   */
  async findAllOrderedByTrilhaAndNivel(): Promise<CargoComRelacionamentos[]> {
    const { data, error } = await this.supabase
      .from('cargo')
      .select(`
        *,
        trilha:trilha_id (*),
        nivel:nivel_id (*)
      `)
      .order('trilha_id', { ascending: true })
      .order('nivel_id', { ascending: true })

    if (error) {
      throw new RepositoryError('Erro ao buscar cargos ordenados', error)
    }

    return (data || [])
  }

  /**
   * Busca cargos com estatísticas (pessoas e vagas)
   */
  async findWithStats(): Promise<CargoComStats[]> {
    const cargos = await this.findAllWithRelationships()

    const cargosComStats = await Promise.all(
      cargos.map(async (cargo) => {
        const [pessoasCount, vagasCount] = await Promise.all([
          this.countPessoas(cargo.id),
          this.countVagas(cargo.id),
        ])

        return {
          ...cargo,
          stats: {
            total_pessoas: pessoasCount,
            total_vagas: vagasCount,
          },
        }
      })
    )

    return cargosComStats
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface CargoFilters {
  busca?: string
  trilha_id?: string
  nivel_id?: string
  ativo?: boolean
}

export interface CargoComStats extends CargoComRelacionamentos {
  stats: {
    total_pessoas: number
    total_vagas: number
  }
}
