'use server'

/**
 * Server Actions - Tags
 *
 * IMPORTANTE: Server Actions para gerenciar tags
 * - ADMIN e GESTOR podem criar/editar/deletar
 * - Validação de nome único
 * - Verifica se tem pessoas antes de deletar
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TagRepository, PessoaTagRepository } from '@/lib/repositories'
import { getUsuarioLogado } from '@/lib/middleware'
import type { TagInsert, TagUpdate } from '@/lib/types'
import { handleError } from '@/lib/errors/error-handler'

// =============================================================================
// TYPES
// =============================================================================

export interface TagComEstatisticas {
  id: string
  nome: string
  cor: string
  ativo: boolean
  created_at: string
  // Estatísticas
  pessoas: number
}

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Busca todas as tags com estatísticas
 */
export async function getTagsComEstatisticas(): Promise<ActionResult<TagComEstatisticas[]>> {
  try {
    const supabase = await createClient()
    const tagRepo = new TagRepository(supabase)

    // Busca todas as tags ordenadas por nome
    const tags = await tagRepo.findAll({ orderBy: 'nome' })

    // Para cada tag, busca contagem de pessoas
    const tagsComStats = await Promise.all(
      tags.map(async (tag) => {
        const totalPessoas = await tagRepo.countPessoas(tag.id)

        return {
          id: tag.id,
          nome: tag.nome,
          cor: tag.cor,
          ativo: tag.ativo,
          created_at: tag.created_at,
          pessoas: totalPessoas,
        }
      })
    )

    return {
      success: true,
      data: tagsComStats,
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
 * Busca uma tag por ID
 */
export async function getTagById(id: string): Promise<ActionResult<TagComEstatisticas>> {
  try {
    const supabase = await createClient()
    const tagRepo = new TagRepository(supabase)

    const tag = await tagRepo.findById(id)

    if (!tag) {
      return {
        success: false,
        error: 'Tag não encontrada',
      }
    }

    // Busca contagem de pessoas
    const totalPessoas = await tagRepo.countPessoas(tag.id)

    return {
      success: true,
      data: {
        id: tag.id,
        nome: tag.nome,
        cor: tag.cor,
        ativo: tag.ativo,
        created_at: tag.created_at,
        pessoas: totalPessoas,
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
 * Busca pessoas com uma tag específica
 */
export async function getPessoasComTag(tagId: string): Promise<ActionResult<Array<{ id: string; nome: string; email_corporativo: string | null }>>> {
  try {
    const supabase = await createClient()
    const pessoaTagRepo = new PessoaTagRepository(supabase)

    const pessoasTag = await pessoaTagRepo.findByTagIdWithPessoas(tagId)

    const pessoas = pessoasTag.map(pt => ({
      id: pt.pessoa?.id || '',
      nome: pt.pessoa?.nome || '',
      email_corporativo: pt.pessoa?.email_corporativo || null,
    }))

    return {
      success: true,
      data: pessoas,
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
 * Busca tags para seleção (dropdown)
 */
export async function getTagsParaFiltro(): Promise<ActionResult<Array<{ id: string; nome: string }>>> {
  try {
    const supabase = await createClient()
    const tagRepo = new TagRepository(supabase)

    const tags = await tagRepo.findAll({ orderBy: 'nome' })

    return {
      success: true,
      data: tags.map(t => ({ id: t.id, nome: t.nome })),
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
// MUTATIONS
// =============================================================================

/**
 * Verifica se usuário tem permissão para gerenciar tags
 * Admin e Gestor podem gerenciar
 */
async function checkPermission(): Promise<boolean> {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    return false
  }

  return usuario.tipo_perfil === 'admin' || usuario.tipo_perfil === 'gestor'
}

/**
 * Cria nova tag
 *
 * VALIDAÇÕES:
 * - Apenas admin e gestor podem criar
 * - Nome único
 */
export async function createTag(dados: TagInsert): Promise<ActionResult<string>> {
  try {
    // Verifica permissão (admin ou gestor)
    const hasPermission = await checkPermission()
    if (!hasPermission) {
      return {
        success: false,
        error: 'Você não tem permissão para criar tags',
      }
    }

    const supabase = await createClient()
    const tagRepo = new TagRepository(supabase)

    // Valida nome único
    const tagExistente = await tagRepo.findByNome(dados.nome)
    if (tagExistente) {
      return {
        success: false,
        error: `Já existe uma tag com o nome "${dados.nome}"`,
      }
    }

    // Cria tag
    const novaTag = await tagRepo.create(dados)

    // Revalida a página
    revalidatePath('/configuracoes/tags')

    return {
      success: true,
      data: novaTag.id,
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
 * Atualiza tag existente
 *
 * VALIDAÇÕES:
 * - Apenas admin e gestor podem atualizar
 * - Nome único (se alterado)
 */
export async function updateTag(id: string, dados: TagUpdate): Promise<ActionResult> {
  try {
    // Verifica permissão (admin ou gestor)
    const hasPermission = await checkPermission()
    if (!hasPermission) {
      return {
        success: false,
        error: 'Você não tem permissão para editar tags',
      }
    }

    const supabase = await createClient()
    const tagRepo = new TagRepository(supabase)

    // Busca tag existente
    const tagAtual = await tagRepo.findById(id)
    if (!tagAtual) {
      return {
        success: false,
        error: 'Tag não encontrada',
      }
    }

    // Valida nome único se alterou
    if (dados.nome && dados.nome !== tagAtual.nome) {
      const tagExistente = await tagRepo.findByNome(dados.nome)
      if (tagExistente) {
        return {
          success: false,
          error: `Já existe uma tag com o nome "${dados.nome}"`,
        }
      }
    }

    // Atualiza tag
    await tagRepo.update(id, dados)

    // Revalida a página
    revalidatePath('/configuracoes/tags')

    return {
      success: true,
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
 * Desativa tag (soft delete)
 *
 * VALIDAÇÕES:
 * - Apenas admin e gestor podem desativar
 * - Pode desativar mesmo com pessoas (apenas deixa inativo)
 */
export async function softDeleteTag(id: string): Promise<ActionResult> {
  try {
    // Verifica permissão (admin ou gestor)
    const hasPermission = await checkPermission()
    if (!hasPermission) {
      return {
        success: false,
        error: 'Você não tem permissão para desativar tags',
      }
    }

    const supabase = await createClient()
    const tagRepo = new TagRepository(supabase)

    // Busca tag
    const tag = await tagRepo.findById(id)
    if (!tag) {
      return {
        success: false,
        error: 'Tag não encontrada',
      }
    }

    // Desativa tag (não remove de pessoas, apenas fica inativo)
    await tagRepo.softDelete(id)

    // Revalida a página
    revalidatePath('/configuracoes/tags')

    return {
      success: true,
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
 * Deleta tag permanentemente
 *
 * VALIDAÇÕES:
 * - Apenas admin e gestor podem deletar
 * - Não pode deletar se tiver pessoas
 */
export async function deleteTag(id: string, removeFromPeople: boolean = false): Promise<ActionResult> {
  try {
    // Verifica permissão (admin ou gestor)
    const hasPermission = await checkPermission()
    if (!hasPermission) {
      return {
        success: false,
        error: 'Você não tem permissão para deletar tags',
      }
    }

    const supabase = await createClient()
    const tagRepo = new TagRepository(supabase)
    const pessoaTagRepo = new PessoaTagRepository(supabase)

    // Busca tag
    const tag = await tagRepo.findById(id)
    if (!tag) {
      return {
        success: false,
        error: 'Tag não encontrada',
      }
    }

    // Verifica se tem pessoas
    const totalPessoas = await tagRepo.countPessoas(id)

    if (totalPessoas > 0) {
      if (!removeFromPeople) {
        return {
          success: false,
          error: `Não é possível deletar. Esta tag está sendo usada por ${totalPessoas} pessoas. Deseja remover a tag de todas elas?`,
        }
      }

      // Remove tag de todas as pessoas
      const pessoasTag = await pessoaTagRepo.findByTagId(id)
      for (const pessoaTag of pessoasTag) {
        await pessoaTagRepo.delete(pessoaTag.id)
      }
    }

    // Deleta tag
    await tagRepo.delete(id)

    // Revalida a página
    revalidatePath('/configuracoes/tags')
    revalidatePath('/pessoas')

    return {
      success: true,
    }
  } catch (error) {
    const appError = handleError(error, 'database')
    return {
      success: false,
      error: appError.message,
    }
  }
}
