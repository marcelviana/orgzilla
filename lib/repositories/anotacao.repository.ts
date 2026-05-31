import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Anotacao, AnotacaoInsert, AnotacaoUpdate, TipoEntidade } from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

/**
 * Anotacao Repository
 *
 * Repository para acesso a dados da tabela 'anotacao'.
 * IMPORTANTE: Apenas acessa dados. Lógica de negócio vai em AnotacaoService.
 *
 * Campos: id, tipo_entidade, entidade_id, conteudo, criado_por_usuario_id, created_at, updated_at
 */
export class AnotacaoRepository extends BaseRepository<'anotacao', Anotacao, AnotacaoInsert, AnotacaoUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'anotacao')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca anotação com usuário que criou
   */
  async findByIdWithUsuario(id: string): Promise<AnotacaoComUsuario | null> {
    const { data, error } = await this.supabase
      .from('anotacao')
      .select(`
        *,
        criado_por:criado_por_usuario_id (
          id,
          nome,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar anotação com usuário', error)
    }

    return data
  }

  /**
   * Busca anotações de uma entidade (pessoa ou time)
   */
  async findByEntidade(tipoEntidade: TipoEntidade, entidadeId: string): Promise<Anotacao[]> {
    return this.executeQuery((query) =>
      query.eq('tipo_entidade', tipoEntidade).eq('entidade_id', entidadeId).order('created_at', { ascending: false })
    )
  }

  /**
   * Busca anotações de uma entidade com usuário
   */
  async findByEntidadeWithUsuario(
    tipoEntidade: TipoEntidade,
    entidadeId: string
  ): Promise<AnotacaoComUsuario[]> {
    const { data, error } = await this.supabase
      .from('anotacao')
      .select(`
        *,
        criado_por:criado_por_usuario_id (
          id,
          nome,
          email
        )
      `)
      .eq('tipo_entidade', tipoEntidade)
      .eq('entidade_id', entidadeId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new RepositoryError('Erro ao buscar anotações com usuário', error)
    }

    return (data || [])
  }

  /**
   * Busca anotações de uma pessoa
   */
  async findByPessoaId(pessoaId: string): Promise<Anotacao[]> {
    return this.findByEntidade('pessoa', pessoaId)
  }

  /**
   * Busca anotações de um time
   */
  async findByTimeId(timeId: string): Promise<Anotacao[]> {
    return this.findByEntidade('time', timeId)
  }

  /**
   * Busca anotações criadas por um usuário
   */
  async findByUsuarioId(usuarioId: string): Promise<Anotacao[]> {
    return this.executeQuery((query) =>
      query.eq('criado_por_usuario_id', usuarioId).order('created_at', { ascending: false })
    )
  }

  /**
   * Busca anotações por tipo de entidade
   */
  async findByTipoEntidade(tipoEntidade: TipoEntidade): Promise<Anotacao[]> {
    return this.executeQuery((query) => query.eq('tipo_entidade', tipoEntidade).order('created_at', { ascending: false }))
  }

  /**
   * Busca anotações por conteúdo (case-insensitive)
   */
  async findByConteudo(conteudo: string): Promise<Anotacao[]> {
    return this.executeQuery((query) =>
      query.ilike('conteudo', `%${conteudo}%`).order('created_at', { ascending: false })
    )
  }

  /**
   * Conta anotações de uma entidade
   */
  async countByEntidade(tipoEntidade: TipoEntidade, entidadeId: string): Promise<number> {
    return this.count({
      tipo_entidade: tipoEntidade,
      entidade_id: entidadeId,
    })
  }

  /**
   * Conta anotações criadas por um usuário
   */
  async countByUsuario(usuarioId: string): Promise<number> {
    return this.count({ criado_por_usuario_id: usuarioId })
  }

  /**
   * Busca anotações recentes (últimas N)
   */
  async findRecent(limit: number = 10): Promise<AnotacaoComUsuario[]> {
    const { data, error } = await this.supabase
      .from('anotacao')
      .select(`
        *,
        criado_por:criado_por_usuario_id (
          id,
          nome,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new RepositoryError('Erro ao buscar anotações recentes', error)
    }

    return (data || [])
  }

  /**
   * Busca com filtros
   */
  async findWithFilters(filters: AnotacaoFilters): Promise<Anotacao[]> {
    let query = this.supabase.from('anotacao').select('*')

    if (filters.tipo_entidade) {
      query = query.eq('tipo_entidade', filters.tipo_entidade)
    }

    if (filters.entidade_id) {
      query = query.eq('entidade_id', filters.entidade_id)
    }

    if (filters.criado_por_usuario_id) {
      query = query.eq('criado_por_usuario_id', filters.criado_por_usuario_id)
    }

    if (filters.busca) {
      query = query.ilike('conteudo', `%${filters.busca}%`)
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
      throw new RepositoryError('Erro ao buscar anotações com filtros', error)
    }

    return (data || [])
  }

  /**
   * Deleta todas as anotações de uma entidade
   */
  async deleteByEntidade(tipoEntidade: TipoEntidade, entidadeId: string): Promise<void> {
    const { error } = await this.supabase
      .from('anotacao')
      .delete()
      .eq('tipo_entidade', tipoEntidade)
      .eq('entidade_id', entidadeId)

    if (error) {
      throw new RepositoryError('Erro ao deletar anotações da entidade', error)
    }
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface AnotacaoComUsuario extends Anotacao {
  criado_por?: {
    id: string
    nome: string
    email: string
  }
}

export interface AnotacaoFilters {
  tipo_entidade?: TipoEntidade
  entidade_id?: string
  criado_por_usuario_id?: string
  busca?: string
  data_inicio?: string
  data_fim?: string
}
