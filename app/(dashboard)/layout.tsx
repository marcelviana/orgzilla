import { redirect } from 'next/navigation'
import { getUsuarioLogado } from '@/lib/middleware'
import { UserProvider } from '@/components/providers/user-provider'

/**
 * Layout do Dashboard
 *
 * Protege todas as rotas do dashboard verificando autenticação.
 * Se usuário não estiver autenticado, redireciona para /login.
 *
 * Fornece dados do usuário autenticado via Context (UserProvider)
 * para todos os componentes filhos.
 */
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Buscar usuário autenticado (com auto-create se necessário)
  const usuario = await getUsuarioLogado()

  // Se não autenticado ou inativo, redirecionar para login
  if (!usuario) {
    redirect('/login')
  }

  // Fornecer dados do usuário via Context
  return (
    <UserProvider usuario={usuario}>
      {children}
    </UserProvider>
  )
}
