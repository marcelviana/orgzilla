/**
 * Middleware Export - Orgzilla
 *
 * Este arquivo centraliza todos os middlewares para fácil importação.
 *
 * @example Server Component
 * ```tsx
 * import { requireAuth, requireAdmin } from '@/lib/middleware'
 *
 * export default async function Page() {
 *   const usuario = await requireAuth()
 *   // ou
 *   await requireAdmin()
 *
 *   return <div>...</div>
 * }
 * ```
 *
 * @example Server Action
 * ```tsx
 * 'use server'
 * import { getUsuarioLogado, filterByHierarchy } from '@/lib/middleware'
 *
 * export async function buscarPessoas() {
 *   const usuario = await getUsuarioLogado()
 *   if (!usuario) throw new Error('Não autenticado')
 *
 *   const pessoas = await filterByHierarchy(usuario, async (timesIds) => {
 *     if (!timesIds) return await pessoaRepo.findAll()
 *     return await pessoaRepo.findByTimeIds(timesIds)
 *   })
 *
 *   return pessoas
 * }
 * ```
 */

// =============================================================================
// AUTH MIDDLEWARE
// =============================================================================

export {
  getUsuarioLogado,
  verificarAutenticado,
  requireAuth,
  isAuthenticated,
  getTipoPerfil,
  isAdmin,
  isGestor,
  isVisualizador,
  hasMinimumRole,
  getSession,
  getAuthUser,
  AuthError,
} from './auth.middleware'

export type { UsuarioLogado } from './auth.middleware'

// =============================================================================
// PERMISSION MIDDLEWARE
// =============================================================================

export {
  requireAdmin,
  requireGestorOrAdmin,
  requireMinimumRole,
  requireCanViewSalary,
  canCreate,
  canEdit,
  canDelete,
  canViewSalary,
  getTimesHierarquia,
  pertenceHierarquia,
  filterByHierarchy,
  checkPermission,
  PermissionError,
} from './permission.middleware'
