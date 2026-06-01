'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioLogado } from '@/lib/middleware'
import { PermissaoService } from '@/lib/services'
import { PessoaService } from '@/lib/services/pessoa.service'

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

export type DistribuicaoItem = {
  name: string
  value: number
  color: string
}

export type TopTimeItem = {
  name: string
  value: number
}

export type PessoaPorCargoItem = {
  cargo: string
  count: number
  percentage: number
}

export type MetricasVagasItem = {
  team: string
  openings: number
  current: number
  rate: number
}

export type MetricasProjetosData = {
  totalAtivos: number
  totalInativos: number
  topProjetos: { name: string; people: number }[]
}

export type SalarioPorNivelItem = {
  level: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
}

export type MediaSalarioPorTimeItem = {
  team: string
  avg: number
}

export type DadosFinanceiros = {
  salariosPorNivel: SalarioPorNivelItem[]
  mediaSalarioPorTime: MediaSalarioPorTimeItem[]
  totalFolha: number
}

// Cores padrão do design system Orgzilla
const COLORS = [
  '#FF7A00', '#FF9A33', '#00C8FF', '#33D4FF', '#66E0FF',
  '#1A2734', '#3A4754', '#5A6774', '#FF5A5F', '#10b981',
  '#3b82f6', '#f59e0b', '#6b7280',
]

/**
 * Distribuição de pessoas ativas por nível de cargo
 */
export async function getDistribuicaoPorNivel(): Promise<ActionResult<DistribuicaoItem[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()
    if (!usuario) return { success: false, error: 'Não autenticado' }

    const isGestor = usuario.tipo_perfil === 'gestor'
    let timeIds: string[] = []
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      timeIds = await permissaoService.getTimesHierarquia(usuario)
    }

    let query = supabase
      .from('pessoa')
      .select('cargo:cargo_id(nivel:nivel_id(nome))')
      .eq('ativo', true)

    if (isGestor && timeIds.length > 0) {
      query = query.in('time_id', timeIds)
    }

    const { data, error } = await query
    if (error) throw error

    // Agrupa por nível
    const counts: Record<string, number> = {}
    for (const p of data ?? []) {
      const nivel = (p.cargo as { nivel?: { nome?: string } } | null)?.nivel?.nome
      if (nivel) {
        counts[nivel] = (counts[nivel] ?? 0) + 1
      }
    }

    // Ordena L1, L2, ... L16
    const sorted = Object.entries(counts).sort((a, b) => {
      const na = parseInt(a[0].replace('L', ''), 10)
      const nb = parseInt(b[0].replace('L', ''), 10)
      return na - nb
    })

    const result: DistribuicaoItem[] = sorted.map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length],
    }))

    return { success: true, data: result }
  } catch (error) {
    console.error('[getDistribuicaoPorNivel]', error)
    return { success: false, error: 'Erro ao buscar distribuição por nível' }
  }
}

/**
 * Distribuição de pessoas ativas por status (ativo, férias, licença, afastamento)
 */
export async function getDistribuicaoPorStatus(): Promise<ActionResult<DistribuicaoItem[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()
    if (!usuario) return { success: false, error: 'Não autenticado' }

    const isGestor = usuario.tipo_perfil === 'gestor'
    let timeIds: string[] = []
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      timeIds = await permissaoService.getTimesHierarquia(usuario)
    }

    let query = supabase
      .from('pessoa')
      .select('status')
      .eq('ativo', true)

    if (isGestor && timeIds.length > 0) {
      query = query.in('time_id', timeIds)
    }

    const { data, error } = await query
    if (error) throw error

    const STATUS_LABELS: Record<string, string> = {
      ativo: 'Ativo',
      ferias: 'Férias',
      licenca: 'Licença',
      afastamento: 'Afastamento',
      desligado: 'Desligado',
    }
    const STATUS_COLORS: Record<string, string> = {
      ativo: '#10b981',
      ferias: '#3b82f6',
      licenca: '#FF7A00',
      afastamento: '#ef4444',
      desligado: '#6b7280',
    }

    const counts: Record<string, number> = {}
    for (const p of data ?? []) {
      if (p.status) {
        counts[p.status] = (counts[p.status] ?? 0) + 1
      }
    }

    const result: DistribuicaoItem[] = Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name: STATUS_LABELS[key] ?? key,
        value,
        color: STATUS_COLORS[key] ?? '#6b7280',
      }))

    return { success: true, data: result }
  } catch (error) {
    console.error('[getDistribuicaoPorStatus]', error)
    return { success: false, error: 'Erro ao buscar distribuição por status' }
  }
}

/**
 * Top 5 times por número de pessoas
 */
