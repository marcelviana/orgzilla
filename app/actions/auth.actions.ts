'use server'

/**
 * Server Actions - Autenticação
 *
 * Actions para verificar autenticação e permissões em Client Components
 */

import { getUsuarioLogado, isAdmin } from '@/lib/middleware'

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
