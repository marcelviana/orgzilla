import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import {
  getDashboardMetrics,
  getNivelDistribution,
  getTimeDistribution,
  getRecentActivities
} from "@/app/actions/dashboard.actions"

/**
 * Dashboard Principal
 * - Server Component que busca dados reais do Supabase
 * - Aplica filtros de permissão (gestor vê só hierarquia)
 * - Autenticação é verificada no layout
 * - Revalida cache a cada 60 segundos
 */
export const revalidate = 60 // Revalidar a cada 60 segundos

export default async function Page() {
  // Buscar dados do dashboard em paralelo
  const [
    metricsResult,
    nivelDistResult,
    timeDistResult,
    activitiesResult,
  ] = await Promise.all([
    getDashboardMetrics(),
    getNivelDistribution(),
    getTimeDistribution(),
    getRecentActivities(),
  ])

  // Dados com fallback para arrays vazios se houver erro
  const metrics = metricsResult.success ? metricsResult.data! : {
    totalPessoas: 0,
    totalTimes: 0,
    totalVagas: 0,
    totalProjetos: 0,
    tendenciaPessoas: 0,
    tendenciaTimes: 0,
    tendenciaVagas: 0,
    tendenciaProjetos: 0,
  }

  const nivelDistribution = nivelDistResult.success ? nivelDistResult.data! : []
  const timeDistribution = timeDistResult.success ? timeDistResult.data! : []
  const recentActivities = activitiesResult.success ? activitiesResult.data! : []

  // Nome do usuário para saudação
  const nomeExibicao = usuario.pessoa?.nome || usuario.nome || 'Usuário'
  const primeiroNome = nomeExibicao.split(' ')[0]

  // Data atual formatada
  const hoje = new Date()
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <DashboardShell>
      <DashboardContent
        userName={primeiroNome}
        currentDate={dataFormatada}
        metrics={metrics}
        nivelDistribution={nivelDistribution}
        timeDistribution={timeDistribution}
        recentActivities={recentActivities}
      />
    </DashboardShell>
  )
}
