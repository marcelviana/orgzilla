'use server'

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
/**
 * Gets the Supabase API key for server-side operations.
 * 
 * According to Supabase docs (https://supabase.com/docs/guides/api/api-keys):
 * - Publishable keys (sb_publishable_...) are the NEW recommended way
 * - Anon keys (JWT-based) are the LEGACY way
 * - Both serve the same purpose (low privilege, client-safe)
 * 
 * This function prefers the publishable key but falls back to anon key for backward compatibility.
 */
function getSupabaseApiKey(): string {
  // Prefer publishable key (new, recommended)
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (publishableKey) {
    return publishableKey
  }
  
  // Fallback to anon key (legacy, still supported)
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (anonKey) {
    return anonKey
  }
  
  throw new Error(
    'Missing Supabase API key. Set either NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy).'
  )
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseApiKey(),
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
