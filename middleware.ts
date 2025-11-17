import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Middleware do Next.js para autenticação com Supabase
 *
 * Este middleware:
 * - Atualiza a sessão do usuário em cada requisição
 * - Protege rotas do dashboard (redireciona para /login se não autenticado)
 * - Redireciona usuários autenticados de /login para o dashboard
 *
 * O matcher exclui arquivos estáticos para melhor performance.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Images (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
