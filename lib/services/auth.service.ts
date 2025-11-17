import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Usuario, TipoPerfil } from '@/lib/types'
import { UsuarioRepository } from '@/lib/repositories'

/**
 * Auth Service
 *
 * Service para autenticação e gerenciamento de sessão.
 * Usa Supabase Auth para login/logout e gerencia dados do usuário.
 */
export class AuthService {
  private supabase: SupabaseClient<Database>
  private usuarioRepo: UsuarioRepository

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.usuarioRepo = new UsuarioRepository(supabase)
  }

  // ==========================================================================
  // AUTENTICAÇÃO
  // ==========================================================================

  /**
   * Faz login com email e senha
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Login via Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        return {
          success: false,
          error: this.translateAuthError(authError.message),
        }
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Usuário não encontrado',
        }
      }

      // Busca dados do usuário na tabela 'usuario'
      const usuario = await this.usuarioRepo.findByEmail(email)

      if (!usuario) {
        return {
          success: false,
          error: 'Usuário não cadastrado no sistema',
        }
      }

      if (!usuario.ativo) {
        // Logout se usuário inativo
        await this.logout()
        return {
          success: false,
          error: 'Usuário inativo. Entre em contato com o administrador.',
        }
      }

      return {
        success: true,
        usuario,
        session: authData.session,
      }
    } catch (error) {
      console.error('[AuthService] Erro no login:', error)
      return {
        success: false,
        error: 'Erro ao fazer login. Tente novamente.',
      }
    }
  }

  /**
   * Faz login com Google OAuth
   */
  async loginWithGoogle(): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      console.error('[AuthService] Erro no login com Google:', error)
      return {
        success: false,
        error: 'Erro ao fazer login com Google. Tente novamente.',
      }
    }
  }

  /**
   * Faz logout
   */
  async logout(): Promise<void> {
    await this.supabase.auth.signOut()
  }

  /**
   * Recupera senha
   */
  async recuperarSenha(email: string): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        }
      }

      return {
        success: true,
        message: 'Email de recuperação enviado. Verifique sua caixa de entrada.',
      }
    } catch (error) {
      console.error('[AuthService] Erro ao recuperar senha:', error)
      return {
        success: false,
        error: 'Erro ao enviar email de recuperação. Tente novamente.',
      }
    }
  }

  /**
   * Atualiza senha
   */
  async atualizarSenha(novaSenha: string): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: novaSenha,
      })

      if (error) {
        return {
          success: false,
          error: this.translateAuthError(error.message),
        }
      }

      return {
        success: true,
        message: 'Senha atualizada com sucesso.',
      }
    } catch (error) {
      console.error('[AuthService] Erro ao atualizar senha:', error)
      return {
        success: false,
        error: 'Erro ao atualizar senha. Tente novamente.',
      }
    }
  }

  // ==========================================================================
  // SESSÃO
  // ==========================================================================

  /**
   * Busca o usuário logado (da sessão)
   */
  async getUsuarioLogado(): Promise<UsuarioLogado | null> {
    try {
      // Busca sessão do Supabase Auth
      const {
        data: { user: authUser },
      } = await this.supabase.auth.getUser()

      if (!authUser || !authUser.email) {
        return null
      }

      // Busca dados do usuário na tabela 'usuario'
      const usuario = await this.usuarioRepo.findByEmail(authUser.email)

      if (!usuario || !usuario.ativo) {
        return null
      }

      // Busca dados da pessoa se vinculada
      let pessoa = null
      if (usuario.pessoa_id) {
        const usuarioComPessoa = await this.usuarioRepo.findByIdWithPessoa(usuario.id)
        pessoa = usuarioComPessoa?.pessoa || null
      }

      return {
        ...usuario,
        pessoa,
        authUser,
      }
    } catch (error) {
      console.error('[AuthService] Erro ao buscar usuário logado:', error)
      return null
    }
  }

  /**
   * Verifica se há uma sessão ativa
   */
  async hasSession(): Promise<boolean> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession()
    return !!session
  }

  /**
   * Atualiza sessão
   */
  async refreshSession(): Promise<void> {
    await this.supabase.auth.refreshSession()
  }

  // ==========================================================================
  // PERMISSÕES BÁSICAS
  // ==========================================================================

  /**
   * Verifica se usuário é admin
   */
  isAdmin(usuario: Usuario): boolean {
    return usuario.tipo_perfil === 'admin'
  }

  /**
   * Verifica se usuário é gestor
   */
  isGestor(usuario: Usuario): boolean {
    return usuario.tipo_perfil === 'gestor'
  }

  /**
   * Verifica se usuário é visualizador
   */
  isVisualizador(usuario: Usuario): boolean {
    return usuario.tipo_perfil === 'visualizador'
  }

  /**
   * Verifica se usuário tem permissão mínima
   */
  hasMinimumRole(usuario: Usuario, minimumRole: TipoPerfil): boolean {
    const roleHierarchy: Record<TipoPerfil, number> = {
      visualizador: 1,
      gestor: 2,
      admin: 3,
    }

    return roleHierarchy[usuario.tipo_perfil] >= roleHierarchy[minimumRole]
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Traduz erros do Supabase Auth para português
   */
  private translateAuthError(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
      'User already registered': 'Usuário já cadastrado',
      'Password should be at least 6 characters': 'Senha deve ter pelo menos 6 caracteres',
      'Unable to validate email address': 'Email inválido',
      'User not found': 'Usuário não encontrado',
      'Email rate limit exceeded': 'Muitas tentativas. Tente novamente mais tarde.',
    }

    return errorMap[error] || 'Erro de autenticação. Tente novamente.'
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface AuthResult {
  success: boolean
  error?: string
  message?: string
  usuario?: Usuario
  session?: any
}

export interface UsuarioLogado extends Usuario {
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
  authUser?: any
}
