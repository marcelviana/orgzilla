'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, getUsuarioLogado } from '@/lib/middleware'
import { PessoaRepository, CargoRepository, TimeRepository } from '@/lib/repositories'
import { PessoaService, PermissaoService } from '@/lib/services'
import type { PessoaInsert, PessoaUpdate, PessoaComRelacionamentos, PessoaRemuneracao } from '@/lib/types'
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
  // Dados sensíveis (apenas para gestores, via pessoa_remuneracao)
  remuneracao?: {
    salario_atual: number | null
    data_ultimo_reajuste: string | null
  } | null
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

    const pessoaRepo = new PessoaRepository(supabase)
    const { data: pessoas, count } = await pessoaRepo.findComFiltrosPaginados({
      filters: {
        search: filters.search,
        // Normaliza sentinelas de UI antes de passar ao Repository
        timeId: filters.timeId && filters.timeId !== 'todos' ? filters.timeId : undefined,
        cargoId: filters.cargoId && filters.cargoId !== 'todos' ? filters.cargoId : undefined,
        status: filters.status && filters.status !== 'todos' ? filters.status : undefined,
      },
      timeIdsHierarquia: isGestor ? timeIdsHierarquia : undefined,
      pagination,
    })

    const totalPages = Math.ceil((count || 0) / pagination.itemsPerPage)

    let pessoasList = pessoas as unknown as PessoaListItem[]

    // Remuneração (SENSÍVEL - LGPD): apenas gestores, e somente para pessoas da
    // sua hierarquia. Admin e visualizador nunca recebem salário.
    if (isGestor) {
      const pessoaService = new PessoaService(supabase)
      pessoasList = await pessoaService.enriquecerListaComRemuneracao(pessoasList, timeIdsHierarquia, usuario)
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
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const isGestor = usuario.tipo_perfil === 'gestor'

    let timeIdsHierarquia: string[] = []
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      timeIdsHierarquia = await permissaoService.getTimesHierarquia(usuario)
    }

    const timeRepo = new TimeRepository(supabase)
    const times = await timeRepo.findAtivosParaFiltro(isGestor ? timeIdsHierarquia : undefined)

    return {
      success: true,
      data: times,
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
    const cargoRepo = new CargoRepository(supabase)
    const cargos = await cargoRepo.findAtivosParaFiltro()

    return {
      success: true,
      data: cargos,
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
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const isGestor = usuario.tipo_perfil === 'gestor'

    let timeIdsHierarquia: string[] = []
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      timeIdsHierarquia = await permissaoService.getTimesHierarquia(usuario)
    }

    const pessoaRepo = new PessoaRepository(supabase)
    const pessoasRaw = await pessoaRepo.findParaSelecao(isGestor ? timeIdsHierarquia : undefined)
    const formatted = pessoasRaw.map((p) => ({
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
export async function getPessoaById(
  id: string
): Promise<ActionResult<PessoaComRelacionamentos & { remuneracao?: PessoaRemuneracao | null }>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const pessoaRepo = new PessoaRepository(supabase)
    const pessoa = await pessoaRepo.findByIdWithRelationships(id)

    if (!pessoa) {
      return { success: false, error: 'Pessoa não encontrada' }
    }

    const permissaoService = new PermissaoService(supabase)
    const isGestor = usuario.tipo_perfil === 'gestor'

    // Gestor só vê pessoas da sua hierarquia (times que gerencia + descendentes)
    if (isGestor) {
      const timeIdsHierarquia = await permissaoService.getTimesHierarquia(usuario)
      if (!pessoa.time_id || !timeIdsHierarquia.includes(pessoa.time_id)) {
        return { success: false, error: 'Sem permissão para visualizar esta pessoa' }
      }
    }

    // Remuneração (SENSÍVEL - LGPD): vive em pessoa_remuneracao e só é anexada
    // quando o usuário pode ver salário (gestor da hierarquia). A decisão fica
    // no Service; admin e visualizador nunca recebem a chave `remuneracao`.
    const podeVerSalario = await permissaoService.podeVerSalario(usuario, id)
    if (podeVerSalario) {
      const pessoaService = new PessoaService(supabase)
      const remuneracao = await pessoaService.buscarRemuneracao(usuario, id)
      return { success: true, data: { ...pessoa, remuneracao: remuneracao ?? null } }
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
    const usuario = await getUsuarioLogado()

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

    // Gestor só pode criar em times da sua hierarquia (fonte única)
    if (isGestor && dadosPessoa.time_id) {
      const permissaoService = new PermissaoService(supabase)
      const timeIdsHierarquia = await permissaoService.getTimesHierarquia(usuario)

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
      const pessoaService = new PessoaService(supabase)
      const remResult = await pessoaService.salvarRemuneracao(usuario, novaPessoa.id, {
        salario_atual,
        data_ultimo_reajuste,
        motivo_ultimo_reajuste,
      })
      if (!remResult.success) {
        console.error('[createPessoa] Remuneração não gravada:', remResult.error)
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
export async function updatePessoa(id: string, dados: PessoaUpdate & RemuneracaoFields): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()

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

    // Gestor só pode atualizar pessoas da sua hierarquia (fonte única)
    if (isGestor) {
      const permissaoService = new PermissaoService(supabase)
      const timeIdsHierarquia = await permissaoService.getTimesHierarquia(usuario)

      if (!pessoaAtual.time_id || !timeIdsHierarquia.includes(pessoaAtual.time_id)) {
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
      const pessoaService = new PessoaService(supabase)
      const remResult = await pessoaService.salvarRemuneracao(usuario, id, {
        salario_atual,
        data_ultimo_reajuste,
        motivo_ultimo_reajuste,
      })
      if (!remResult.success) {
        console.error('[updatePessoa] Remuneração não gravada:', remResult.error)
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
export async function softDeletePessoa(id: string): Promise<ActionResult<null>> {
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
