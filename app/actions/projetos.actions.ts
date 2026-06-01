'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'
import { handleError } from '@/lib/errors/error-handler'
import { ProjetoProdutoRepository } from '@/lib/repositories'

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

export type ProjetoListItem = {
  id: string
  nome: string
  ativo: boolean
  created_at: string
  total_pessoas: number
  pessoas_ativas: number
}

export type ProjetoDetail = {
  id: string
  nome: string
  ativo: boolean
  created_at: string
  updated_at: string
  alocacoes: Array<{
    id: string
    pessoa: {
      id: string
      nome: string
      cargo?: { nome: string }
      time?: { nome: string }
    }
    data_inicio: string
    data_fim: string | null
    ativo: boolean
  }>
}

export type ProjetoInsert = {
  nome: string
  ativo: boolean
}

export type ProjetoUpdate = {
  nome?: string
  ativo?: boolean
}

export type AlocacaoInsert = {
  pessoa_id: string
  projeto_produto_id: string
  data_inicio: string
  data_fim?: string | null
  ativo: boolean
}

/**
 * Lista todos os projetos
 */
export async function getProjetos(): Promise<ActionResult<ProjetoListItem[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Get projetos
    const { data: projetos, error: projetosError } = await supabase
      .from('projeto_produto')
      .select('id, nome, ativo, created_at')
      .order('created_at', { ascending: false })

    if (projetosError) throw projetosError

    // For each projeto, count pessoas
    const projetosComContagem = await Promise.all(
      (projetos || []).map(async (projeto) => {
        const { count: totalPessoas } = await supabase
          .from('pessoa_projeto_produto')
          .select('*', { count: 'exact', head: true })
          .eq('projeto_produto_id', projeto.id)

        const { count: pessoasAtivas } = await supabase
          .from('pessoa_projeto_produto')
          .select('*', { count: 'exact', head: true })
          .eq('projeto_produto_id', projeto.id)
          .eq('ativo', true)
          .is('data_fim', null)

        return {
          ...projeto,
          total_pessoas: totalPessoas || 0,
          pessoas_ativas: pessoasAtivas || 0,
        }
      })
    )

    return {
      success: true,
      data: projetosComContagem,
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
 * Busca projeto por ID com alocações
 */
export async function getProjetoById(id: string): Promise<ActionResult<ProjetoDetail>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const { data: projeto, error: projetoError } = await supabase
      .from('projeto_produto')
      .select(`
        id,
        nome,
        ativo,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single()

    if (projetoError) {
      if (projetoError.code === 'PGRST116') {
        return { success: false, error: 'Projeto não encontrado' }
      }
      throw projetoError
    }

    // Get alocações with pessoa details
    const { data: alocacoes, error: alocacoesError } = await supabase
      .from('pessoa_projeto_produto')
      .select(`
        id,
        data_inicio,
        data_fim,
        ativo,
        pessoa:pessoa!pessoa_id(
          id,
          nome,
          cargo:cargo!cargo_id(nome),
          time:time!time_id(nome)
        )
      `)
      .eq('projeto_produto_id', id)
      .order('data_inicio', { ascending: false })

    if (alocacoesError) throw alocacoesError

    return {
      success: true,
      data: {
        ...projeto,
        alocacoes: alocacoes || [],
      } as ProjetoDetail,
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
 * Cria novo projeto
 */
export async function createProjeto(dados: ProjetoInsert): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Apenas Admin e Gestor podem criar projetos
    if (usuario.tipo_perfil === 'visualizador') {
      return { success: false, error: 'Sem permissão para criar projetos' }
    }

    // Validar nome único
    const { data: existente } = await supabase
      .from('projeto_produto')
      .select('id')
      .eq('nome', dados.nome)
      .maybeSingle()

    if (existente) {
      return { success: false, error: 'Já existe um projeto com este nome' }
    }

    // Criar projeto
    const { data: projeto, error } = await supabase
      .from('projeto_produto')
      .insert(dados)
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/projetos')
    return { success: true, data: projeto.id }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Atualiza projeto
 */
export async function updateProjeto(id: string, dados: ProjetoUpdate): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Apenas Admin e Gestor podem editar projetos
    if (usuario.tipo_perfil === 'visualizador') {
      return { success: false, error: 'Sem permissão para editar projetos' }
    }

    // Se alterando nome, validar unicidade
    if (dados.nome) {
      const { data: existente } = await supabase
        .from('projeto_produto')
        .select('id')
        .eq('nome', dados.nome)
        .neq('id', id)
        .maybeSingle()

      if (existente) {
        return { success: false, error: 'Já existe um projeto com este nome' }
      }
    }

    const { error } = await supabase
      .from('projeto_produto')
      .update(dados)
      .eq('id', id)

    if (error) throw error

    revalidatePath('/projetos')
    revalidatePath(`/projetos/${id}`)
    return { success: true }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Soft delete de projeto
 */
export async function softDeleteProjeto(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Apenas Admin e Gestor podem deletar projetos
    if (usuario.tipo_perfil === 'visualizador') {
      return { success: false, error: 'Sem permissão para deletar projetos' }
    }

    const { error } = await supabase
      .from('projeto_produto')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/projetos')
    return { success: true }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Adiciona pessoa ao projeto (cria alocação)
 */
export async function addPessoaAoProjeto(dados: AlocacaoInsert): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Apenas Admin e Gestor podem alocar pessoas
    if (usuario.tipo_perfil === 'visualizador') {
      return { success: false, error: 'Sem permissão para alocar pessoas' }
    }

    // Verificar se pessoa já está alocada no projeto (ativa)
    const { data: existente } = await supabase
      .from('pessoa_projeto_produto')
      .select('id')
      .eq('pessoa_id', dados.pessoa_id)
      .eq('projeto_produto_id', dados.projeto_produto_id)
      .eq('ativo', true)
      .is('data_fim', null)
      .maybeSingle()

    if (existente) {
      return { success: false, error: 'Pessoa já está alocada neste projeto' }
    }

    const { data: alocacao, error } = await supabase
      .from('pessoa_projeto_produto')
      .insert(dados)
      .select('id')
      .single()

    if (error) throw error

    revalidatePath(`/projetos/${dados.projeto_produto_id}`)
    revalidatePath(`/pessoas/${dados.pessoa_id}`)
    return { success: true, data: alocacao.id }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Remove pessoa do projeto (finaliza alocação)
 */
export async function removePessoaDoProjeto(
  alocacaoId: string,
  dataFim: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const usuario = await getCurrentUser()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Apenas Admin e Gestor podem desalocar pessoas
    if (usuario.tipo_perfil === 'visualizador') {
      return { success: false, error: 'Sem permissão para desalocar pessoas' }
    }

    const { error } = await supabase
      .from('pessoa_projeto_produto')
      .update({
        data_fim: dataFim,
        ativo: false,
      })
      .eq('id', alocacaoId)

    if (error) throw error

    // Get alocacao to revalidate paths
    const { data: alocacao } = await supabase
      .from('pessoa_projeto_produto')
      .select('projeto_produto_id, pessoa_id')
      .eq('id', alocacaoId)
      .single()

    if (alocacao) {
      revalidatePath(`/projetos/${alocacao.projeto_produto_id}`)
      revalidatePath(`/pessoas/${alocacao.pessoa_id}`)
    }

    return { success: true }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}

/**
 * Busca projetos para seleção (dropdown)
 */
export async function getProjetosParaFiltro(): Promise<ActionResult<Array<{ id: string; nome: string }>>> {
  try {
    const supabase = await createClient()
    const projetoRepo = new ProjetoProdutoRepository(supabase)

    const projetos = await projetoRepo.findAll()

    return {
      success: true,
      data: projetos
        .filter(p => p.ativo)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .map(p => ({ id: p.id, nome: p.nome })),
    }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}
