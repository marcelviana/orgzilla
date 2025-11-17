import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Usuario, UsuarioInsert, UsuarioUpdate, TipoPerfil } from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

/**
 * Usuario Repository
 *
 * Repository para acesso a dados da tabela 'usuario'.
 * IMPORTANTE: Apenas acessa dados. Lógica de negócio vai em UsuarioService.
 */
export class UsuarioRepository extends BaseRepository<'usuario', Usuario, UsuarioInsert, UsuarioUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'usuario')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string): Promise<Usuario | null> {
    return this.executeQuerySingle((query) => query.eq('email', email))
  }

  /**
   * Busca usuário com dados da pessoa relacionada
   */
  async findByIdWithPessoa(id: string): Promise<UsuarioComPessoa | null> {
    const { data, error } = await this.supabase
      .from('usuario')
      .select(`
        *,
        pessoa:pessoa_id (
          *,
          cargo:cargo_id (*),
          time:time_id (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar usuário com pessoa', error)
    }

    return data as UsuarioComPessoa
  }

  /**
   * Busca usuários por tipo de perfil
   */
  async findByTipoPerfil(tipoPerfil: TipoPerfil): Promise<Usuario[]> {
    return this.executeQuery((query) => query.eq('tipo_perfil', tipoPerfil))
  }

  /**
   * Busca todos os gestores
   */
  async findGestores(): Promise<Usuario[]> {
    return this.findByTipoPerfil('gestor')
  }

  /**
   * Busca todos os administradores
   */
  async findAdministradores(): Promise<Usuario[]> {
    return this.findByTipoPerfil('admin')
  }

  /**
   * Verifica se um email já está em uso
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    let query = this.supabase
      .from('usuario')
      .select('id')
      .eq('email', email)

    if (excludeUserId) {
      query = query.neq('id', excludeUserId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError('Erro ao verificar email', error)
    }

    return !!data
  }

  /**
   * Busca usuários vinculados a uma pessoa
   */
  async findByPessoaId(pessoaId: string): Promise<Usuario[]> {
    return this.executeQuery((query) => query.eq('pessoa_id', pessoaId))
  }

  /**
   * Busca usuários sem pessoa vinculada
   */
  async findWithoutPessoa(): Promise<Usuario[]> {
    return this.executeQuery((query) => query.is('pessoa_id', null))
  }

  /**
   * Conta usuários por tipo de perfil
   */
  async countByTipoPerfil(tipoPerfil: TipoPerfil): Promise<number> {
    return this.count({ tipo_perfil: tipoPerfil })
  }

  /**
   * Conta usuários ativos por tipo de perfil
   */
  async countActiveByTipoPerfil(tipoPerfil: TipoPerfil): Promise<number> {
    return this.count({ tipo_perfil: tipoPerfil, ativo: true })
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface UsuarioComPessoa extends Usuario {
  pessoa?: {
    id: string
    nome: string
    email_corporativo: string | null
    foto_url: string | null
    cargo?: {
      id: string
      nome: string
    } | null
    time?: {
      id: string
      nome: string
    } | null
  } | null
}
