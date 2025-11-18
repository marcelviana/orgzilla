'use server'

/**
 * Server Actions - Níveis
 *
 * IMPORTANTE: Server Actions para gerenciar níveis
 * - Apenas ADMIN pode criar/editar/deletar
 * - Validação de sequência (nivel_anterior_id)
 * - Campos corretos: created_at, updated_at
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/middleware'
import { NivelRepository, CargoRepository } from '@/lib/repositories'
import type { NivelInsert, NivelUpdate } from '@/lib/types'
import { handleError } from '@/lib/errors/error-handler'

// =============================================================================
// TYPES
// =============================================================================

export interface NivelComEstatisticas {
  id: string
  nome: string
  nivel_anterior_id: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  // Estatísticas
  pessoas: number
  cargos: number
  cargosLista: string[]
  nivelAnterior: string | null
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
 * Busca todos os níveis com estatísticas
 */
export async function getNiveisComEstatisticas(): Promise<ActionResult<NivelComEstatisticas[]>> {
  try {
    const supabase = await createClient()
    const nivelRepo = new NivelRepository(supabase)
    const cargoRepo = new CargoRepository(supabase)

    // Busca todos os níveis ordenados
    const niveis = await nivelRepo.findAllOrdered()

    // Para cada nível, busca estatísticas
    const niveisComStats = await Promise.all(
      niveis.map(async (nivel) => {
        // Busca cargos deste nível
        const cargos = await cargoRepo.findByNivelId(nivel.id)

        // Conta pessoas (através dos cargos)
        let totalPessoas = 0
        const cargosNomes: string[] = []

        for (const cargo of cargos) {
          const countPessoas = await cargoRepo.countPessoas(cargo.id)
          totalPessoas += countPessoas
          cargosNomes.push(cargo.nome)
        }

        // Busca nome do nível anterior
        let nivelAnteriorNome: string | null = null
        if (nivel.nivel_anterior_id) {
          const nivelAnterior = await nivelRepo.findById(nivel.nivel_anterior_id)
          nivelAnteriorNome = nivelAnterior?.nome || null
        }

        return {
          id: nivel.id,
          nome: nivel.nome,
          nivel_anterior_id: nivel.nivel_anterior_id,
          ativo: nivel.ativo,
          created_at: nivel.created_at,
          updated_at: nivel.updated_at,
          pessoas: totalPessoas,
          cargos: cargos.length,
          cargosLista: cargosNomes,
          nivelAnterior: nivelAnteriorNome,
        }
      })
    )

    return {
      success: true,
      data: niveisComStats,
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
 * Busca um nível por ID
 */
export async function getNivelById(id: string): Promise<ActionResult<NivelComEstatisticas>> {
  try {
    const supabase = await createClient()
    const nivelRepo = new NivelRepository(supabase)
    const cargoRepo = new CargoRepository(supabase)

    const nivel = await nivelRepo.findById(id)

    if (!nivel) {
      return {
        success: false,
        error: 'Nível não encontrado',
      }
    }

    // Busca estatísticas
    const cargos = await cargoRepo.findByNivelId(nivel.id)
    let totalPessoas = 0
    const cargosNomes: string[] = []

    for (const cargo of cargos) {
      const countPessoas = await cargoRepo.countPessoas(cargo.id)
      totalPessoas += countPessoas
      cargosNomes.push(cargo.nome)
    }

    // Busca nome do nível anterior
    let nivelAnteriorNome: string | null = null
    if (nivel.nivel_anterior_id) {
      const nivelAnterior = await nivelRepo.findById(nivel.nivel_anterior_id)
      nivelAnteriorNome = nivelAnterior?.nome || null
    }

    return {
      success: true,
      data: {
        id: nivel.id,
        nome: nivel.nome,
        nivel_anterior_id: nivel.nivel_anterior_id,
        ativo: nivel.ativo,
        created_at: nivel.created_at,
        updated_at: nivel.updated_at,
        pessoas: totalPessoas,
        cargos: cargos.length,
        cargosLista: cargosNomes,
        nivelAnterior: nivelAnteriorNome,
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

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Cria novo nível
 *
 * VALIDAÇÕES:
 * - Apenas admin pode criar
 * - Nome único
 * - Não criar ciclos na hierarquia
 */
export async function createNivel(dados: NivelInsert): Promise<ActionResult<string>> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const nivelRepo = new NivelRepository(supabase)

    // Valida nome único
    const nivelExistente = await nivelRepo.findByNome(dados.nome)
    if (nivelExistente) {
      return {
        success: false,
        error: `Já existe um nível com o nome "${dados.nome}"`,
      }
    }

    // Valida ciclos na hierarquia
    if (dados.nivel_anterior_id) {
      const hasCiclo = await validarCiclosHierarquia(
        nivelRepo,
        dados.nivel_anterior_id,
        null
      )

      if (hasCiclo) {
        return {
          success: false,
          error: 'A sequência criaria um ciclo na hierarquia',
        }
      }
    }

    // Cria nível
    const novoNivel = await nivelRepo.create(dados)

    // Revalida a página
    revalidatePath('/configuracoes/niveis')

    return {
      success: true,
      data: novoNivel.id,
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
 * Atualiza nível existente
 *
 * VALIDAÇÕES:
 * - Apenas admin pode atualizar
 * - Nome não pode ser alterado
 * - Não criar ciclos ao alterar nivel_anterior_id
 */
export async function updateNivel(id: string, dados: NivelUpdate): Promise<ActionResult> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const nivelRepo = new NivelRepository(supabase)

    // Busca nível existente
    const nivelAtual = await nivelRepo.findById(id)
    if (!nivelAtual) {
      return {
        success: false,
        error: 'Nível não encontrado',
      }
    }

    // Valida ciclos se alterou nivel_anterior_id
    if (dados.nivel_anterior_id !== undefined && dados.nivel_anterior_id !== nivelAtual.nivel_anterior_id) {
      if (dados.nivel_anterior_id) {
        const hasCiclo = await validarCiclosHierarquia(
          nivelRepo,
          dados.nivel_anterior_id,
          id
        )

        if (hasCiclo) {
          return {
            success: false,
            error: 'A alteração criaria um ciclo na hierarquia',
          }
        }
      }
    }

    // Atualiza nível
    await nivelRepo.update(id, dados)

    // Revalida a página
    revalidatePath('/configuracoes/niveis')

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
 * Desativa nível (soft delete)
 *
 * VALIDAÇÕES:
 * - Apenas admin pode desativar
 * - Não pode desativar se tiver cargos ou pessoas
 */
export async function softDeleteNivel(id: string): Promise<ActionResult> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const nivelRepo = new NivelRepository(supabase)
    const cargoRepo = new CargoRepository(supabase)

    // Busca nível
    const nivel = await nivelRepo.findById(id)
    if (!nivel) {
      return {
        success: false,
        error: 'Nível não encontrado',
      }
    }

    // Verifica se tem cargos
    const cargos = await cargoRepo.findByNivelId(id)
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
          error: `Não é possível desativar. Este nível tem ${totalPessoas} pessoas em ${cargos.length} cargos.`,
        }
      }

      return {
        success: false,
        error: `Não é possível desativar. Este nível tem ${cargos.length} cargos cadastrados.`,
      }
    }

    // Desativa nível
    await nivelRepo.softDelete(id)

    // Revalida a página
    revalidatePath('/configuracoes/niveis')

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
 * Deleta nível permanentemente
 *
 * VALIDAÇÕES:
 * - Apenas admin pode deletar
 * - Não pode deletar se tiver cargos ou pessoas
 */
export async function deleteNivel(id: string): Promise<ActionResult> {
  try {
    // Verifica permissão (apenas admin)
    await requireAdmin()

    const supabase = await createClient()
    const nivelRepo = new NivelRepository(supabase)
    const cargoRepo = new CargoRepository(supabase)

    // Busca nível
    const nivel = await nivelRepo.findById(id)
    if (!nivel) {
      return {
        success: false,
        error: 'Nível não encontrado',
      }
    }

    // Verifica se tem cargos
    const cargos = await cargoRepo.findByNivelId(id)
    if (cargos.length > 0) {
      return {
        success: false,
        error: `Não é possível deletar. Este nível tem ${cargos.length} cargos cadastrados.`,
      }
    }

    // Deleta nível
    await nivelRepo.delete(id)

    // Revalida a página
    revalidatePath('/configuracoes/niveis')

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

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Valida se criar/alterar nivel_anterior_id criaria um ciclo
 *
 * @param nivelRepo Repositório de níveis
 * @param nivelAnteriorId ID do nível anterior a ser definido
 * @param nivelAtualId ID do nível sendo editado (null se criando novo)
 * @returns true se criaria ciclo, false se ok
 */
async function validarCiclosHierarquia(
  nivelRepo: NivelRepository,
  nivelAnteriorId: string,
  nivelAtualId: string | null
): Promise<boolean> {
  // Se está editando, verifica se o nivel_anterior_id aponta para ele mesmo
  if (nivelAtualId && nivelAnteriorId === nivelAtualId) {
    return true
  }

  // Percorre a cadeia de anteriores para detectar ciclo
  const visitados = new Set<string>()
  let atual = nivelAnteriorId

  while (atual) {
    // Se já visitou, é um ciclo
    if (visitados.has(atual)) {
      return true
    }

    // Se o anterior aponta para o nível atual, é um ciclo
    if (nivelAtualId && atual === nivelAtualId) {
      return true
    }

    visitados.add(atual)

    // Busca próximo na cadeia
    const nivelAnterior = await nivelRepo.findById(atual)
    if (!nivelAnterior || !nivelAnterior.nivel_anterior_id) {
      break
    }

    atual = nivelAnterior.nivel_anterior_id
  }

  return false
}
