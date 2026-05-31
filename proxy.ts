import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy do Next.js 16+ para autenticação com Supabase
 *
 * IMPORTANTE (Next.js 16):
 * - Substituiu middleware.ts (convenção descontinuada no Next.js 16)
 * - Usa getUser() em vez de updateSession() para evitar proxy
 * - getUser() apenas lê cookies, não modifica headers
 * - Compatível com Next.js 16+ (sem proxy de requisições)
 *
 * Este proxy:
 * - Verifica autenticação do usuário
 * - Protege rotas do dashboard (redireciona para /login se não autenticado)
 * - Redireciona usuários autenticados de /login para o dashboard
 *
 * Referência: https://nextjs.org/docs/messages/middleware-to-proxy
 */
export async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  // Validar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Prefer publishable key (new, recommended) but fallback to anon key (legacy)
  const supabaseApiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseApiKey) {
    // Se não estiver configurado, permitir acesso mas sem autenticação
    // Isso permite desenvolvimento local sem Supabase configurado
    console.warn('[Proxy] Supabase não configurado. Variáveis de ambiente ausentes.')
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseApiKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANTE: Usar getUser() em vez de updateSession()
  // getUser() apenas lê os cookies, não faz proxy (compatível com Next.js 16)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rotas - redirecionar se não autenticado
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se autenticado e está em /login, redirecionar para dashboard
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
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

