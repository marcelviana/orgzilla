import { createClient } from '@/lib/supabase/server'
import type { Usuario, TipoPerfil } from '@/lib/types'
import { UsuarioRepository } from '@/lib/repositories'

/**
 * Auth Middleware
 *
 * Middleware helpers para autenticação em Server Components, Server Actions e API Routes.
 *
 * @example Server Component
 * ```tsx
 * import { getUsuarioLogado, verificarAutenticado } from '@/lib/middleware'
 *
 * export default async function Page() {
 *   await verificarAutenticado() // Lança erro se não autenticado
 *   const usuario = await getUsuarioLogado() // Nunca null aqui
 *
 *   return <div>Olá, {usuario.nome}</div>
 * }
 * ```
 *
 * @example Server Action
 * ```tsx
 * 'use server'
 * import { getUsuarioLogado } from '@/lib/middleware'
 *
 * export async function createPessoa(data: any) {
 *   const usuario = await getUsuarioLogado()
 *   if (!usuario) {
 *     throw new Error('Não autenticado')
 *   }
 *
 *   // ... criar pessoa
 * }
 * ```
 */

// =============================================================================
// AUTENTICAÇÃO
// =============================================================================

/**
 * Busca o usuário logado da sessão atual
 *
 * @returns Usuario logado ou null se não autenticado
 */
export async function getUsuarioLogado(): Promise<UsuarioLogado | null> {
  try {
    const supabase = await createClient()

    // Busca sessão do Supabase Auth
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser || !authUser.email) {
      return null
    }

    // Busca dados do usuário na tabela 'usuario'
    const usuarioRepo = new UsuarioRepository(supabase)
    const usuario = await usuarioRepo.findByEmail(authUser.email)

    if (!usuario || !usuario.ativo) {
      return null
    }

    // Busca dados da pessoa se vinculada
    let pessoa = null
    if (usuario.pessoa_id) {
      const usuarioComPessoa = await usuarioRepo.findByIdWithPessoa(usuario.id)
      pessoa = usuarioComPessoa?.pessoa || null
    }

    return {
      ...usuario,
      pessoa,
      authUser,
    }
  } catch (error) {
    console.error('[AuthMiddleware] Erro ao buscar usuário logado:', error)
    return null
  }
}

/**
 * Verifica se há um usuário autenticado
 *
 * @throws Error se não autenticado
 */
export async function verificarAutenticado(): Promise<void> {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    throw new AuthError('Não autenticado', 401)
  }
}

/**
 * Busca o usuário logado e lança erro se não autenticado
 *
 * @returns Usuario logado (garantido)
 * @throws Error se não autenticado
 */
export async function requireAuth(): Promise<UsuarioLogado> {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    throw new AuthError('Não autenticado', 401)
  }

  return usuario
}

/**
 * Verifica se há sessão ativa
 *
 * @returns true se autenticado, false caso contrário
 */
export async function isAuthenticated(): Promise<boolean> {
  const usuario = await getUsuarioLogado()
  return !!usuario
}

// =============================================================================
// TIPO DE PERFIL
// =============================================================================

/**
 * Busca o tipo de perfil do usuário logado
 *
 * @returns TipoPerfil ou null se não autenticado
 */
export async function getTipoPerfil(): Promise<TipoPerfil | null> {
  const usuario = await getUsuarioLogado()
  return usuario?.tipo_perfil || null
}

/**
 * Verifica se usuário é Admin
 */
export async function isAdmin(): Promise<boolean> {
  const tipoPerfil = await getTipoPerfil()
  return tipoPerfil === 'admin'
}

/**
 * Verifica se usuário é Gestor
 */
export async function isGestor(): Promise<boolean> {
  const tipoPerfil = await getTipoPerfil()
  return tipoPerfil === 'gestor'
}

/**
 * Verifica se usuário é Visualizador
 */
export async function isVisualizador(): Promise<boolean> {
  const tipoPerfil = await getTipoPerfil()
  return tipoPerfil === 'visualizador'
}

/**
 * Verifica se usuário tem perfil mínimo requerido
 */
export async function hasMinimumRole(minimumRole: TipoPerfil): Promise<boolean> {
  const tipoPerfil = await getTipoPerfil()

  if (!tipoPerfil) {
    return false
  }

  const roleHierarchy: Record<TipoPerfil, number> = {
    visualizador: 1,
    gestor: 2,
    admin: 3,
  }

  return roleHierarchy[tipoPerfil] >= roleHierarchy[minimumRole]
}

// =============================================================================
// SESSÃO
// =============================================================================

/**
 * Busca informações da sessão do Supabase Auth
 */
export async function getSession() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Busca o auth user do Supabase
 */
export async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// =============================================================================
// TYPES
// =============================================================================

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

export class AuthError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
  }
}