export async function getTopTimes(): Promise<ActionResult<TopTimeItem[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()
    if (!usuario) return { success: false, error: 'Não autenticado' }

    const isGestor = usuario.tipo_perfil === 'gestor'
    let timeIds: string[] = []
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      timeIds = await permissaoService.getTimesHierarquia(usuario)
    }

    let query = supabase
      .from('pessoa')
      .select('time:time_id(nome)')
      .eq('ativo', true)

    if (isGestor && timeIds.length > 0) {
      query = query.in('time_id', timeIds)
    }

    const { data, error } = await query
    if (error) throw error

    const counts: Record<string, number> = {}
    for (const p of data ?? []) {
      const nome = (p.time as { nome?: string } | null)?.nome
      if (nome) {
        counts[nome] = (counts[nome] ?? 0) + 1
      }
    }

    const result: TopTimeItem[] = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    return { success: true, data: result }
  } catch (error) {
    console.error('[getTopTimes]', error)
    return { success: false, error: 'Erro ao buscar top times' }
  }
}

/**
 * Pessoas por cargo (top 10 cargos)
 */
export async function getPessoasPorCargo(): Promise<ActionResult<PessoaPorCargoItem[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()
    if (!usuario) return { success: false, error: 'Não autenticado' }

    const isGestor = usuario.tipo_perfil === 'gestor'
    let timeIds: string[] = []
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      timeIds = await permissaoService.getTimesHierarquia(usuario)
    }

    let query = supabase
      .from('pessoa')
      .select('cargo:cargo_id(nome)')
      .eq('ativo', true)

    if (isGestor && timeIds.length > 0) {
      query = query.in('time_id', timeIds)
    }

    const { data, error } = await query
    if (error) throw error

    const counts: Record<string, number> = {}
    let total = 0
    for (const p of data ?? []) {
      const nome = (p.cargo as { nome?: string } | null)?.nome
      if (nome) {
        counts[nome] = (counts[nome] ?? 0) + 1
        total++
      }
    }

    const result: PessoaPorCargoItem[] = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cargo, count]) => ({
        cargo,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))

    return { success: true, data: result }
  } catch (error) {
    console.error('[getPessoasPorCargo]', error)
    return { success: false, error: 'Erro ao buscar pessoas por cargo' }
  }
}

/**
 * Tamanho de todos os times (para treemap) + taxa de ocupação (vagas vs pessoas)
 */
export async function getMetricasVagas(): Promise<ActionResult<MetricasVagasItem[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()
    if (!usuario) return { success: false, error: 'Não autenticado' }

    const isGestor = usuario.tipo_perfil === 'gestor'
    let timeIds: string[] = []
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      timeIds = await permissaoService.getTimesHierarquia(usuario)
    }

    // Busca todos os times ativos
    let queryTimes = supabase
      .from('time')
      .select('id, nome')
      .eq('ativo', true)

    if (isGestor && timeIds.length > 0) {
      queryTimes = queryTimes.in('id', timeIds)
    }

    const { data: times, error: timesError } = await queryTimes
    if (timesError) throw timesError

    if (!times || times.length === 0) return { success: true, data: [] }

    const allTimeIds = times.map((t) => t.id)

    // Pessoas ativas por time
    const { data: pessoas, error: pessoasError } = await supabase
      .from('pessoa')
      .select('time_id')
      .eq('ativo', true)
      .in('time_id', allTimeIds)

    if (pessoasError) throw pessoasError

    // Vagas abertas por time (soma de quantidade)
    const { data: vagas, error: vagasError } = await supabase
      .from('vaga_time')
      .select('time_id, quantidade')
      .eq('ativo', true)
      .in('time_id', allTimeIds)

    if (vagasError) throw vagasError

    // Agrega
    const pessoasPorTime: Record<string, number> = {}
    for (const p of pessoas ?? []) {
      if (p.time_id) pessoasPorTime[p.time_id] = (pessoasPorTime[p.time_id] ?? 0) + 1
    }

    const vagasPorTime: Record<string, number> = {}
    for (const v of vagas ?? []) {
      if (v.time_id) vagasPorTime[v.time_id] = (vagasPorTime[v.time_id] ?? 0) + (v.quantidade ?? 0)
    }

    const result: MetricasVagasItem[] = times
      .map((t) => {
        const current = pessoasPorTime[t.id] ?? 0
        const openings = vagasPorTime[t.id] ?? 0
        const total = current + openings
        const rate = total > 0 ? Math.round((current / total) * 100) : 100
        return { team: t.nome, openings, current, rate }
      })
      .sort((a, b) => b.openings - a.openings)

    return { success: true, data: result }
  } catch (error) {
    console.error('[getMetricasVagas]', error)
    return { success: false, error: 'Erro ao buscar métricas de vagas' }
  }
}

/**
 * Métricas de projetos: contagem ativo/inativo + top projetos por alocação de pessoas
 *
 * Projetos são uma entidade global (não escopada por hierarquia de gestor),
 * pois um projeto pode ter pessoas de múltiplos times. Nenhum dado sensível exposto.
 */
