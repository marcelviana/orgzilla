import { createClient } from '@/lib/supabase/server'
import type { Usuario, TipoPerfil } from '@/lib/types'
import { getUsuarioLogado, requireAuth } from './auth.middleware'
import { PermissaoService } from '@/lib/services'

/**
 * Permission Middleware
 *
 * Middleware helpers para autorização e permissões.
 *
 * REGRAS:
 * - Admin: pode tudo EXCETO ver salários
 * - Gestor: pode ver/editar apenas sua hierarquia + PODE ver salários
 * - Visualizador: apenas visualizar
 *
 * @example Server Component
 * ```tsx
 * import { requireAdmin } from '@/lib/middleware'
 *
 * export default async function AdminPage() {
 *   await requireAdmin() // Lança erro se não for admin
 *
 *   return <div>Área administrativa</div>
 * }
 * ```
 *
 * @example Server Action
 * ```tsx
 * 'use server'
 * import { requireGestorOrAdmin, filterByHierarchy } from '@/lib/middleware'
 *
 * export async function buscarPessoas() {
 *   const usuario = await requireGestorOrAdmin()
 *
 *   // Aplica filtro de hierarquia se for gestor
 *   const pessoas = await filterByHierarchy(usuario, async (timesIds) => {
 *     return await pessoaRepo.findByTimeIds(timesIds)
 *   })
 *
 *   return pessoas
 * }
 * ```
 */

// =============================================================================
// REQUIRE PERMISSIONS
// =============================================================================

/**
 * Requer que usuário seja Admin
 *
 * @throws PermissionError se não for admin
 */
export async function requireAdmin(): Promise<Usuario> {
  const usuario = await requireAuth()

  if (usuario.tipo_perfil !== 'admin') {
    throw new PermissionError('Acesso negado. Apenas administradores podem acessar esta área.', 403)
  }

  return usuario
}

/**
 * Requer que usuário seja Gestor ou Admin
 *
 * @throws PermissionError se não for gestor nem admin
 */
export async function requireGestorOrAdmin(): Promise<Usuario> {
  const usuario = await requireAuth()

  if (usuario.tipo_perfil !== 'gestor' && usuario.tipo_perfil !== 'admin') {
    throw new PermissionError('Acesso negado. Apenas gestores e administradores podem acessar esta área.', 403)
  }

  return usuario
}

/**
 * Requer perfil mínimo
 *
 * @throws PermissionError se não tiver o perfil mínimo
 */
export async function requireMinimumRole(minimumRole: TipoPerfil): Promise<Usuario> {
  const usuario = await requireAuth()

  const roleHierarchy: Record<TipoPerfil, number> = {
    visualizador: 1,
    gestor: 2,
    admin: 3,
  }

  if (roleHierarchy[usuario.tipo_perfil] < roleHierarchy[minimumRole]) {
    throw new PermissionError(
      `Acesso negado. Perfil mínimo requerido: ${minimumRole}`,
      403
    )
  }

  return usuario
}

/**
 * Requer que usuário possa ver dados salariais
 *
 * LGPD: Apenas gestores podem ver salários
 *
 * @throws PermissionError se não puder ver salários
 */
export async function requireCanViewSalary(): Promise<Usuario> {
  const usuario = await requireAuth()

  // Admin NÃO pode ver salários (LGPD)
  if (usuario.tipo_perfil === 'admin') {
    throw new PermissionError('Administradores não podem visualizar dados salariais (LGPD).', 403)
  }

  // Visualizador NÃO pode ver salários
  if (usuario.tipo_perfil === 'visualizador') {
    throw new PermissionError('Visualizadores não podem visualizar dados salariais.', 403)
  }

  // Apenas gestor pode
  return usuario
}

// =============================================================================
// CHECK PERMISSIONS
// =============================================================================

/**
 * Verifica se usuário pode criar uma entidade
 */
export async function canCreate(entidade: string): Promise<boolean> {
  const usuario = await getUsuarioLogado()
  if (!usuario) return false

  // Visualizador não pode criar
  if (usuario.tipo_perfil === 'visualizador') {
    return false
  }

  // Admin e Gestor podem criar
  return true
}

/**
 * Verifica se usuário pode editar uma entidade
 */
export async function canEdit(entidade: string, entidadeId: string): Promise<boolean> {
  const usuario = await getUsuarioLogado()
  if (!usuario) return false

  // Visualizador não pode editar
  if (usuario.tipo_perfil === 'visualizador') {
    return false
  }

  // Admin pode editar tudo
  if (usuario.tipo_perfil === 'admin') {
    return true
  }

  // Gestor: verifica hierarquia
  const supabase = await createClient()
  const permissaoService = new PermissaoService(supabase)

  if (entidade === 'pessoa') {
    return await permissaoService.podeEditar(usuario, 'pessoa', entidadeId)
  }

  if (entidade === 'time') {
    return await permissaoService.podeEditar(usuario, 'time', entidadeId)
  }

  return false
}

/**
 * Verifica se usuário pode deletar uma entidade
 */
export async function canDelete(entidade: string, entidadeId: string): Promise<boolean> {
  return await canEdit(entidade, entidadeId)
}

/**
 * Verifica se usuário pode ver dados salariais de uma pessoa
 */
