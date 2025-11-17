import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para uso no browser (Client Components)
 *
 * Este cliente é usado em componentes que rodam no navegador.
 * Ele mantém a sessão do usuário automaticamente.
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * import { createClient } from '@/lib/supabase/client'
 *
 * export default function MyComponent() {
 *   const supabase = createClient()
 *
 *   async function handleSignIn() {
 *     const { data, error } = await supabase.auth.signInWithPassword({
 *       email: 'user@example.com',
 *       password: 'password'
 *     })
 *   }
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
