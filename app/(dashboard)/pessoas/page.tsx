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
 * - Autenticação é verificada no layout
 * - Revalida cache a cada 30 segundos
 */
export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{
    search?: string
    timeId?: string
    cargoId?: string
    status?: string
    page?: string
    itemsPerPage?: string
  }>
}

export default async function PessoasPage({ searchParams }: PageProps) {
  // Buscar dados do usuário para verificar permissões
  // Autenticação já foi verificada no layout
  const usuario = await getCurrentUser()
  if (!usuario) {
    // Isso nunca deve acontecer pois o layout já protege, mas TypeScript precisa
    throw new Error('Usuário não autenticado')
  }

  // Aguardar searchParams (Next.js 15+)
  const params = await searchParams

  // Parsear filtros da URL
  const filters = {
    search: params.search,
    timeId: params.timeId,
    cargoId: params.cargoId,
    status: params.status,
  }

  const pagination = {
    page: params.page ? parseInt(params.page) : 1,
    itemsPerPage: params.itemsPerPage ? parseInt(params.itemsPerPage) : 10,
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
