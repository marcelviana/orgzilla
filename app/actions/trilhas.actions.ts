'use server'

/**
 * Server Actions - Trilhas de Carreira
 *
 * IMPORTANTE: Server Actions para gerenciar trilhas de carreira
 * - Apenas ADMIN pode criar/editar/deletar
 * - Validação de nome único
 * - Verifica se tem cargos antes de deletar
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, getUsuarioLogado } from '@/lib/middleware'
import { TrilhaCarreiraRepository, CargoRepository } from '@/lib/repositories'
import { PessoaService } from '@/lib/services/pessoa.service'
import { CargoService } from '@/lib/services/cargo.service'
import type { TrilhaCarreiraInsert, TrilhaCarreiraUpdate } from '@/lib/types'
import { handleError } from '@/lib/errors/error-handler'

// =============================================================================
// TYPES
// =============================================================================

export interface TrilhaComEstatisticas {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  // Estatísticas
  cargos: number
  pessoas: number
  cargosLista: string[]
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
 * Busca todas as trilhas com estatísticas
 */
export async function getTrilhasComEstatisticas(): Promise<ActionResult<TrilhaComEstatisticas[]>> {
  try {
    const supabase = await createClient()
    const trilhaRepo = new TrilhaCarreiraRepository(supabase)
    const cargoRepo = new CargoRepository(supabase)

    // Busca todas as trilhas ordenadas por nome
    const trilhas = await trilhaRepo.findAll({ orderBy: 'nome' })

    // Para cada trilha, busca estatísticas
    const trilhasComStats = await Promise.all(
      trilhas.map(async (trilha) => {
        // Busca cargos desta trilha
        const cargos = await cargoRepo.findByTrilhaId(trilha.id)

        // Conta pessoas (através dos cargos)
        let totalPessoas = 0
        const cargosNomes: string[] = []

        for (const cargo of cargos) {
          const countPessoas = await cargoRepo.countPessoas(cargo.id)
          totalPessoas += countPessoas
          cargosNomes.push(cargo.nome)
        }

        return {
          id: trilha.id,
          nome: trilha.nome,
          descricao: trilha.descricao,
          ativo: trilha.ativo,
          created_at: trilha.created_at,
          updated_at: trilha.updated_at,
          cargos: cargos.length,
          pessoas: totalPessoas,
          cargosLista: cargosNomes,
        }
      })
    )

    return {
      success: true,
      data: trilhasComStats,
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
 * Busca uma trilha por ID
 */
export async function getTrilhaById(id: string): Promise<ActionResult<TrilhaComEstatisticas>> {
  try {
    const supabase = await createClient()
    const trilhaRepo = new TrilhaCarreiraRepository(supabase)
    const cargoRepo = new CargoRepository(supabase)

    const trilha = await trilhaRepo.findById(id)

    if (!trilha) {
      return {
        success: false,
        error: 'Trilha não encontrada',
      }
    }

    // Busca estatísticas
    const cargos = await cargoRepo.findByTrilhaId(trilha.id)
    let totalPessoas = 0
    const cargosNomes: string[] = []

    for (const cargo of cargos) {
      const countPessoas = await cargoRepo.countPessoas(cargo.id)
      totalPessoas += countPessoas
      cargosNomes.push(cargo.nome)
    }

    return {
      success: true,
      data: {
        id: trilha.id,
        nome: trilha.nome,
        descricao: trilha.descricao,
        ativo: trilha.ativo,
        created_at: trilha.created_at,
        updated_at: trilha.updated_at,
        cargos: cargos.length,
        pessoas: totalPessoas,
        cargosLista: cargosNomes,
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

export type { CargoNaTrilha } from '@/lib/services/cargo.service'

export interface PessoaNaTrilha {
  id: string
  nome: string
  foto_url: string | null
  cargo_nome: string | null
  nivel_nome: string | null
  time_nome: string | null
}

/**
 * Busca cargos ativos de uma trilha com nome do nível e contagem de pessoas.
 */
export async function getCargosNaTrilha(trilhaId: string): Promise<ActionResult<import('@/lib/services/cargo.service').CargoNaTrilha[]>> {
  try {
    const usuario = await getUsuarioLogado()
    if (!usuario) return { success: false, error: 'Usuário não autenticado' }

    const supabase = await createClient()
    const cargoService = new CargoService(supabase)
    const cargos = await cargoService.buscarCargosNaTrilha(trilhaId)
    return { success: true, data: cargos }
  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError.message }
  }
}

/**
 * Busca pessoas em cargos de uma trilha.
 * Gestor vê apenas pessoas da sua hierarquia; admin/visualizador vêem todas.
 */
export async function getPessoasNaTrilha(trilhaId: string): Promise<ActionResult<PessoaNaTrilha[]>> {
  try {
    const supabase = await createClient()
    const pessoaService = new PessoaService(supabase)

    const usuario = await getUsuarioLogado()
    if (!usuario) return { success: false, error: 'Usuário não autenticado' }

    const pessoas = await pessoaService.buscarPorTrilha(trilhaId, usuario)
    return { success: true, data: pessoas }
  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError.message }
  }
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Cria nova trilha de carreira
 *
 * VALIDAÇÕES:
 * - Apenas admin pode criar
 * - Nome único
 */
export async function createTrilha(dados: TrilhaCarreiraInsert): Promise<ActionResult<string>> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const trilhaRepo = new TrilhaCarreiraRepository(supabase)

    // Valida nome único
    const trilhaExistente = await trilhaRepo.findByNome(dados.nome)
    if (trilhaExistente) {
      return {
        success: false,
        error: `Já existe uma trilha com o nome "${dados.nome}"`,
      }
    }

    // Cria trilha
    const novaTrilha = await trilhaRepo.create(dados)

    // Revalida a página
    revalidatePath('/configuracoes/trilhas')

    return {
      success: true,
      data: novaTrilha.id,
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
 * Atualiza trilha existente
 *
 * VALIDAÇÕES:
 * - Apenas admin pode atualizar
 * - Nome único (se alterado)
 */
export async function updateTrilha(id: string, dados: TrilhaCarreiraUpdate): Promise<ActionResult> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const trilhaRepo = new TrilhaCarreiraRepository(supabase)

    // Busca trilha existente
    const trilhaAtual = await trilhaRepo.findById(id)
    if (!trilhaAtual) {
      return {
        success: false,
        error: 'Trilha não encontrada',
      }
    }

    // Valida nome único se alterou
    if (dados.nome && dados.nome !== trilhaAtual.nome) {
      const trilhaExistente = await trilhaRepo.findByNome(dados.nome)
      if (trilhaExistente) {
        return {
          success: false,
          error: `Já existe uma trilha com o nome "${dados.nome}"`,
        }
      }
    }

    // Atualiza trilha
    await trilhaRepo.update(id, dados)

    // Revalida a página
    revalidatePath('/configuracoes/trilhas')

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
 * Desativa trilha (soft delete)
 *
 * VALIDAÇÕES:
 * - Apenas admin pode desativar
 * - Não pode desativar se tiver cargos ou pessoas
 */
export async function softDeleteTrilha(id: string): Promise<ActionResult> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const trilhaRepo = new TrilhaCarreiraRepository(supabase)
    const cargoRepo = new CargoRepository(supabase)

    // Busca trilha
    const trilha = await trilhaRepo.findById(id)
    if (!trilha) {
      return {
        success: false,
        error: 'Trilha não encontrada',
      }
    }

    // Verifica se tem cargos
    const cargos = await cargoRepo.findByTrilhaId(id)
    if (cargos.length > 0) {
      // Verifica se algum cargo tem pessoas
      let totalPessoas = 0
      for (const cargo of cargos) {
        const count = await cargoRepo.countPessoas(cargo.id)
        totalPessoas += count
      }

      if (totalPessoas > 0) {
        return {
          success: false,
          error: `Não é possível desativar. Esta trilha tem ${totalPessoas} pessoas em ${cargos.length} cargos.`,
        }
      }

      return {
        success: false,
        error: `Não é possível desativar. Esta trilha tem ${cargos.length} cargos cadastrados.`,
      }
    }

    // Desativa trilha
    await trilhaRepo.softDelete(id)

    // Revalida a página
    revalidatePath('/configuracoes/trilhas')

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
 * Deleta trilha permanentemente
 *
 * VALIDAÇÕES:
 * - Apenas admin pode deletar
 * - Não pode deletar se tiver cargos
 */
export async function deleteTrilha(id: string): Promise<ActionResult> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const trilhaRepo = new TrilhaCarreiraRepository(supabase)
    const cargoRepo = new CargoRepository(supabase)

    // Busca trilha
    const trilha = await trilhaRepo.findById(id)
    if (!trilha) {
      return {
        success: false,
        error: 'Trilha não encontrada',
      }
    }

    // Verifica se tem cargos
    const cargos = await cargoRepo.findByTrilhaId(id)
    if (cargos.length > 0) {
      return {
        success: false,
        error: `Não é possível deletar. Esta trilha tem ${cargos.length} cargos cadastrados.`,
      }
    }

    // Deleta trilha
    await trilhaRepo.delete(id)

    // Revalida a página
    revalidatePath('/configuracoes/trilhas')

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
