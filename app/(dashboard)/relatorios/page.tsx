import { getUsuarioLogado } from '@/lib/middleware'
import { redirect } from 'next/navigation'
import {
  getDistribuicaoPorNivel,
  getDistribuicaoPorStatus,
  getTopTimes,
  getPessoasPorCargo,
  getMetricasVagas,
  getMetricasProjetos,
  getDadosFinanceiros,
} from '@/app/actions/relatorios.actions'
import { RelatoriosClient } from './relatorios-client'

export default async function RelatoriosPage() {
  const usuario = await getUsuarioLogado()
  if (!usuario) redirect('/login')

  const isGestor = usuario.tipo_perfil === 'gestor'

  // Busca todos os dados em paralelo
  const [
    nivelResult,
    statusResult,
    topTimesResult,
    cargosResult,
    vagasResult,
    projetosResult,
    financeiroResult,
  ] = await Promise.all([
    getDistribuicaoPorNivel(),
    getDistribuicaoPorStatus(),
    getTopTimes(),
    getPessoasPorCargo(),
    getMetricasVagas(),
    getMetricasProjetos(),
    getDadosFinanceiros(),
  ])

  return (
    <RelatoriosClient
      isGestor={isGestor}
      distribuicaoPorNivel={nivelResult.data ?? []}
      distribuicaoPorStatus={statusResult.data ?? []}
      topTimes={topTimesResult.data ?? []}
      pessoasPorCargo={cargosResult.data ?? []}
      metricasVagas={vagasResult.data ?? []}
      metricasProjetos={projetosResult.data ?? { totalAtivos: 0, totalInativos: 0, topProjetos: [] }}
      dadosFinanceiros={financeiroResult.data ?? null}
    />
  )
}
