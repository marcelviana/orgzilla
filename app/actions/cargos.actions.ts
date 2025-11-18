'use server'

/**
 * Server Actions - Cargos
 *
 * IMPORTANTE: Server Actions para gerenciar cargos
 * - Apenas ADMIN pode criar/editar/deletar
 * - Um cargo = Trilha + Nível (combinação única)
 * - Validação de nome único
 * - Validação de combinação trilha+nível única
 * - Verifica se tem pessoas/vagas antes de deletar
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/middleware'
import { CargoRepository, TrilhaCarreiraRepository, NivelRepository } from '@/lib/repositories'
import type { CargoInsert, CargoUpdate } from '@/lib/types'
import { handleError } from '@/lib/errors/error-handler'

// =============================================================================
// TYPES
// =============================================================================

export interface CargoComEstatisticas {
  id: string
  nome: string
  trilha_id: string
  nivel_id: string
  ativo: boolean
  created_at: string
  updated_at: string
  // Relacionamentos
  trilha: {
    id: string
    nome: string
  } | null
  nivel: {
    id: string
    nome: string
  } | null
  // Estatísticas
  pessoas: number
  vagas: number
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
 * Busca todos os cargos com estatísticas
 */
export async function getCargosComEstatisticas(): Promise<ActionResult<CargoComEstatisticas[]>> {
  try {
    const supabase = await createClient()
    const cargoRepo = new CargoRepository(supabase)

    // Busca todos os cargos com relacionamentos
    const cargos = await cargoRepo.findAllWithRelationships()

    // Para cada cargo, busca estatísticas
    const cargosComStats = await Promise.all(
      cargos.map(async (cargo) => {
        const [pessoasCount, vagasCount] = await Promise.all([
          cargoRepo.countPessoas(cargo.id),
          cargoRepo.countVagas(cargo.id),
        ])

        return {
          id: cargo.id,
          nome: cargo.nome,
          trilha_id: cargo.trilha_id,
          nivel_id: cargo.nivel_id,
          ativo: cargo.ativo,
          created_at: cargo.created_at,
          updated_at: cargo.updated_at,
          trilha: cargo.trilha || null,
          nivel: cargo.nivel || null,
          pessoas: pessoasCount,
          vagas: vagasCount,
        }
      })
    )

    return {
      success: true,
      data: cargosComStats,
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
 * Busca um cargo por ID
 */
export async function getCargoById(id: string): Promise<ActionResult<CargoComEstatisticas>> {
  try {
    const supabase = await createClient()
    const cargoRepo = new CargoRepository(supabase)

    const cargo = await cargoRepo.findByIdWithRelationships(id)

    if (!cargo) {
      return {
        success: false,
        error: 'Cargo não encontrado',
      }
    }

    // Busca estatísticas
    const [pessoasCount, vagasCount] = await Promise.all([
      cargoRepo.countPessoas(cargo.id),
      cargoRepo.countVagas(cargo.id),
    ])

    return {
      success: true,
      data: {
        id: cargo.id,
        nome: cargo.nome,
        trilha_id: cargo.trilha_id,
        nivel_id: cargo.nivel_id,
        ativo: cargo.ativo,
        created_at: cargo.created_at,
        updated_at: cargo.updated_at,
        trilha: cargo.trilha || null,
        nivel: cargo.nivel || null,
        pessoas: pessoasCount,
        vagas: vagasCount,
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
 * Busca opções de trilhas para o formulário
 */
export async function getTrilhasParaFiltro(): Promise<ActionResult<Array<{ id: string; nome: string }>>> {
  try {
    const supabase = await createClient()
    const trilhaRepo = new TrilhaCarreiraRepository(supabase)

    const trilhas = await trilhaRepo.findAll({
      where: { ativo: true },
      orderBy: 'nome'
    })

    return {
      success: true,
      data: trilhas.map(t => ({ id: t.id, nome: t.nome })),
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
 * Busca opções de níveis para o formulário
 */
export async function getNiveisParaFiltro(): Promise<ActionResult<Array<{ id: string; nome: string }>>> {
  try {
    const supabase = await createClient()
    const nivelRepo = new NivelRepository(supabase)

    const niveis = await nivelRepo.findAllOrdered()

    return {
      success: true,
      data: niveis.map(n => ({ id: n.id, nome: n.nome })),
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
 * Cria novo cargo
 *
 * VALIDAÇÕES:
 * - Apenas admin pode criar
 * - Nome único
 * - Combinação trilha+nível única
 * - Trilha e nível devem existir e estar ativos
 */
export async function createCargo(dados: CargoInsert): Promise<ActionResult<string>> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const cargoRepo = new CargoRepository(supabase)
    const trilhaRepo = new TrilhaCarreiraRepository(supabase)
    const nivelRepo = new NivelRepository(supabase)

    // Valida nome único
    const nomeExistente = await cargoRepo.nomeExists(dados.nome)
    if (nomeExistente) {
      return {
        success: false,
        error: `Já existe um cargo com o nome "${dados.nome}"`,
      }
    }

    // Valida trilha
    const trilha = await trilhaRepo.findById(dados.trilha_id)
    if (!trilha) {
      return {
        success: false,
        error: 'Trilha não encontrada',
      }
    }
    if (!trilha.ativo) {
      return {
        success: false,
        error: 'A trilha selecionada está inativa',
      }
    }

    // Valida nível
    const nivel = await nivelRepo.findById(dados.nivel_id)
    if (!nivel) {
      return {
        success: false,
        error: 'Nível não encontrado',
      }
    }
    if (!nivel.ativo) {
      return {
        success: false,
        error: 'O nível selecionado está inativo',
      }
    }

    // Valida combinação trilha+nível única
    const combinacaoExiste = await cargoRepo.combinacaoExists(dados.trilha_id, dados.nivel_id)
    if (combinacaoExiste) {
      return {
        success: false,
        error: `Já existe um cargo com a combinação "${trilha.nome}" + "${nivel.nome}"`,
      }
    }

    // Cria cargo
    const novoCargo = await cargoRepo.create(dados)

    // Revalida as páginas
    revalidatePath('/configuracoes/cargos')
    revalidatePath('/pessoas')

    return {
      success: true,
      data: novoCargo.id,
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
 * Atualiza cargo existente
 *
 * VALIDAÇÕES:
 * - Apenas admin pode atualizar
 * - Nome único (se alterado)
 * - Combinação trilha+nível única (se alterada)
 * - Trilha e nível devem existir e estar ativos
 */
export async function updateCargo(id: string, dados: CargoUpdate): Promise<ActionResult> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const cargoRepo = new CargoRepository(supabase)
    const trilhaRepo = new TrilhaCarreiraRepository(supabase)
    const nivelRepo = new NivelRepository(supabase)

    // Busca cargo existente
    const cargoAtual = await cargoRepo.findById(id)
    if (!cargoAtual) {
      return {
        success: false,
        error: 'Cargo não encontrado',
      }
    }

    // Valida nome único se alterou
    if (dados.nome && dados.nome !== cargoAtual.nome) {
      const nomeExistente = await cargoRepo.nomeExists(dados.nome, id)
      if (nomeExistente) {
        return {
          success: false,
          error: `Já existe um cargo com o nome "${dados.nome}"`,
        }
      }
    }

    // Valida trilha se alterou
    if (dados.trilha_id && dados.trilha_id !== cargoAtual.trilha_id) {
      const trilha = await trilhaRepo.findById(dados.trilha_id)
      if (!trilha) {
        return {
          success: false,
          error: 'Trilha não encontrada',
        }
      }
      if (!trilha.ativo) {
        return {
          success: false,
          error: 'A trilha selecionada está inativa',
        }
      }
    }

    // Valida nível se alterou
    if (dados.nivel_id && dados.nivel_id !== cargoAtual.nivel_id) {
      const nivel = await nivelRepo.findById(dados.nivel_id)
      if (!nivel) {
        return {
          success: false,
          error: 'Nível não encontrado',
        }
      }
      if (!nivel.ativo) {
        return {
          success: false,
          error: 'O nível selecionado está inativo',
        }
      }
    }

    // Valida combinação trilha+nível se alterou algum dos dois
    const trilhaId = dados.trilha_id || cargoAtual.trilha_id
    const nivelId = dados.nivel_id || cargoAtual.nivel_id

    if (
      (dados.trilha_id && dados.trilha_id !== cargoAtual.trilha_id) ||
      (dados.nivel_id && dados.nivel_id !== cargoAtual.nivel_id)
    ) {
      const combinacaoExiste = await cargoRepo.combinacaoExists(trilhaId, nivelId, id)
      if (combinacaoExiste) {
        const trilha = await trilhaRepo.findById(trilhaId)
        const nivel = await nivelRepo.findById(nivelId)
        return {
          success: false,
          error: `Já existe um cargo com a combinação "${trilha?.nome}" + "${nivel?.nome}"`,
        }
      }
    }

    // Atualiza cargo
    await cargoRepo.update(id, dados)

    // Revalida as páginas
    revalidatePath('/configuracoes/cargos')
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

/**
 * Desativa cargo (soft delete)
 *
 * VALIDAÇÕES:
 * - Apenas admin pode desativar
 * - Não pode desativar se tiver pessoas ou vagas ativas
 */
export async function softDeleteCargo(id: string): Promise<ActionResult> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const cargoRepo = new CargoRepository(supabase)

    // Busca cargo
    const cargo = await cargoRepo.findById(id)
    if (!cargo) {
      return {
        success: false,
        error: 'Cargo não encontrado',
      }
    }

    // Verifica se tem pessoas
    const pessoasCount = await cargoRepo.countPessoas(id)
    if (pessoasCount > 0) {
      return {
        success: false,
        error: `Não é possível desativar. Este cargo tem ${pessoasCount} pessoas.`,
      }
    }

    // Verifica se tem vagas
    const vagasCount = await cargoRepo.countVagas(id)
    if (vagasCount > 0) {
      return {
        success: false,
        error: `Não é possível desativar. Este cargo tem ${vagasCount} vagas abertas.`,
      }
    }

    // Desativa cargo
    await cargoRepo.softDelete(id)

    // Revalida as páginas
    revalidatePath('/configuracoes/cargos')
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

/**
 * Deleta cargo permanentemente
 *
 * VALIDAÇÕES:
 * - Apenas admin pode deletar
 * - Não pode deletar se tiver pessoas ou vagas
 */
export async function deleteCargo(id: string): Promise<ActionResult> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const cargoRepo = new CargoRepository(supabase)

    // Busca cargo
    const cargo = await cargoRepo.findById(id)
    if (!cargo) {
      return {
        success: false,
        error: 'Cargo não encontrado',
      }
    }

    // Verifica se pode deletar
    const canDelete = await cargoRepo.canDelete(id)
    if (!canDelete) {
      const pessoasCount = await cargoRepo.countPessoas(id)
      const vagasCount = await cargoRepo.countVagas(id)

      if (pessoasCount > 0 && vagasCount > 0) {
        return {
          success: false,
          error: `Não é possível deletar. Este cargo tem ${pessoasCount} pessoas e ${vagasCount} vagas.`,
        }
      } else if (pessoasCount > 0) {
        return {
          success: false,
          error: `Não é possível deletar. Este cargo tem ${pessoasCount} pessoas.`,
        }
      } else {
        return {
          success: false,
          error: `Não é possível deletar. Este cargo tem ${vagasCount} vagas.`,
        }
      }
    }

    // Deleta cargo
    await cargoRepo.delete(id)

    // Revalida as páginas
    revalidatePath('/configuracoes/cargos')
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
