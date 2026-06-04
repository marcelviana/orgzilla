import { getUsuarioLogado } from '@/lib/middleware'
import type { TipoPerfil } from '@/lib/types'
import UnauthorizedClient from './unauthorized-client'

// Lê a sessão (cookies) — não pode ser prerenderizada estaticamente.
export const dynamic = 'force-dynamic'

const PERFIL_LABELS: Record<TipoPerfil, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  visualizador: 'Visualizador',
}

export default async function Unauthorized() {
  // Fora do grupo (dashboard): sem UserProvider e sem garantia de sessão.
  // getUsuarioLogado() pode retornar null — tratado com fallback no client.
  const usuario = await getUsuarioLogado()

  return (
    <UnauthorizedClient
      nome={usuario?.nome ?? null}
      perfilLabel={usuario ? PERFIL_LABELS[usuario.tipo_perfil] : null}
    />
  )
}
