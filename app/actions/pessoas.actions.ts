'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'
import { requireAdmin, getUsuarioLogado } from '@/lib/middleware'
import { PessoaRepository, PessoaRemuneracaoRepository } from '@/lib/repositories'
import { PessoaService, PermissaoService } from '@/lib/services'
import type { PessoaInsert, PessoaUpdate, PessoaRemuneracao } from '@/lib/types'
import { handleError } from '@/lib/errors/error-handler'

/**
 * Campos de remuneração coletados pelos formulários (SENSÍVEL - LGPD).
 * São separados de PessoaInsert/PessoaUpdate e gravados em pessoa_remuneracao
 * apenas no fluxo do gestor, via PessoaService.
 */
type RemuneracaoFields = {
  salario_atual?: number | null
  data_ultimo_reajuste?: string | null
  motivo_ultimo_reajuste?: string | null
}

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
    const timeId = usuario.pessoa?.time?.id

    // Para gestores, buscar IDs de todos os times da hierarquia
    let timeIdsHierarquia: string[] = []
    if (isGestor && timeId) {
      timeIdsHierarquia = await getTimeHierarchyIds(timeId)
    }

    // Campos base (sem salários — remuneração vive em pessoa_remuneracao)
    const selectFields = `
      id,
      nome,
      nome_social,
      email_corporativo,
      email_pessoal,
      foto_url,
      status,
      data_entrada,
      time_id,
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

    let pessoasList = ((pessoas as any[]) || []) as PessoaListItem[]

    // Remuneração (SENSÍVEL - LGPD): apenas gestores, e somente para pessoas da
    // sua hierarquia. Admin e visualizador nunca recebem salário.
    if (isGestor) {
      pessoasList = await anexarRemuneracaoLista(supabase, pessoasList)
    }

    return {
      success: true,
      data: {
        pessoas: pessoasList,
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
 * Busca opções de pessoas para seleção como gestor
 */
export async function getPessoasParaGestor(): Promise<
  ActionResult<Array<{ id: string; nome: string; cargo: string | null; time: string | null }>>
> {
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
      .from('pessoa')
      .select(`
        id,
        nome,
        cargo:cargo!cargo_id(nome),
        time:time!time_id(nome)
      `)
      .eq('ativo', true)
      .order('nome')

    // Filtrar por hierarquia se for gestor
    if (isGestor && timeIdsHierarquia.length > 0) {
      query = query.in('time_id', timeIdsHierarquia)
    }

    const { data: pessoas, error } = await query

    if (error) throw error

    // Format response
    const formatted = (pessoas || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      cargo: p.cargo?.nome || null,
      time: p.time?.nome || null,
    }))

    return {
      success: true,
      data: formatted,
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
 * Anexa a remuneração (SENSÍVEL - LGPD) aos itens da lista, somente para gestores
 * e somente para pessoas dentro da hierarquia do gestor (regra reutilizada de
 * PermissaoService). Admin e visualizador nunca chegam aqui.
 */
async function anexarRemuneracaoLista(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pessoas: PessoaListItem[]
): Promise<PessoaListItem[]> {
  if (pessoas.length === 0) {
    return pessoas
  }

  const usuario = await getUsuarioLogado()
  if (!usuario || usuario.tipo_perfil !== 'gestor') {
    return pessoas
  }

  const permissaoService = new PermissaoService(supabase)
  const hierarquiaIds = await permissaoService.getTimesHierarquia(usuario)
  if (hierarquiaIds.length === 0) {
    return pessoas
  }

  // Apenas pessoas dentro da hierarquia do gestor podem ter salário exposto
  const idsComSalario = pessoas
    .filter((p) => p.time?.id && hierarquiaIds.includes(p.time.id))
    .map((p) => p.id)

  if (idsComSalario.length === 0) {
    return pessoas
  }

  const remuneracaoRepo = new PessoaRemuneracaoRepository(supabase)
  const remuneracoes = await remuneracaoRepo.findByPessoaIds(idsComSalario)
  const mapa = new Map(remuneracoes.map((r) => [r.pessoa_id, r]))

  return pessoas.map((p) => {
    const rem = mapa.get(p.id)
    if (!rem) {
      return p
    }
    return {
      ...p,
      salario_atual: rem.salario_atual,
      data_ultimo_reajuste: rem.data_ultimo_reajuste,
    }
  })
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

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Busca uma pessoa por ID com todos os relacionamentos
 */
export async function getPessoaById(id: string): Promise<ActionResult<any>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const pessoaRepo = new PessoaRepository(supabase)
    const pessoa = await pessoaRepo.findByIdWithRelationships(id)

    if (!pessoa) {
      return { success: false, error: 'Pessoa não encontrada' }
    }

    // Verificar permissões (gestores só veem sua hierarquia)
    const isGestor = usuario.tipo_perfil === 'gestor'
    if (isGestor && usuario.pessoa?.time?.id) {
      const timeIdsHierarquia = await getTimeHierarchyIds(usuario.pessoa.time.id)

      if (pessoa.time_id && !timeIdsHierarquia.includes(pessoa.time_id)) {
        return { success: false, error: 'Sem permissão para visualizar esta pessoa' }
      }
    }

    // Remuneração (SENSÍVEL - LGPD): vive em pessoa_remuneracao e só é anexada
    // quando o usuário pode ver salário (gestor da hierarquia). A decisão fica
    // no Service; admin e visualizador nunca recebem a chave `remuneracao`.
    const usuarioCompleto = await getUsuarioLogado()
    if (usuarioCompleto) {
      const permissaoService = new PermissaoService(supabase)
      const podeVerSalario = await permissaoService.podeVerSalario(usuarioCompleto, id)

      if (podeVerSalario) {
        const pessoaService = new PessoaService(supabase)
        const remuneracao = await pessoaService.buscarRemuneracao(usuarioCompleto, id)
        return { success: true, data: { ...pessoa, remuneracao: remuneracao ?? null } }
      }
    }

    return { success: true, data: pessoa }
  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError.message }
  }
}

/**
 * Cria uma nova pessoa
 * Permissões: Admin ou Gestor (gestor só cria em sua hierarquia)
 */
export async function createPessoa(dados: PessoaInsert & RemuneracaoFields): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Verificar permissões
    const isAdmin = usuario.tipo_perfil === 'admin'
    const isGestor = usuario.tipo_perfil === 'gestor'

    if (!isAdmin && !isGestor) {
      return { success: false, error: 'Sem permissão para criar pessoas' }
    }

    // Separar remuneração (SENSÍVEL - LGPD) dos dados da pessoa
    const { salario_atual, data_ultimo_reajuste, motivo_ultimo_reajuste, ...dadosPessoa } = dados

    // Gestor só pode criar em times da sua hierarquia
    if (isGestor && dadosPessoa.time_id && usuario.pessoa?.time?.id) {
      const timeIdsHierarquia = await getTimeHierarchyIds(usuario.pessoa.time.id)

      if (!timeIdsHierarquia.includes(dadosPessoa.time_id)) {
        return { success: false, error: 'Sem permissão para criar pessoa neste time' }
      }
    }

    const pessoaRepo = new PessoaRepository(supabase)

    // Validar email corporativo único
    if (dadosPessoa.email_corporativo) {
      const emailExists = await pessoaRepo.findByEmailCorporativo(dadosPessoa.email_corporativo)
      if (emailExists) {
        return { success: false, error: 'Email corporativo já está em uso' }
      }
    }

    // Criar pessoa (sem salário)
    const novaPessoa = await pessoaRepo.create(dadosPessoa)

    // Remuneração: gravada APENAS no fluxo do gestor. O fluxo do admin nunca
    // toca remuneração. A decisão de permissão fica no PessoaService.
    const temRemuneracao =
      salario_atual != null || data_ultimo_reajuste != null || motivo_ultimo_reajuste != null
    if (isGestor && temRemuneracao) {
      const usuarioCompleto = await getUsuarioLogado()
      if (usuarioCompleto) {
        const pessoaService = new PessoaService(supabase)
        const remResult = await pessoaService.salvarRemuneracao(usuarioCompleto, novaPessoa.id, {
          salario_atual,
          data_ultimo_reajuste,
          motivo_ultimo_reajuste,
        })
        if (!remResult.success) {
          console.error('[createPessoa] Remuneração não gravada:', remResult.error)
        }
      }
    }

    // Revalidar páginas
    revalidatePath('/pessoas')
    if (dadosPessoa.time_id) {
      revalidatePath(`/times/${dadosPessoa.time_id}`)
    }

    return { success: true, data: novaPessoa.id }
  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError.message }
  }
}

/**
 * Atualiza uma pessoa existente
 * Permissões: Admin ou Gestor (gestor só atualiza em sua hierarquia)
 */
export async function updatePessoa(id: string, dados: PessoaUpdate & RemuneracaoFields): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Verificar permissões
    const isAdmin = usuario.tipo_perfil === 'admin'
    const isGestor = usuario.tipo_perfil === 'gestor'

    if (!isAdmin && !isGestor) {
      return { success: false, error: 'Sem permissão para atualizar pessoas' }
    }

    // Separar remuneração (SENSÍVEL - LGPD) dos dados da pessoa
    const { salario_atual, data_ultimo_reajuste, motivo_ultimo_reajuste, ...dadosPessoa } = dados

    const pessoaRepo = new PessoaRepository(supabase)

    // Buscar pessoa atual
    const pessoaAtual = await pessoaRepo.findById(id)
    if (!pessoaAtual) {
      return { success: false, error: 'Pessoa não encontrada' }
    }

    // Gestor só pode atualizar pessoas da sua hierarquia
    if (isGestor && usuario.pessoa?.time?.id) {
      const timeIdsHierarquia = await getTimeHierarchyIds(usuario.pessoa.time.id)

      if (pessoaAtual.time_id && !timeIdsHierarquia.includes(pessoaAtual.time_id)) {
        return { success: false, error: 'Sem permissão para atualizar esta pessoa' }
      }

      // Se está mudando de time, verificar se o novo time está na hierarquia
      if (dadosPessoa.time_id && !timeIdsHierarquia.includes(dadosPessoa.time_id)) {
        return { success: false, error: 'Sem permissão para mover pessoa para este time' }
      }
    }

    // Validar email corporativo único (se alterado)
    if (dadosPessoa.email_corporativo && dadosPessoa.email_corporativo !== pessoaAtual.email_corporativo) {
      const emailExists = await pessoaRepo.findByEmailCorporativo(dadosPessoa.email_corporativo)
      if (emailExists) {
        return { success: false, error: 'Email corporativo já está em uso' }
      }
    }

    // Atualizar pessoa (sem salário)
    await pessoaRepo.update(id, dadosPessoa)

    // Remuneração: gravada APENAS no fluxo do gestor. O fluxo do admin nunca
    // toca remuneração. A decisão de permissão fica no PessoaService.
    const temRemuneracao =
      salario_atual != null || data_ultimo_reajuste != null || motivo_ultimo_reajuste != null
    if (isGestor && temRemuneracao) {
      const usuarioCompleto = await getUsuarioLogado()
      if (usuarioCompleto) {
        const pessoaService = new PessoaService(supabase)
        const remResult = await pessoaService.salvarRemuneracao(usuarioCompleto, id, {
          salario_atual,
          data_ultimo_reajuste,
          motivo_ultimo_reajuste,
        })
        if (!remResult.success) {
          console.error('[updatePessoa] Remuneração não gravada:', remResult.error)
        }
      }
    }

    // Revalidar páginas
    revalidatePath('/pessoas')
    revalidatePath(`/pessoas/${id}`)
    if (pessoaAtual.time_id) {
      revalidatePath(`/times/${pessoaAtual.time_id}`)
    }
    if (dadosPessoa.time_id && dadosPessoa.time_id !== pessoaAtual.time_id) {
      revalidatePath(`/times/${dadosPessoa.time_id}`)
    }

    return { success: true }
  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError.message }
  }
}

/**
 * Desativa uma pessoa (soft delete)
 * Permissões: Apenas Admin
 */
export async function softDeletePessoa(id: string): Promise<ActionResult> {
  try {
    // Apenas admin pode desativar pessoas
    await requireAdmin()

    const supabase = await createClient()
    const pessoaRepo = new PessoaRepository(supabase)

    // Buscar pessoa
    const pessoa = await pessoaRepo.findById(id)
    if (!pessoa) {
      return { success: false, error: 'Pessoa não encontrada' }
    }

    // Desativar pessoa
    await pessoaRepo.softDelete(id)

    // Revalidar páginas
    revalidatePath('/pessoas')
    if (pessoa.time_id) {
      revalidatePath(`/times/${pessoa.time_id}`)
    }

    return { success: true }
  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError.message }
  }
}