export async function getMetricasProjetos(): Promise<ActionResult<MetricasProjetosData>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()
    if (!usuario) return { success: false, error: 'Não autenticado' }

    // Projetos ativo/inativo
    const { data: projetos, error: projetosError } = await supabase
      .from('projeto_produto')
      .select('id, nome, ativo')

    if (projetosError) throw projetosError

    const totalAtivos = projetos?.filter((p) => p.ativo).length ?? 0
    const totalInativos = projetos?.filter((p) => !p.ativo).length ?? 0

    // Alocações ativas (data_fim null = atual)
    const { data: alocacoes, error: alocacoesError } = await supabase
      .from('pessoa_projeto_produto')
      .select('projeto_produto_id')
      .is('data_fim', null)
      .eq('ativo', true)

    if (alocacoesError) throw alocacoesError

    const pessoasPorProjeto: Record<string, number> = {}
    for (const a of alocacoes ?? []) {
      if (a.projeto_produto_id) {
        pessoasPorProjeto[a.projeto_produto_id] = (pessoasPorProjeto[a.projeto_produto_id] ?? 0) + 1
      }
    }

    const topProjetos = (projetos ?? [])
      .filter((p) => p.ativo)
      .map((p) => ({ name: p.nome, people: pessoasPorProjeto[p.id] ?? 0 }))
      .sort((a, b) => b.people - a.people)
      .slice(0, 5)

    return { success: true, data: { totalAtivos, totalInativos, topProjetos } }
  } catch (error) {
    console.error('[getMetricasProjetos]', error)
    return { success: false, error: 'Erro ao buscar métricas de projetos' }
  }
}

/**
 * Dados financeiros — SOMENTE GESTOR (LGPD)
 * Retorna null para admin/visualizador.
 */
export async function getDadosFinanceiros(): Promise<ActionResult<DadosFinanceiros | null>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()
    if (!usuario) return { success: false, error: 'Não autenticado' }

    // Somente gestor pode ver dados salariais (LGPD)
    if (usuario.tipo_perfil !== 'gestor') {
      return { success: true, data: null }
    }

    const permissaoService = new PermissaoService(supabase)
    const timeIds = await permissaoService.getTimesHierarquia(usuario)

    if (timeIds.length === 0) {
      return { success: true, data: { salariosPorNivel: [], mediaSalarioPorTime: [], totalFolha: 0 } }
    }

    const pessoaService = new PessoaService(supabase)
    const remFiltered = await pessoaService.buscarAgregadosSalariais(usuario, timeIds)

    // Agrupa por nível
    const salariosPorNivelMap: Record<string, number[]> = {}
    const salariosPorTimeMap: Record<string, number[]> = {}
    let totalFolha = 0

    for (const r of remFiltered) {
      const salario = r.salario_atual as number
      const nivel = r.pessoa?.cargo?.nivel?.nome
      const timeId = r.pessoa?.time_id

      if (nivel && salario) {
        salariosPorNivelMap[nivel] = salariosPorNivelMap[nivel] ?? []
        salariosPorNivelMap[nivel].push(salario)
      }
      if (timeId && salario) {
        salariosPorTimeMap[timeId] = salariosPorTimeMap[timeId] ?? []
        salariosPorTimeMap[timeId].push(salario)
        totalFolha += salario
      }
    }

    // Calcula estatísticas por nível
    // LGPD: suprime níveis com menos de 3 pessoas para evitar re-identificação salarial
    const MIN_GRUPO = 3
    const salariosPorNivel: SalarioPorNivelItem[] = Object.entries(salariosPorNivelMap)
      .sort((a, b) => {
        const na = parseInt(a[0].replace('L', ''), 10)
        const nb = parseInt(b[0].replace('L', ''), 10)
        return na - nb
      })
      .filter(([, valores]) => valores.length >= MIN_GRUPO)
      .map(([level, valores]) => {
        const sorted = [...valores].sort((a, b) => a - b)
        const n = sorted.length
        const percentile = (p: number) => {
          const idx = (p / 100) * (n - 1)
          const low = Math.floor(idx)
          const high = Math.ceil(idx)
          return sorted[low] + (sorted[high] - sorted[low]) * (idx - low)
        }
        return {
          level,
          min: sorted[0],
          q1: Math.round(percentile(25)),
          median: Math.round(percentile(50)),
          q3: Math.round(percentile(75)),
          max: sorted[n - 1],
        }
      })

    // Busca nomes dos times para o mapa
    const { data: times } = await supabase
      .from('time')
      .select('id, nome')
      .in('id', Object.keys(salariosPorTimeMap))

    const nomeTime: Record<string, string> = {}
    for (const t of times ?? []) {
      nomeTime[t.id] = t.nome
    }

    // LGPD: suprime times com menos de 3 pessoas para evitar re-identificação salarial
    const mediaSalarioPorTime: MediaSalarioPorTimeItem[] = Object.entries(salariosPorTimeMap)
      .filter(([, valores]) => valores.length >= MIN_GRUPO)
      .map(([timeId, valores]) => ({
        team: nomeTime[timeId] ?? timeId,
        avg: Math.round(valores.reduce((s, v) => s + v, 0) / valores.length),
      }))
      .sort((a, b) => b.avg - a.avg)

    return {
      success: true,
      data: { salariosPorNivel, mediaSalarioPorTime, totalFolha },
    }
  } catch (error) {
    console.error('[getDadosFinanceiros]', error)
    return { success: false, error: 'Erro ao buscar dados financeiros' }
  }
}
