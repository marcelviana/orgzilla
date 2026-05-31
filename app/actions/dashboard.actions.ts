'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioLogado } from '@/lib/middleware'
import { PermissaoService } from '@/lib/services'

export type DashboardMetrics = {
  totalPessoas: number
  totalTimes: number
  totalVagas: number
  totalProjetos: number
  tendenciaPessoas: number // variação este mês
  tendenciaTimes: number
  tendenciaVagas: number
  tendenciaProjetos: number
}

export type NivelDistribution = {
  nome: string
  value: number
  color: string
}

export type TimeDistribution = {
  team: string
  count: number
}

export type RecentActivity = {
  text: string
  time: string
  icon: string
  color: string
  created_at: string
}

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

// Cores para o gráfico de níveis
const NIVEL_COLORS = [
  '#FF7A00', '#FF9533', '#FFB066', '#FFCB99', '#FFE5CC',
  '#00C8FF', '#33D4FF', '#66DFFF', '#99EAFF', '#CCFAFF',
  '#1A2734', '#3A4754', '#5A6774', '#7A8794', '#9AA7B4',
  '#FF5A5F',
]

/**
 * Busca métricas principais do dashboard
 * - Admin: vê todas as métricas
 * - Gestor: vê apenas métricas da sua hierarquia
 * - Visualizador: vê todas as métricas (dados públicos)
 */
export async function getDashboardMetrics(): Promise<ActionResult<DashboardMetrics>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const isGestor = usuario.tipo_perfil === 'gestor'

    // Gestor: restringe à sua hierarquia (times que gerencia + descendentes).
    // Fonte única: PermissaoService.getTimesHierarquia.
    let timeIdsHierarquia: string[] = []
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      timeIdsHierarquia = await permissaoService.getTimesHierarquia(usuario)
    }

    // Total de pessoas ativas
    let queryPessoas = supabase
      .from('pessoa')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .eq('status', 'ativo')

    if (isGestor) {
      queryPessoas = queryPessoas.in('time_id', timeIdsHierarquia)
    }

    const { count: totalPessoas } = await queryPessoas

    // Total de times ativos
    let queryTimes = supabase
      .from('time')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)

    if (isGestor) {
      queryTimes = queryTimes.in('id', timeIdsHierarquia)
    }

    const { count: totalTimes } = await queryTimes

    // Total de vagas abertas
    let queryVagas = supabase
      .from('vaga_time')
      .select('quantidade', { count: 'exact' })
      .eq('ativo', true)

    if (isGestor) {
      queryVagas = queryVagas.in('time_id', timeIdsHierarquia)
    }

    const { data: vagas } = await queryVagas
    const totalVagas = vagas?.reduce((sum, v) => sum + (v.quantidade || 0), 0) || 0

    // Total de projetos ativos
    const { count: totalProjetos } = await supabase
      .from('projeto_produto')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)

    // Calcular tendências (pessoas criadas este mês vs mês passado)
    const now = new Date()
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Pessoas criadas este mês
    let queryPessoasEsteMes = supabase
      .from('pessoa')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .gte('created_at', firstDayThisMonth.toISOString())

    if (isGestor) {
      queryPessoasEsteMes = queryPessoasEsteMes.in('time_id', timeIdsHierarquia)
    }

    const { count: pessoasEsteMes } = await queryPessoasEsteMes

    // Pessoas criadas mês passado
    let queryPessoasMesPassado = supabase
      .from('pessoa')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .gte('created_at', firstDayLastMonth.toISOString())
      .lt('created_at', firstDayThisMonth.toISOString())

    if (isGestor) {
      queryPessoasMesPassado = queryPessoasMesPassado.in('time_id', timeIdsHierarquia)
    }

    const { count: pessoasMesPassado } = await queryPessoasMesPassado

    const tendenciaPessoas = (pessoasEsteMes || 0) - (pessoasMesPassado || 0)

    return {
      success: true,
      data: {
        totalPessoas: totalPessoas || 0,
        totalTimes: totalTimes || 0,
        totalVagas: totalVagas,
        totalProjetos: totalProjetos || 0,
        tendenciaPessoas,
        tendenciaTimes: 0, // Pode implementar lógica similar se necessário
        tendenciaVagas: 0,
        tendenciaProjetos: 0,
      },
    }
  } catch (error) {
    console.error('[getDashboardMetrics] Erro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar métricas',
    }
  }
}

/**
 * Busca distribuição de pessoas por nível
 */
