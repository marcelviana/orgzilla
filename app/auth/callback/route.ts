import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Callback Route Handler para OAuth (Google)
 *
 * Este handler processa o retorno do Google OAuth e:
 * 1. Troca o code por uma sessão do Supabase
 * 2. Redireciona para o dashboard se bem-sucedido
 * 3. Redireciona para login com erro se falhar
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // Troca o code por sessão
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redireciona para dashboard após login bem-sucedido
      return NextResponse.redirect(`${origin}/`)
    }

    console.error('[OAuth Callback] Erro ao trocar code:', error)
  }

  // Redireciona para login com erro
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
