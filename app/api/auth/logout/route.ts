import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Route Handler para Logout
 *
 * POST /api/auth/logout
 * Desloga o usuário do Supabase Auth e invalida a sessão
 */
export async function POST() {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[Logout] Erro:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Retorna sucesso (o cliente fará o redirect)
    return NextResponse.json(
      { success: true, message: 'Logout realizado com sucesso' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Logout] Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    )
  }
}