export async function getNivelDistribution(): Promise<ActionResult<NivelDistribution[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const isGestor = usuario.tipo_perfil === 'gestor'

    // Fonte única de hierarquia do gestor
    let timeIdsHierarquia: string[] = []
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      timeIdsHierarquia = await permissaoService.getTimesHierarquia(usuario)
    }

    // Buscar pessoas com cargo e nível
    let query = supabase
      .from('pessoa')
      .select(`
        id,
        cargo:cargo_id (
          id,
          nivel:nivel_id (
            id,
            nome
          )
        )
      `)
      .eq('ativo', true)
      .eq('status', 'ativo')

    if (isGestor) {
      query = query.in('time_id', timeIdsHierarquia)
    }

    const { data: pessoas, error } = await query

    if (error) throw error

    // Agrupar por nível
    const nivelMap = new Map<string, number>()

    const pessoasNivel = (pessoas ?? []) as unknown as Array<{
      cargo?: { nivel?: { nome?: string | null } | null } | null
    }>
    pessoasNivel.forEach((pessoa) => {
      const nivelNome = pessoa.cargo?.nivel?.nome
      if (nivelNome) {
        nivelMap.set(nivelNome, (nivelMap.get(nivelNome) || 0) + 1)
      }
    })

    // Converter para array e adicionar cores
    const distribution = Array.from(nivelMap.entries())
      .map(([nome, value], index) => ({
        nome,
        value,
        color: NIVEL_COLORS[index % NIVEL_COLORS.length],
      }))
      .sort((a, b) => {
        // Ordenar por número do nível (L1, L2, ..., L16)
        const numA = parseInt(a.nome.replace('L', ''))
        const numB = parseInt(b.nome.replace('L', ''))
        return numA - numB
      })

    return {
      success: true,
      data: distribution,
    }
  } catch (error) {
    console.error('[getNivelDistribution] Erro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar distribuição por nível',
    }
  }
}

/**
 * Busca distribuição de pessoas por time (top 5)
 */
export async function getTimeDistribution(): Promise<ActionResult<TimeDistribution[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const isGestor = usuario.tipo_perfil === 'gestor'

    // Fonte única de hierarquia do gestor
    let timeIdsHierarquia: string[] = []
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      timeIdsHierarquia = await permissaoService.getTimesHierarquia(usuario)
    }

    // Buscar pessoas com time
    let query = supabase
      .from('pessoa')
      .select(`
        id,
        time:time_id (
          id,
          nome
        )
      `)
      .eq('ativo', true)
      .eq('status', 'ativo')

    if (isGestor) {
      query = query.in('time_id', timeIdsHierarquia)
    }

    const { data: pessoas, error } = await query

    if (error) throw error

    // Agrupar por time
    const timeMap = new Map<string, number>()

    const pessoasTime = (pessoas ?? []) as unknown as Array<{
      time?: { nome?: string | null } | null
    }>
    pessoasTime.forEach((pessoa) => {
      const timeNome = pessoa.time?.nome
      if (timeNome) {
        timeMap.set(timeNome, (timeMap.get(timeNome) || 0) + 1)
      }
    })

    // Converter para array, ordenar por count e pegar top 5
    const distribution = Array.from(timeMap.entries())
      .map(([team, count]) => ({ team, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      success: true,
      data: distribution,
    }
  } catch (error) {
    console.error('[getTimeDistribution] Erro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar distribuição por time',
    }
  }
}

/**
 * Busca atividades recentes (histórico de mudanças)
 */
export async function getRecentActivities(): Promise<ActionResult<RecentActivity[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Buscar últimas 5 atividades
    const { data: historico, error } = await supabase
      .from('historico_mudanca')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw error

    // Formatar atividades
    const activities: RecentActivity[] =
      historico?.map((item) => {
        let text = 'Alteração realizada'
        let icon = 'Activity'
        let color = 'bg-gray-100 text-gray-600'

        // Determinar texto e estilo baseado no tipo de mudança
        if (item.tipo_entidade === 'pessoa') {
          if (item.tipo_mudanca === 'criacao') {
            text = 'Nova pessoa adicionada ao sistema'
            icon = 'Users'
            color = 'bg-blue-100 text-blue-600'
          } else if (item.tipo_mudanca === 'edicao' && item.campo_alterado === 'time_id') {
            text = 'Pessoa mudou de time'
            icon = 'Activity'
            color = 'bg-cyan-100 text-accent'
          } else if (item.tipo_mudanca === 'edicao' && item.campo_alterado === 'cargo_id') {
            text = 'Pessoa foi promovida'
            icon = 'TrendingUp'
            color = 'bg-purple-100 text-purple-600'
          }
        } else if (item.tipo_entidade === 'time') {
          if (item.tipo_mudanca === 'criacao') {
            text = 'Novo time criado'
            icon = 'Network'
            color = 'bg-green-100 text-green-600'
          }
        } else if (item.tipo_entidade === 'vaga_time') {
          if (item.tipo_mudanca === 'criacao') {
            text = 'Nova vaga aberta'
            icon = 'Briefcase'
            color = 'bg-green-100 text-green-600'
          }
        } else if (item.tipo_entidade === 'projeto_produto') {
          if (item.tipo_mudanca === 'criacao') {
            text = 'Novo projeto criado'
            icon = 'FolderKanban'
            color = 'bg-orange-100 text-primary'
          }
        }

        // Calcular tempo relativo
        const createdAt = new Date(item.created_at)
        const now = new Date()
        const diffMs = now.getTime() - createdAt.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        let time: string
        if (diffMins < 1) {
          time = 'agora'
        } else if (diffMins < 60) {
          time = `${diffMins}m atrás`
        } else if (diffHours < 24) {
          time = `${diffHours}h atrás`
        } else {
          time = `${diffDays}d atrás`
        }

        return {
          text,
          time,
          icon,
          color,
          created_at: item.created_at,
        }
      }) || []

    return {
      success: true,
      data: activities,
    }
  } catch (error) {
    console.error('[getRecentActivities] Erro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar atividades',
    }
  }
}

