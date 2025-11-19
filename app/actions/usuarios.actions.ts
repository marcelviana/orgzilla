'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'
import { handleError } from '@/lib/errors/error-handler'

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

export type UsuarioListItem = {
  id: string
  email: string
  nome: string
  tipo_perfil: 'admin' | 'gestor' | 'visualizador'
  ativo: boolean
  created_at: string
  pessoa?: {
    id: string
    nome: string
  }
}

export type UsuarioDetail = {
  id: string
  email: string
  nome: string
  tipo_perfil: 'admin' | 'gestor' | 'visualizador'
  ativo: boolean
  pessoa_id: string | null
  created_at: string
  updated_at: string
  pessoa?: {
    id: string
    nome: string
    email_corporativo: string | null
  }
}

export type UsuarioInsert = {
  email: string
  nome: string
  tipo_perfil: 'admin' | 'gestor' | 'visualizador'
  pessoa_id?: string | null
  ativo: boolean
}

export type UsuarioUpdate = {
  nome?: string
  tipo_perfil?: 'admin' | 'gestor' | 'visualizador'
  pessoa_id?: string | null
  ativo?: boolean
}

/**
 * Lista todos os usuários (admin only)
 */
export async function getUsuarios(): Promise<ActionResult<UsuarioListItem[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Only admin can list users
    if (usuario.tipo_perfil !== 'admin') {
      return { success: false, error: 'Acesso negado. Apenas administradores podem gerenciar usuários.' }
    }

    const { data: usuarios, error } = await supabase
      .from('usuario')
      .select(`
        id,
        email,
        nome,
        tipo_perfil,
        ativo,
        created_at,
        pessoa:pessoa!pessoa_id(
          id,
          nome
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: usuarios as UsuarioListItem[],
    }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Busca usuário por ID (admin only)
 */
export async function getUsuarioById(id: string): Promise<ActionResult<UsuarioDetail>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Only admin can view user details
    if (usuario.tipo_perfil !== 'admin') {
      return { success: false, error: 'Acesso negado' }
    }

    const { data: usuarioData, error } = await supabase
      .from('usuario')
      .select(`
        id,
        email,
        nome,
        tipo_perfil,
        ativo,
        pessoa_id,
        created_at,
        updated_at,
        pessoa:pessoa!pessoa_id(
          id,
          nome,
          email_corporativo
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Usuário não encontrado' }
      }
      throw error
    }

    return {
      success: true,
      data: usuarioData as UsuarioDetail,
    }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Cria novo usuário (admin only)
 * NOTE: This creates the database record only.
 * Supabase Auth user creation should be handled separately via Supabase Admin API
 */
export async function createUsuario(dados: UsuarioInsert): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Only admin can create users
    if (usuario.tipo_perfil !== 'admin') {
      return { success: false, error: 'Acesso negado. Apenas administradores podem criar usuários.' }
    }

    // Validate email uniqueness
    const { data: existente } = await supabase
      .from('usuario')
      .select('id')
      .eq('email', dados.email)
      .maybeSingle()

    if (existente) {
      return { success: false, error: 'Já existe um usuário com este email' }
    }

    // If pessoa_id provided, validate it's not already linked to another user
    if (dados.pessoa_id) {
      const { data: pessoaComUsuario } = await supabase
        .from('usuario')
        .select('id')
        .eq('pessoa_id', dados.pessoa_id)
        .maybeSingle()

      if (pessoaComUsuario) {
        return { success: false, error: 'Esta pessoa já está vinculada a outro usuário' }
      }
    }

    // Create user record
    const { data: novoUsuario, error } = await supabase
      .from('usuario')
      .insert(dados)
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/configuracoes/usuarios')
    return { success: true, data: novoUsuario.id }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Atualiza usuário (admin only)
 */
export async function updateUsuario(id: string, dados: UsuarioUpdate): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Only admin can update users
    if (usuario.tipo_perfil !== 'admin') {
      return { success: false, error: 'Acesso negado. Apenas administradores podem editar usuários.' }
    }

    // Cannot deactivate own account
    if (dados.ativo === false && id === usuario.id) {
      return { success: false, error: 'Você não pode desativar sua própria conta' }
    }

    // If pessoa_id is being updated, validate it's not already linked
    if (dados.pessoa_id !== undefined && dados.pessoa_id !== null) {
      const { data: pessoaComUsuario } = await supabase
        .from('usuario')
        .select('id')
        .eq('pessoa_id', dados.pessoa_id)
        .neq('id', id)
        .maybeSingle()

      if (pessoaComUsuario) {
        return { success: false, error: 'Esta pessoa já está vinculada a outro usuário' }
      }
    }

    const { error } = await supabase
      .from('usuario')
      .update(dados)
      .eq('id', id)

    if (error) throw error

    revalidatePath('/configuracoes/usuarios')
    revalidatePath(`/configuracoes/usuarios/${id}`)
    return { success: true }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Soft delete de usuário (admin only)
 */
export async function softDeleteUsuario(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Only admin can delete users
    if (usuario.tipo_perfil !== 'admin') {
      return { success: false, error: 'Acesso negado. Apenas administradores podem desativar usuários.' }
    }

    // Cannot delete own account
    if (id === usuario.id) {
      return { success: false, error: 'Você não pode desativar sua própria conta' }
    }

    const { error } = await supabase
      .from('usuario')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/configuracoes/usuarios')
    return { success: true }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Reativa usuário (admin only)
 */
export async function reactivateUsuario(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Only admin can reactivate users
    if (usuario.tipo_perfil !== 'admin') {
      return { success: false, error: 'Acesso negado' }
    }

    const { error } = await supabase
      .from('usuario')
      .update({ ativo: true })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/configuracoes/usuarios')
    return { success: true }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Busca pessoas sem usuário vinculado (para dropdown)
 */
export async function getPessoasSemUsuario(): Promise<
  ActionResult<Array<{ id: string; nome: string; email_corporativo: string | null }>>
> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Only admin needs this
    if (usuario.tipo_perfil !== 'admin') {
      return { success: false, error: 'Acesso negado' }
    }

    // Get all pessoas that don't have a user linked
    const { data: todasPessoas, error: pessoasError } = await supabase
      .from('pessoa')
      .select('id, nome, email_corporativo')
      .eq('ativo', true)
      .order('nome')

    if (pessoasError) throw pessoasError

    // Get all user-linked pessoa_ids
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuario')
      .select('pessoa_id')
      .not('pessoa_id', 'is', null)

    if (usuariosError) throw usuariosError

    const linkedPessoaIds = new Set(usuarios.map((u) => u.pessoa_id))

    // Filter out pessoas that are already linked
    const pessoasSemUsuario = (todasPessoas || []).filter(
      (p) => !linkedPessoaIds.has(p.id)
    )

    return {
      success: true,
      data: pessoasSemUsuario,
    }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}
