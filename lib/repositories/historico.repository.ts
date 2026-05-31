import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  HistoricoCargo,
  HistoricoTime,
  HistoricoReajuste,
  HistoricoMudanca,
  TipoMudanca,
} from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

// =============================================================================
// HISTORICO CARGO REPOSITORY
// =============================================================================

/**
 * HistoricoCargo Repository
 *
 * Repository para acesso a dados da tabela 'historico_cargo'.
 * Gerencia o histórico de cargos de uma pessoa.
 *
 * Campos: id, pessoa_id, cargo_id, data_inicio, data_fim, created_at
 */
export class HistoricoCargoRepository extends BaseRepository<
  'historico_cargo',
  HistoricoCargo,
  Database['public']['Tables']['historico_cargo']['Insert'],
  Database['public']['Tables']['historico_cargo']['Update']
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'historico_cargo')
  }

  /**
   * Busca histórico de cargos de uma pessoa
   */
  async findByPessoaId(pessoaId: string): Promise<HistoricoCargo[]> {
    return this.executeQuery((query) => query.eq('pessoa_id', pessoaId).order('data_inicio', { ascending: false }))
  }

  /**
   * Busca histórico de cargos de uma pessoa com dados do cargo
   */
  async findByPessoaIdWithCargo(pessoaId: string): Promise<HistoricoCargoComCargo[]> {
    const { data, error } = await this.supabase
      .from('historico_cargo')
      .select(`
        *,
        cargo:cargo_id (
          *,
          trilha:trilha_id (*),
          nivel:nivel_id (*)
        )
      `)
      .eq('pessoa_id', pessoaId)
      .order('data_inicio', { ascending: false })

    if (error) {
      throw new RepositoryError('Erro ao buscar histórico de cargos com cargo', error)
    }

    return (data || [])
  }

  /**
   * Busca cargo atual de uma pessoa (data_fim IS NULL)
   */
  async findAtualByPessoaId(pessoaId: string): Promise<HistoricoCargo | null> {
    return this.executeQuerySingle((query) =>
      query.eq('pessoa_id', pessoaId).is('data_fim', null).order('data_inicio', { ascending: false })
    )
  }

  /**
   * Busca histórico por cargo
   */
  async findByCargoId(cargoId: string): Promise<HistoricoCargo[]> {
    return this.executeQuery((query) => query.eq('cargo_id', cargoId).order('data_inicio', { ascending: false }))
  }

  /**
   * Finaliza um histórico de cargo (seta data_fim)
   */
  async finalizarHistorico(id: string, dataFim: string): Promise<HistoricoCargo> {
    return this.update(id, { data_fim: dataFim })
  }

  /**
   * Finaliza cargo atual de uma pessoa
   */
  async finalizarCargoAtual(pessoaId: string, dataFim: string): Promise<void> {
    const { error } = await this.supabase
      .from('historico_cargo')
      .update({ data_fim: dataFim })
      .eq('pessoa_id', pessoaId)
      .is('data_fim', null)

    if (error) {
      throw new RepositoryError('Erro ao finalizar cargo atual', error)
    }
  }
}

// =============================================================================
// HISTORICO TIME REPOSITORY
// =============================================================================

/**
 * HistoricoTime Repository
 *
 * Repository para acesso a dados da tabela 'historico_time'.
 * Gerencia o histórico de times de uma pessoa.
 *
 * Campos: id, pessoa_id, time_id, data_inicio, data_fim, created_at
 */
export class HistoricoTimeRepository extends BaseRepository<
  'historico_time',
  HistoricoTime,
  Database['public']['Tables']['historico_time']['Insert'],
  Database['public']['Tables']['historico_time']['Update']
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'historico_time')
  }

  /**
   * Busca histórico de times de uma pessoa
   */
  async findByPessoaId(pessoaId: string): Promise<HistoricoTime[]> {
    return this.executeQuery((query) => query.eq('pessoa_id', pessoaId).order('data_inicio', { ascending: false }))
  }

  /**
   * Busca histórico de times de uma pessoa com dados do time
   */
  async findByPessoaIdWithTime(pessoaId: string): Promise<HistoricoTimeComTime[]> {
    const { data, error } = await this.supabase
      .from('historico_time')
      .select(`
        *,
        time:time_id (*)
      `)
      .eq('pessoa_id', pessoaId)
      .order('data_inicio', { ascending: false })

    if (error) {
      throw new RepositoryError('Erro ao buscar histórico de times com time', error)
    }

    return (data || [])
  }

  /**
   * Busca time atual de uma pessoa (data_fim IS NULL)
   */
  async findAtualByPessoaId(pessoaId: string): Promise<HistoricoTime | null> {
    return this.executeQuerySingle((query) =>
      query.eq('pessoa_id', pessoaId).is('data_fim', null).order('data_inicio', { ascending: false })
    )
  }

  /**
   * Busca histórico por time
   */
  async findByTimeId(timeId: string): Promise<HistoricoTime[]> {
    return this.executeQuery((query) => query.eq('time_id', timeId).order('data_inicio', { ascending: false }))
  }

  /**
   * Finaliza um histórico de time (seta data_fim)
   */
  async finalizarHistorico(id: string, dataFim: string): Promise<HistoricoTime> {
    return this.update(id, { data_fim: dataFim })
  }

  /**
   * Finaliza time atual de uma pessoa
   */
  async finalizarTimeAtual(pessoaId: string, dataFim: string): Promise<void> {
    const { error } = await this.supabase
      .from('historico_time')
      .update({ data_fim: dataFim })
      .eq('pessoa_id', pessoaId)
      .is('data_fim', null)

    if (error) {
      throw new RepositoryError('Erro ao finalizar time atual', error)
    }
  }
}

