import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { PessoasTable } from '@/components/pessoas/pessoas-table'
import {
  getPessoasComFiltros,
  getTimesParaFiltro,
  getCargosParaFiltro,
} from '@/app/actions/pessoas.actions'
import { getCurrentUser } from '@/app/actions/auth.actions'

/**
 * Página de Listagem de Pessoas
 * - Server Component que busca dados reais do Supabase
 * - Aplica filtros de permissão (gestor vê só hierarquia)
 * - Apenas gestores veem coluna de salário
 * - Revalida cache a cada 30 segundos
 */
export const revalidate = 30 // Revalidar a cada 30 segundos

type PageProps = {
  searchParams: {
    search?: string
    timeId?: string
    cargoId?: string
    status?: string
    page?: string
    itemsPerPage?: string
  }
}

export default async function PessoasPage({ searchParams }: PageProps) {
  // Verificar autenticação
  const usuario = await getCurrentUser()
  if (!usuario) {
    redirect('/login')
  }

  // Parsear filtros da URL
  const filters = {
    search: searchParams.search,
    timeId: searchParams.timeId,
    cargoId: searchParams.cargoId,
    status: searchParams.status,
  }

  const pagination = {
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    itemsPerPage: searchParams.itemsPerPage ? parseInt(searchParams.itemsPerPage) : 10,
  }

  // Buscar dados em paralelo
  const [pessoasResult, timesResult, cargosResult] = await Promise.all([
    getPessoasComFiltros(filters, pagination),
    getTimesParaFiltro(),
    getCargosParaFiltro(),
  ])

  // Dados com fallback
  const pessoasData = pessoasResult.success
    ? pessoasResult.data!
    : { pessoas: [], total: 0, page: 1, totalPages: 0 }

  const times = timesResult.success ? timesResult.data! : []
  const cargos = cargosResult.success ? cargosResult.data! : []

  // Apenas gestores podem ver salários
  const canViewSalary = usuario.tipo_perfil === 'gestor'

  return (
    <DashboardShell>
      <PessoasTable
        initialData={pessoasData}
        times={times}
        cargos={cargos}
        canViewSalary={canViewSalary}
      />
    </DashboardShell>
  )
}
