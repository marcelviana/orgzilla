'use server'

import { getUsuarioLogado, isAdmin } from '@/lib/middleware'
import { createClient } from '@/lib/supabase/server'
import { AuthService } from '@/lib/services/auth.service'
import { handleError, type ErrorType } from '@/lib/errors/error-handler'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export async function atualizarSenhaAction(novaSenha: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const authService = new AuthService(supabase)
    const result = await authService.atualizarSenha(novaSenha)
    if (!result.success) {
      return { success: false, error: result.error }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: handleError(error, 'auth' as ErrorType).message }
  }
}

export interface UsuarioLogadoInfo {
  id: string
  email: string
  nome: string
  tipo_perfil: 'admin' | 'gestor' | 'visualizador'
  ativo: boolean
}

/**
 * Retorna informações do usuário logado
 */
export async function getCurrentUser(): Promise<UsuarioLogadoInfo | null> {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    return null
  }

  return {
    id: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    tipo_perfil: usuario.tipo_perfil,
    ativo: usuario.ativo,
  }
}

/**
 * Verifica se usuário atual é admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  return await isAdmin()
}

/**
 * Faz logout do usuário
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao fazer logout',
    }
  }
}