// =============================================================================
// HISTORICO REAJUSTE REPOSITORY
// =============================================================================

/**
 * HistoricoReajuste Repository
 *
 * Repository para acesso a dados da tabela 'historico_reajuste'.
 * Gerencia o histórico de reajustes salariais (DADOS SENSÍVEIS - LGPD).
 *
 * Campos: id, pessoa_id, salario_anterior, salario_novo, percentual, data_reajuste, motivo, created_at
 */
export class HistoricoReajusteRepository extends BaseRepository<
  'historico_reajuste',
  HistoricoReajuste,
  Database['public']['Tables']['historico_reajuste']['Insert'],
  Database['public']['Tables']['historico_reajuste']['Update']
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'historico_reajuste')
  }

  /**
   * Busca histórico de reajustes de uma pessoa
   * ⚠️ SENSÍVEL - LGPD: Apenas gestores da hierarquia podem acessar
   */
  async findByPessoaId(pessoaId: string): Promise<HistoricoReajuste[]> {
    return this.executeQuery((query) => query.eq('pessoa_id', pessoaId).order('data_reajuste', { ascending: false }))
  }

  /**
   * Busca último reajuste de uma pessoa
   * ⚠️ SENSÍVEL - LGPD: Apenas gestores da hierarquia podem acessar
   */
  async findUltimoReajuste(pessoaId: string): Promise<HistoricoReajuste | null> {
    return this.executeQuerySingle((query) =>
      query.eq('pessoa_id', pessoaId).order('data_reajuste', { ascending: false })
    )
  }

  /**
   * Busca reajustes por período
   * ⚠️ SENSÍVEL - LGPD: Apenas gestores da hierarquia podem acessar
   */
  async findByPeriodo(dataInicio: string, dataFim: string): Promise<HistoricoReajuste[]> {
    return this.executeQuery((query) =>
      query.gte('data_reajuste', dataInicio).lte('data_reajuste', dataFim).order('data_reajuste', { ascending: false })
    )
  }

  /**
   * Calcula percentual médio de reajuste em um período
   * ⚠️ SENSÍVEL - LGPD: Apenas gestores da hierarquia podem acessar
   */
  async calcularPercentualMedio(dataInicio: string, dataFim: string): Promise<number> {
    const reajustes = await this.findByPeriodo(dataInicio, dataFim)

    if (reajustes.length === 0) {
      return 0
    }

    const soma = reajustes.reduce((acc, r) => acc + (r.percentual || 0), 0)
    return soma / reajustes.length
  }

  /**
   * Conta reajustes de uma pessoa
   */
  async countByPessoa(pessoaId: string): Promise<number> {
    return this.count({ pessoa_id: pessoaId })
  }
}

// =============================================================================
// HISTORICO MUDANCA REPOSITORY (AUDITORIA)
// =============================================================================

/**
 * HistoricoMudanca Repository
 *
 * Repository para acesso a dados da tabela 'historico_mudanca'.
 * Gerencia o log de auditoria de todas as mudanças no sistema.
 *
 * Campos: id, tipo_entidade, entidade_id, tipo_mudanca, campo_alterado,
 *         valor_anterior, valor_novo, usuario_id, created_at
 */
