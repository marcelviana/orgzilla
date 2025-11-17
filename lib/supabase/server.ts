import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para uso server-side (Server Components, Server Actions, Route Handlers)
 *
 * Este cliente é usado em componentes e funções que rodam no servidor.
 * Ele lê e atualiza cookies para manter a sessão do usuário.
 *
 * @example Server Component
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = await createClient()
 *
 *   const { data: user } = await supabase.auth.getUser()
 *   const { data: pessoas } = await supabase
 *     .from('pessoa')
 *     .select('*')
 *
 *   return <div>...</div>
 * }
 * ```
 *
 * @example Server Action
 * ```tsx
 * 'use server'
 *
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function updatePessoa(id: string, data: any) {
 *   const supabase = await createClient()
 *
 *   const { error } = await supabase
 *     .from('pessoa')
 *     .update(data)
 *     .eq('id', id)
 *
 *   if (error) throw error
 * }
 * ```
 *
 * @example Route Handler
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 * import { NextResponse } from 'next/server'
 *
 * export async function GET() {
 *   const supabase = await createClient()
 *
 *   const { data, error } = await supabase
 *     .from('pessoa')
 *     .select('*')
 *
 *   if (error) {
 *     return NextResponse.json({ error: error.message }, { status: 500 })
 *   }
 *
 *   return NextResponse.json({ data })
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Os cookies setAll podem ser chamados do Server Component,
            // que não pode modificar cookies. Ignorar erro.
          }
        },
      },
    }
  )
}
