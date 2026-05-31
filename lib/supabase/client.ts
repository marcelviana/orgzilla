import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

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
/**
 * Gets the Supabase API key for client-side operations.
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

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseApiKey()
  )
}
