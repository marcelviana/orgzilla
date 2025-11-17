import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, VagaTime, VagaTimeInsert, VagaTimeUpdate } from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

/**
 * VagaTime Repository
 *
 * Repository para acesso a dados da tabela 'vaga_time'.
 * IMPORTANTE: Apenas acessa dados. Lógica de negócio vai em VagaTimeService.
 *
 * Campos: id, time_id, cargo_id, quantidade, ativo, created_at, updated_at
 */
export class VagaTimeRepository extends BaseRepository<'vaga_time', VagaTime, VagaTimeInsert, VagaTimeUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'vaga_time')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca vaga com time e cargo
   */
  async findByIdWithRelationships(id: string): Promise<VagaComRelacionamentos | null> {
    const { data, error } = await this.supabase
      .from('vaga_time')
      .select(`
        *,
        time:time_id (*),
        cargo:cargo_id (
          *,
          trilha:trilha_id (*),
          nivel:nivel_id (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar vaga com relacionamentos', error)
    }

    return data as VagaComRelacionamentos
  }

  /**
   * Busca todas as vagas com relacionamentos
   */
  async findAllWithRelationships(): Promise<VagaComRelacionamentos[]> {
    const { data, error } = await this.supabase
      .from('vaga_time')
      .select(`
        *,
        time:time_id (*),
        cargo:cargo_id (
          *,
          trilha:trilha_id (*),
          nivel:nivel_id (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new RepositoryError('Erro ao buscar vagas com relacionamentos', error)
    }

    return (data || []) as VagaComRelacionamentos[]
  }

  /**
   * Busca vagas de um time específico
   */
  async findByTimeId(timeId: string): Promise<VagaTime[]> {
    return this.executeQuery((query) => query.eq('time_id', timeId))
  }

  /**
   * Busca vagas de um time com relacionamentos
   */
  async findByTimeIdWithRelationships(timeId: string): Promise<VagaComRelacionamentos[]> {
    const { data, error } = await this.supabase
      .from('vaga_time')
      .select(`
        *,
        time:time_id (*),
        cargo:cargo_id (
          *,
          trilha:trilha_id (*),
          nivel:nivel_id (*)
        )
      `)
      .eq('time_id', timeId)

    if (error) {
      throw new RepositoryError('Erro ao buscar vagas do time com relacionamentos', error)
    }

    return (data || []) as VagaComRelacionamentos[]
  }

  /**
   * Busca vagas de um cargo específico
   */
  async findByCargoId(cargoId: string): Promise<VagaTime[]> {
    return this.executeQuery((query) => query.eq('cargo_id', cargoId))
  }

  /**
   * Busca vagas de um cargo com relacionamentos
   */
  async findByCargoIdWithRelationships(cargoId: string): Promise<VagaComRelacionamentos[]> {
    const { data, error } = await this.supabase
      .from('vaga_time')
      .select(`
        *,
        time:time_id (*),
        cargo:cargo_id (
          *,
          trilha:trilha_id (*),
          nivel:nivel_id (*)
        )
      `)
      .eq('cargo_id', cargoId)

    if (error) {
      throw new RepositoryError('Erro ao buscar vagas do cargo com relacionamentos', error)
    }

    return (data || []) as VagaComRelacionamentos[]
  }

  /**
   * Busca vagas ativas
   */
  async findActiveVagas(): Promise<VagaTime[]> {
    return this.executeQuery((query) => query.eq('ativo', true))
  }

  /**
   * Busca vagas ativas com relacionamentos
   */
  async findActiveVagasWithRelationships(): Promise<VagaComRelacionamentos[]> {
    const { data, error } = await this.supabase
      .from('vaga_time')
      .select(`
        *,
        time:time_id (*),
        cargo:cargo_id (
          *,
          trilha:trilha_id (*),
          nivel:nivel_id (*)
        )
      `)
      .eq('ativo', true)

    if (error) {
      throw new RepositoryError('Erro ao buscar vagas ativas com relacionamentos', error)
    }

    return (data || []) as VagaComRelacionamentos[]
  }

  /**
   * Busca vagas por time e cargo
   */
  async findByTimeAndCargo(timeId: string, cargoId: string): Promise<VagaTime[]> {
    return this.executeQuery((query) => query.eq('time_id', timeId).eq('cargo_id', cargoId))
  }

  /**
   * Conta total de vagas de um time
   */
  async countVagasByTime(timeId: string): Promise<number> {
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
   * Conta total de vagas de um cargo
   */
  async countVagasByCargo(cargoId: string): Promise<number> {
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
   * Conta total de vagas ativas
   */
  async countTotalVagasAtivas(): Promise<number> {
    const { data, error } = await this.supabase
      .from('vaga_time')
      .select('quantidade')
      .eq('ativo', true)

    if (error) {
      throw new RepositoryError('Erro ao contar vagas ativas', error)
    }

    return (data || []).reduce((total, vaga) => total + vaga.quantidade, 0)
  }

  /**
   * Busca com filtros
   */
  async findWithFilters(filters: VagaTimeFilters): Promise<VagaTime[]> {
    let query = this.supabase.from('vaga_time').select('*')

    if (filters.time_id) {
      query = query.eq('time_id', filters.time_id)
    }

    if (filters.cargo_id) {
      query = query.eq('cargo_id', filters.cargo_id)
    }

    if (filters.ativo !== undefined) {
      query = query.eq('ativo', filters.ativo)
    }

    const { data, error } = await query

    if (error) {
      throw new RepositoryError('Erro ao buscar vagas com filtros', error)
    }

    return (data || []) as VagaTime[]
  }

  /**
   * Verifica se já existe uma vaga para time + cargo
   */
  async existsByTimeAndCargo(timeId: string, cargoId: string, excludeVagaId?: string): Promise<boolean> {
    let query = this.supabase
      .from('vaga_time')
      .select('id')
      .eq('time_id', timeId)
      .eq('cargo_id', cargoId)

    if (excludeVagaId) {
      query = query.neq('id', excludeVagaId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError('Erro ao verificar vaga existente', error)
    }

    return !!data
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface VagaComRelacionamentos extends VagaTime {
  time?: {
    id: string
    nome: string
  }
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
  }
}

export interface VagaTimeFilters {
  time_id?: string
  cargo_id?: string
  ativo?: boolean
}
