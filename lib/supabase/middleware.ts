import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Cliente Supabase para uso no middleware
 *
 * Este cliente é usado no middleware do Next.js para:
 * - Atualizar a sessão do usuário antes de cada requisição
 * - Proteger rotas que requerem autenticação
 * - Redirecionar usuários não autenticados
 *
 * IMPORTANTE: Este arquivo contém a função helper para criar o cliente.
 * O middleware real deve ser criado em /middleware.ts na raiz do projeto.
 *
 * @example
 * ```tsx
 * // middleware.ts (na raiz do projeto)
 * import { updateSession } from '@/lib/supabase/middleware'
 *
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request)
 * }
 *
 * export const config = {
 *   matcher: [
 *     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
 *   ],
 * }
 * ```
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANTE: Não escreva lógica entre createServerClient e
  // supabase.auth.getUser(). Um simples erro pode fazer o usuário
  // ser deslogado aleatoriamente.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rotas do dashboard - redirecionar para login se não autenticado
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // Salvar URL de destino para redirecionar após login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirecionar usuário autenticado da página de login para o dashboard
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