export class HistoricoMudancaRepository extends BaseRepository<
  'historico_mudanca',
  HistoricoMudanca,
  Database['public']['Tables']['historico_mudanca']['Insert'],
  Database['public']['Tables']['historico_mudanca']['Update']
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'historico_mudanca')
  }

  /**
   * Busca histórico de mudanças de uma entidade
   */
  async findByEntidade(tipoEntidade: string, entidadeId: string): Promise<HistoricoMudanca[]> {
    return this.executeQuery((query) =>
      query.eq('tipo_entidade', tipoEntidade).eq('entidade_id', entidadeId).order('created_at', { ascending: false })
    )
  }

  /**
   * Busca histórico com dados do usuário
   */
  async findByEntidadeWithUsuario(tipoEntidade: string, entidadeId: string): Promise<HistoricoMudancaComUsuario[]> {
    const { data, error } = await this.supabase
      .from('historico_mudanca')
      .select(`
        *,
        usuario:usuario_id (
          id,
          nome,
          email
        )
      `)
      .eq('tipo_entidade', tipoEntidade)
      .eq('entidade_id', entidadeId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new RepositoryError('Erro ao buscar histórico com usuário', error)
    }

    return (data || [])
  }

  /**
   * Busca mudanças feitas por um usuário
   */
  async findByUsuarioId(usuarioId: string): Promise<HistoricoMudanca[]> {
    return this.executeQuery((query) => query.eq('usuario_id', usuarioId).order('created_at', { ascending: false }))
  }

  /**
   * Busca mudanças por tipo
   */
  async findByTipoMudanca(tipoMudanca: TipoMudanca): Promise<HistoricoMudanca[]> {
    return this.executeQuery((query) => query.eq('tipo_mudanca', tipoMudanca).order('created_at', { ascending: false }))
  }

  /**
   * Busca mudanças por tipo de entidade
   */
  async findByTipoEntidade(tipoEntidade: string): Promise<HistoricoMudanca[]> {
    return this.executeQuery((query) => query.eq('tipo_entidade', tipoEntidade).order('created_at', { ascending: false }))
  }

  /**
   * Busca mudanças por período
   */
  async findByPeriodo(dataInicio: string, dataFim: string): Promise<HistoricoMudanca[]> {
    return this.executeQuery((query) =>
      query.gte('created_at', dataInicio).lte('created_at', dataFim).order('created_at', { ascending: false })
    )
  }

  /**
   * Busca mudanças recentes (últimas N)
   */
  async findRecent(limit: number = 50): Promise<HistoricoMudancaComUsuario[]> {
    const { data, error } = await this.supabase
      .from('historico_mudanca')
      .select(`
        *,
        usuario:usuario_id (
          id,
          nome,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new RepositoryError('Erro ao buscar mudanças recentes', error)
    }

    return (data || [])
  }

  /**
   * Busca com filtros avançados
   */
  async findWithFilters(filters: HistoricoMudancaFilters): Promise<HistoricoMudanca[]> {
    let query = this.supabase.from('historico_mudanca').select('*')

    if (filters.tipo_entidade) {
      query = query.eq('tipo_entidade', filters.tipo_entidade)
    }

    if (filters.entidade_id) {
      query = query.eq('entidade_id', filters.entidade_id)
    }

    if (filters.tipo_mudanca) {
      query = query.eq('tipo_mudanca', filters.tipo_mudanca)
    }

    if (filters.usuario_id) {
      query = query.eq('usuario_id', filters.usuario_id)
    }

    if (filters.campo_alterado) {
      query = query.eq('campo_alterado', filters.campo_alterado)
    }

    if (filters.data_inicio) {
      query = query.gte('created_at', filters.data_inicio)
    }

    if (filters.data_fim) {
      query = query.lte('created_at', filters.data_fim)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new RepositoryError('Erro ao buscar histórico com filtros', error)
    }

    return (data || [])
  }

  /**
   * Conta mudanças por entidade
   */
  async countByEntidade(tipoEntidade: string, entidadeId: string): Promise<number> {
    return this.count({
      tipo_entidade: tipoEntidade,
      entidade_id: entidadeId,
    })
  }

  /**
   * Conta mudanças por usuário
   */
  async countByUsuario(usuarioId: string): Promise<number> {
    return this.count({ usuario_id: usuarioId })
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface HistoricoCargoComCargo extends HistoricoCargo {
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

export interface HistoricoTimeComTime extends HistoricoTime {
  time?: {
    id: string
    nome: string
  }
}

export interface HistoricoMudancaComUsuario extends HistoricoMudanca {
  usuario?: {
    id: string
    nome: string
    email: string
  }
}

export interface HistoricoMudancaFilters {
  tipo_entidade?: string
  entidade_id?: string
  tipo_mudanca?: TipoMudanca
  usuario_id?: string
  campo_alterado?: string
  data_inicio?: string
  data_fim?: string
}
