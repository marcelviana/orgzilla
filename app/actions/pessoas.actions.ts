'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'
import { handleError } from '@/lib/errors/error-handler'

export type PessoaListItem = {
  id: string
  nome: string
  nome_social: string | null
  email_corporativo: string | null
  email_pessoal: string | null
  foto_url: string | null
  status: 'ativo' | 'ferias' | 'licenca' | 'afastamento' | 'desligado'
  data_entrada: string | null
  cargo: {
    id: string
    nome: string
    nivel: {
      nome: string
    } | null
    trilha: {
      nome: string
    } | null
  } | null
  time: {
    id: string
    nome: string
  } | null
  tags: Array<{
    tag: {
      id: string
      nome: string
      cor: string
    }
  }>
  // Campos sensíveis (apenas para gestores)
  salario_atual?: number | null
  data_ultimo_reajuste?: string | null
}

export type PessoasFilters = {
  search?: string
  timeId?: string
  cargoId?: string
  status?: string
  tagId?: string
}

export type PessoasPagination = {
  page: number
  itemsPerPage: number
}

export type PessoasResult = {
  pessoas: PessoaListItem[]
  total: number
  page: number
  totalPages: number
}

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Busca pessoas com filtros, paginação e permissões
 * - Admin: vê todos (EXCETO salários)
 * - Gestor: vê só hierarquia (PODE ver salários)
 * - Visualizador: vê todos (EXCETO salários)
 */
export async function getPessoasComFiltros(
  filters: PessoasFilters = {},
  pagination: PessoasPagination = { page: 1, itemsPerPage: 10 }
): Promise<ActionResult<PessoasResult>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const isGestor = usuario.tipo_perfil === 'gestor'
    const isAdmin = usuario.tipo_perfil === 'admin'
    const podeVerSalarios = isGestor // Apenas gestores veem salários
    const timeId = usuario.pessoa?.time?.id

    // Para gestores, buscar IDs de todos os times da hierarquia
    let timeIdsHierarquia: string[] = []
    if (isGestor && timeId) {
      timeIdsHierarquia = await getTimeHierarchyIds(timeId)
    }

    // Campos base (sem salários)
    let selectFields = `
      id,
      nome,
      nome_social,
      email_corporativo,
      email_pessoal,
      foto_url,
      status,
      data_entrada,
      cargo:cargo_id (
        id,
        nome,
        nivel:nivel_id (
          nome
        ),
        trilha:trilha_id (
          nome
        )
      ),
      time:time_id (
        id,
        nome
      ),
      tags:pessoa_tag (
        tag:tag_id (
          id,
          nome,
          cor
        )
      )
    `

    // Adicionar campos de salário apenas para gestores
    if (podeVerSalarios) {
      selectFields = `
        id,
        nome,
        nome_social,
        email_corporativo,
        email_pessoal,
        foto_url,
        status,
        data_entrada,
        salario_atual,
        data_ultimo_reajuste,
        cargo:cargo_id (
          id,
          nome,
          nivel:nivel_id (
            nome
          ),
          trilha:trilha_id (
            nome
          )
        ),
        time:time_id (
          id,
          nome
        ),
        tags:pessoa_tag (
          tag:tag_id (
            id,
            nome,
            cor
          )
        )
      `
    }

    // Query base
    let query = supabase
      .from('pessoa')
      .select(selectFields, { count: 'exact' })
      .eq('ativo', true)

    // Aplicar filtro de hierarquia para gestores
    if (isGestor && timeIdsHierarquia.length > 0) {
      query = query.in('time_id', timeIdsHierarquia)
    }

    // Aplicar filtros
    if (filters.search) {
      // Busca por nome, email ou cargo (via ILIKE)
      query = query.or(
        `nome.ilike.%${filters.search}%,email_corporativo.ilike.%${filters.search}%,email_pessoal.ilike.%${filters.search}%`
      )
    }

    if (filters.timeId && filters.timeId !== 'todos') {
      query = query.eq('time_id', filters.timeId)
    }

    if (filters.cargoId && filters.cargoId !== 'todos') {
      query = query.eq('cargo_id', filters.cargoId)
    }

    if (filters.status && filters.status !== 'todos') {
      query = query.eq('status', filters.status)
    }

    // Ordenar por nome
    query = query.order('nome')

    // Aplicar paginação
    const from = (pagination.page - 1) * pagination.itemsPerPage
    const to = from + pagination.itemsPerPage - 1
    query = query.range(from, to)

    const { data: pessoas, error, count } = await query

    if (error) throw error

    const totalPages = Math.ceil((count || 0) / pagination.itemsPerPage)

    return {
      success: true,
      data: {
        pessoas: (pessoas as PessoaListItem[]) || [],
        total: count || 0,
        page: pagination.page,
        totalPages,
      },
    }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Busca opções de times para o filtro
 */
export async function getTimesParaFiltro(): Promise<ActionResult<Array<{ id: string; nome: string }>>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const isGestor = usuario.tipo_perfil === 'gestor'
    const timeId = usuario.pessoa?.time?.id

    let timeIdsHierarquia: string[] = []
    if (isGestor && timeId) {
      timeIdsHierarquia = await getTimeHierarchyIds(timeId)
    }

    let query = supabase
      .from('time')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')

    // Filtrar por hierarquia se for gestor
    if (isGestor && timeIdsHierarquia.length > 0) {
      query = query.in('id', timeIdsHierarquia)
    }

    const { data: times, error } = await query

    if (error) throw error

    return {
      success: true,
      data: times || [],
    }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Busca opções de cargos para o filtro
 */
export async function getCargosParaFiltro(): Promise<ActionResult<Array<{ id: string; nome: string }>>> {
  try {
    const supabase = await createClient()

    const { data: cargos, error } = await supabase
      .from('cargo')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error

    return {
      success: true,
      data: cargos || [],
    }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Busca recursivamente todos os IDs de times da hierarquia
 */
async function getTimeHierarchyIds(timeId: string): Promise<string[]> {
  const supabase = await createClient()
  const ids = [timeId]

  async function buscarFilhos(parentId: string) {
    const { data: filhos } = await supabase
      .from('time')
      .select('id')
      .eq('time_pai_id', parentId)
      .eq('ativo', true)

    if (filhos && filhos.length > 0) {
      for (const filho of filhos) {
        ids.push(filho.id)
        await buscarFilhos(filho.id)
      }
    }
  }

  await buscarFilhos(timeId)
  return ids
}

/**
 * Exporta pessoas para CSV
 */
export async function exportPessoasCSV(
  filters: PessoasFilters = {}
): Promise<ActionResult<string>> {
  try {
    const result = await getPessoasComFiltros(filters, { page: 1, itemsPerPage: 10000 })

    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }

    const { pessoas } = result.data

    // Criar CSV
    const headers = ['Nome', 'Email', 'Cargo', 'Nível', 'Time', 'Status', 'Data Entrada']
    const rows = pessoas.map(p => [
      p.nome,
      p.email_corporativo || p.email_pessoal || '',
      p.cargo?.nome || '',
      p.cargo?.nivel?.nome || '',
      p.time?.nome || '',
      p.status,
      p.data_entrada ? new Date(p.data_entrada).toLocaleDateString('pt-BR') : '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return {
      success: true,
      data: csv,
    }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}