export async function canViewSalary(pessoaId: string): Promise<boolean> {
  const usuario = await getUsuarioLogado()
  if (!usuario) return false

  const supabase = await createClient()
  const permissaoService = new PermissaoService(supabase)

  return await permissaoService.podeVerSalario(usuario, pessoaId)
}

// =============================================================================
// HIERARQUIA (GESTORES)
// =============================================================================

/**
 * Busca os IDs dos times da hierarquia do gestor
 *
 * Retorna array vazio se usuário não for gestor ou não tiver hierarquia
 */
export async function getTimesHierarquia(): Promise<string[]> {
  const usuario = await getUsuarioLogado()

  if (!usuario || usuario.tipo_perfil !== 'gestor' || !usuario.pessoa_id) {
    return []
  }

  const supabase = await createClient()
  const permissaoService = new PermissaoService(supabase)

  return await permissaoService.getTimesHierarquia(usuario)
}

/**
 * Verifica se uma entidade pertence à hierarquia do gestor
 */
export async function pertenceHierarquia(entidade: 'pessoa' | 'time', entidadeId: string): Promise<boolean> {
  const usuario = await getUsuarioLogado()

  if (!usuario || usuario.tipo_perfil !== 'gestor') {
    return false
  }

  const supabase = await createClient()
  const permissaoService = new PermissaoService(supabase)

  return await permissaoService.pertenceHierarquia(usuario, entidade, entidadeId)
}

/**
 * Filtra dados por hierarquia do gestor
 *
 * Se usuário for Admin ou Visualizador, executa query sem filtro.
 * Se usuário for Gestor, aplica filtro de hierarquia.
 *
 * @param usuario Usuario logado
 * @param queryFn Função que executa a query com os IDs dos times
 *
 * @example
 * ```tsx
 * const pessoas = await filterByHierarchy(usuario, async (timesIds) => {
 *   if (!timesIds) {
 *     // Admin ou Visualizador: busca todas
 *     return await pessoaRepo.findAll()
 *   } else {
 *     // Gestor: filtra por hierarquia
 *     return await pessoaRepo.findByTimeIds(timesIds)
 *   }
 * })
 * ```
 */
export async function filterByHierarchy<T>(
  usuario: Usuario,
  queryFn: (timesIds: string[] | null) => Promise<T>
): Promise<T> {
  // Admin e Visualizador: sem filtro
  if (usuario.tipo_perfil === 'admin' || usuario.tipo_perfil === 'visualizador') {
    return await queryFn(null)
  }

  // Gestor: filtra por hierarquia
  if (usuario.tipo_perfil === 'gestor') {
    const supabase = await createClient()
    const permissaoService = new PermissaoService(supabase)
    const timesIds = await permissaoService.getTimesHierarquia(usuario)

    if (timesIds.length === 0) {
      // Gestor sem hierarquia: retorna vazio
      return [] as any
    }

    return await queryFn(timesIds)
  }

  // Fallback: retorna vazio
  return [] as any
}

// =============================================================================
// UTILITÁRIOS
// =============================================================================

/**
 * Verifica se usuário tem permissão e retorna erro amigável se não
 */
export async function checkPermission(
  check: () => Promise<boolean>,
  errorMessage: string = 'Você não tem permissão para realizar esta ação'
): Promise<void> {
  const hasPermission = await check()

  if (!hasPermission) {
    throw new PermissionError(errorMessage, 403)
  }
}

/**
 * Filtra campos sensíveis baseado em permissões
 *
 * Remove campos de salário se usuário não pode ver
 */
export async function filterSensitiveFields<T extends Record<string, any>>(
  data: T,
  pessoaId: string
): Promise<T> {
  const podeVerSalario = await canViewSalary(pessoaId)

  if (podeVerSalario) {
    return data
  }

  // Remove campos sensíveis
  const { salario_atual, data_ultimo_reajuste, motivo_ultimo_reajuste, ...rest } = data

  return rest as T
}

/**
 * Filtra array de objetos removendo campos sensíveis
 */
export async function filterSensitiveFieldsArray<T extends Record<string, any>>(
  data: T[]
): Promise<T[]> {
  const usuario = await getUsuarioLogado()

  // Se não autenticado ou não pode ver salários, remove campos
  if (!usuario || usuario.tipo_perfil === 'admin' || usuario.tipo_perfil === 'visualizador') {
    return data.map((item) => {
      const { salario_atual, data_ultimo_reajuste, motivo_ultimo_reajuste, ...rest } = item
      return rest as T
    })
  }

  // Gestor: verifica permissão por item
  const supabase = await createClient()
  const permissaoService = new PermissaoService(supabase)

  return await Promise.all(
    data.map(async (item) => {
      if (!item.id) return item

      const podeVer = await permissaoService.podeVerSalario(usuario, item.id)

      if (podeVer) {
        return item
      }

      const { salario_atual, data_ultimo_reajuste, motivo_ultimo_reajuste, ...rest } = item
      return rest as T
    })
  )
}

// =============================================================================
// TYPES
// =============================================================================

export class PermissionError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number = 403) {
    super(message)
    this.name = 'PermissionError'
    this.statusCode = statusCode
  }
}
