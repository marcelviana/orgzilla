import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProvider } from '@/components/providers/user-provider'

/**
 * Layout do Dashboard
 *
 * - Busca dados do usuário autenticado
 * - Redireciona para login se não autenticado (fallback, middleware já protege)
 * - Fornece dados do usuário via Context (UserProvider)
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verificar autenticação
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser || !authUser.email) {
    redirect('/login')
  }

  // Buscar dados completos do usuário na tabela usuario
  const { data: usuario, error } = await supabase
    .from('usuario')
    .select(`
      *,
      pessoa:pessoa_id (
        id,
        nome,
        email_corporativo,
        foto_url,
        cargo:cargo_id (
          id,
          nome
        ),
        time:time_id (
          id,
          nome
        )
      )
    `)
    .eq('email', authUser.email)
    .single()

  // Se não encontrou usuário na tabela, criar automaticamente
  if (error || !usuario) {
    console.log('[DashboardLayout] Usuário não encontrado na tabela, criando...')

    const { data: novoUsuario, error: createError } = await supabase
      .from('usuario')
      .insert({
        id: authUser.id,
        email: authUser.email,
        nome: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        tipo_perfil: 'visualizador', // Padrão
        ativo: true,
      })
      .select()
      .single()

    if (createError) {
      console.error('[DashboardLayout] Erro ao criar usuário:', createError)
      redirect('/login')
    }

    // Buscar usuário recém-criado com relacionamentos
    const { data: usuarioCriado } = await supabase
      .from('usuario')
      .select(`
        *,
        pessoa:pessoa_id (
          id,
          nome,
          email_corporativo,
          foto_url,
          cargo:cargo_id (
            id,
            nome
          ),
          time:time_id (
            id,
            nome
          )
        )
      `)
      .eq('id', authUser.id)
      .single()

    return (
      <UserProvider usuario={usuarioCriado}>
        {children}
      </UserProvider>
    )
  }

  // Usuário encontrado, fornecer via Context
  return (
    <UserProvider usuario={usuario}>
      {children}
    </UserProvider>
  )
}
