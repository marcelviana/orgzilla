'use server'

/**
 * Server Actions - Times
 *
 * IMPORTANTE: Server Actions para gerenciar times
 * - ADMIN pode criar/editar/deletar todos os times
 * - GESTOR pode criar/editar times da sua hierarquia
 * - Prevenção de ciclos na hierarquia (time_pai)
 * - Busca recursiva de hierarquia
 * - Validação de gestor (pessoa deve existir e estar no time)
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioLogado } from '@/lib/middleware'
import { PermissaoService } from '@/lib/services'
import { TimeRepository, PessoaRepository, UsuarioRepository } from '@/lib/repositories'
import type { Time, TimeInsert, TimeUpdate } from '@/lib/types'
import { handleError } from '@/lib/errors/error-handler'

// =============================================================================
// TYPES
// =============================================================================

export interface TimeComEstatisticas {
  id: string
  nome: string
  descricao: string | null
  time_pai_id: string | null
  gestor_id: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  // Relacionamentos
  time_pai: {
    id: string
    nome: string
  } | null
  gestor: {
    id: string
    nome: string
    email_corporativo: string | null
  } | null
  // Estatísticas
  membros: number
  vagas: number
  times_filhos: number
}

export interface TimeHierarquico extends TimeComEstatisticas {
  filhos: TimeHierarquico[]
}

export interface TimeDetalhe {
  id: string
  nome: string
  descricao: string | null
  time_pai_id: string | null
  gestor_id: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  time_pai: {
    id: string
    nome: string
  } | null
  gestor: {
    id: string
    nome: string
    email_corporativo: string | null
  } | null
  membros: Array<{
    id: string
    nome: string
    cargo?: {
      nome: string
    } | null
  }>
  vagas: number
  times_filhos: number
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
 * Busca todos os times com estatísticas
 */
export async function getTimesComEstatisticas(): Promise<ActionResult<TimeComEstatisticas[]>> {
  try {
    const supabase = await createClient()
    const timeRepo = new TimeRepository(supabase)
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Admin e Visualizador veem todos os times
    // Gestor vê apenas sua hierarquia
    let times: Time[] = []

    if (usuario.tipo_perfil === 'gestor') {
      // Hierarquia do gestor (times que ele gerencia + descendentes) — fonte única
      const permissaoService = new PermissaoService(supabase)
      const hierarquiaIds = await permissaoService.getTimesHierarquia(usuario)

      // Buscar times da hierarquia
      const allTimes = await timeRepo.findAll()
      times = allTimes.filter(t => hierarquiaIds.includes(t.id))
    } else {
      times = await timeRepo.findAll()
    }

    // Para cada time, busca estatísticas
    const timesComStats = await Promise.all(
      times.map(async (time) => {
        const [membrosCount, vagasCount, filhosCount, timeComRelacionamentos] = await Promise.all([
          timeRepo.countMembros(time.id),
          timeRepo.countVagas(time.id),
          timeRepo.countFilhos(time.id),
          timeRepo.findByIdWithBasicRelationships(time.id),
        ])

        return {
          id: time.id,
          nome: time.nome,
          descricao: time.descricao,
          time_pai_id: time.time_pai_id,
          gestor_id: time.gestor_id,
          ativo: time.ativo,
          created_at: time.created_at,
          updated_at: time.updated_at,
          time_pai: timeComRelacionamentos?.time_pai || null,
          gestor: timeComRelacionamentos?.gestor || null,
          membros: membrosCount,
          vagas: vagasCount,
          times_filhos: filhosCount,
        }
      })
    )

    return {
      success: true,
      data: timesComStats,
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
 * Busca um time por ID com estatísticas
 */
export async function getTimeById(id: string): Promise<ActionResult<TimeDetalhe>> {
  try {
    const supabase = await createClient()
    const timeRepo = new TimeRepository(supabase)

    const time = await timeRepo.findByIdWithRelationships(id)

    if (!time) {
      return {
        success: false,
        error: 'Time não encontrado',
      }
    }

    // Busca estatísticas
    const [, vagasCount, filhosCount] = await Promise.all([
      timeRepo.countMembros(time.id),
      timeRepo.countVagas(time.id),
      timeRepo.countFilhos(time.id),
    ])

    const membros = (time.membros || []) as Array<{
      id: string
      nome: string
      ativo: boolean
      cargo?: {
        nome: string
      } | null
    }>

    return {
      success: true,
      data: {
        id: time.id,
        nome: time.nome,
        descricao: time.descricao,
        time_pai_id: time.time_pai_id,
        gestor_id: time.gestor_id,
        ativo: time.ativo,
        created_at: time.created_at,
        updated_at: time.updated_at,
        time_pai: time.time_pai || null,
        gestor: time.gestor || null,
        membros: membros
          .filter((membro) => membro.ativo)
          .map((membro) => ({
            id: membro.id,
            nome: membro.nome,
            cargo: membro.cargo ? { nome: membro.cargo.nome } : null,
          })),
        vagas: vagasCount,
        times_filhos: filhosCount,
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
 * Busca hierarquia completa de times (recursivo)
 * Retorna árvore com todos os times raiz e seus filhos
 */
export async function getTimesHierarquia(): Promise<ActionResult<TimeHierarquico[]>> {
  try {
    const supabase = await createClient()
    const timeRepo = new TimeRepository(supabase)

    // Busca times raiz (sem time_pai)
    const timesRaiz = await timeRepo.findRootTeams()

    // Para cada time raiz, busca hierarquia recursivamente
    const hierarquias = await Promise.all(
      timesRaiz.map(async (time) => {
        return await buildTimeHierarchy(time.id, timeRepo)
      })
    )

    return {
      success: true,
      data: hierarquias.filter(Boolean) as TimeHierarquico[],
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
 * Busca opções de times para o formulário (para seleção de time pai)
 */
export async function getTimesParaFiltro(): Promise<ActionResult<Array<{ id: string; nome: string }>>> {
  try {
    const supabase = await createClient()
    const timeRepo = new TimeRepository(supabase)

    const times = await timeRepo.findAll({
      where: { ativo: true },
      orderBy: 'nome'
    })

    return {
      success: true,
      data: times.map(t => ({ id: t.id, nome: t.nome })),
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
 * Busca opções de gestores (pessoas que podem ser gestores)
 */
export async function getGestoresParaFiltro(): Promise<ActionResult<Array<{ id: string; nome: string }>>> {
  try {
    const supabase = await createClient()
    const usuarioRepo = new UsuarioRepository(supabase)

    // Buscar usuários com perfil gestor ou admin
    const gestoresAdmin = await usuarioRepo.findByTipoPerfil('admin')
    const gestores = await usuarioRepo.findByTipoPerfil('gestor')

    const todosGestores = [...gestoresAdmin, ...gestores]
      .filter(u => u.ativo && u.pessoa_id) // Apenas ativos com pessoa vinculada
      .map(u => ({
        id: u.pessoa_id!,
        nome: u.nome,
      }))

    return {
      success: true,
      data: todosGestores,
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
 * Cria novo time
 *
 * VALIDAÇÕES:
 * - Admin pode criar qualquer time
 * - Gestor pode criar times dentro da sua hierarquia
 * - Nome não pode estar vazio
 * - Não pode criar ciclos (time_pai não pode ser descendente)
 * - Gestor (se informado) deve existir
 */
export async function createTime(dados: TimeInsert): Promise<ActionResult<string>> {
  try {
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Verificar permissão
    const isAdmin = usuario.tipo_perfil === 'admin'
    const isGestor = usuario.tipo_perfil === 'gestor'

    if (!isAdmin && !isGestor) {
      return {
        success: false,
        error: 'Você não tem permissão para criar times',
      }
    }

    const supabase = await createClient()
    const timeRepo = new TimeRepository(supabase)
    const pessoaRepo = new PessoaRepository(supabase)

    // Valida gestor se informado
    if (dados.gestor_id) {
      const gestor = await pessoaRepo.findById(dados.gestor_id)
      if (!gestor) {
        return {
          success: false,
          error: 'Gestor não encontrado',
        }
      }
      if (!gestor.ativo) {
        return {
          success: false,
          error: 'O gestor selecionado está inativo',
        }
      }
    }

    // Valida time_pai se informado (prevenir ciclos)
    if (dados.time_pai_id) {
      const timePai = await timeRepo.findById(dados.time_pai_id)
      if (!timePai) {
        return {
          success: false,
          error: 'Time pai não encontrado',
        }
      }
      if (!timePai.ativo) {
        return {
          success: false,
          error: 'O time pai está inativo',
        }
      }

      // Gestor só pode criar times dentro da sua hierarquia (fonte única)
      if (isGestor && !isAdmin) {
        const permissaoService = new PermissaoService(supabase)
        const hierarquiaIds = await permissaoService.getTimesHierarquia(usuario)
        if (!hierarquiaIds.includes(dados.time_pai_id)) {
          return {
            success: false,
            error: 'Você só pode criar times dentro da sua hierarquia',
          }
        }
      }
    }

    // Cria time
    const novoTime = await timeRepo.create(dados)

    // Revalida as páginas
    revalidatePath('/times')
    revalidatePath('/organograma')

    return {
      success: true,
      data: novoTime.id,
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
 * Atualiza time existente
 *
 * VALIDAÇÕES:
 * - Admin pode editar qualquer time
 * - Gestor pode editar times da sua hierarquia
 * - Não pode criar ciclos (time_pai não pode ser descendente do time atual)
 * - Gestor (se informado) deve existir
 */
export async function updateTime(id: string, dados: TimeUpdate): Promise<ActionResult> {
  try {
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const isAdmin = usuario.tipo_perfil === 'admin'
    const isGestor = usuario.tipo_perfil === 'gestor'

    if (!isAdmin && !isGestor) {
      return {
        success: false,
        error: 'Você não tem permissão para editar times',
      }
    }

    const supabase = await createClient()
    const timeRepo = new TimeRepository(supabase)
    const pessoaRepo = new PessoaRepository(supabase)

    // Busca time existente
    const timeAtual = await timeRepo.findById(id)
    if (!timeAtual) {
      return {
        success: false,
        error: 'Time não encontrado',
      }
    }

    // Gestor só pode editar times da sua hierarquia (fonte única)
    if (isGestor && !isAdmin) {
      const permissaoService = new PermissaoService(supabase)
      const hierarquiaIds = await permissaoService.getTimesHierarquia(usuario)
      if (!hierarquiaIds.includes(id)) {
        return {
          success: false,
          error: 'Você só pode editar times da sua hierarquia',
        }
      }
    }

    // Valida gestor se alterou
    if (dados.gestor_id !== undefined && dados.gestor_id !== timeAtual.gestor_id) {
      if (dados.gestor_id) {
        const gestor = await pessoaRepo.findById(dados.gestor_id)
        if (!gestor) {
          return {
            success: false,
            error: 'Gestor não encontrado',
          }
        }
        if (!gestor.ativo) {
          return {
            success: false,
            error: 'O gestor selecionado está inativo',
          }
        }
      }
    }

    // Valida time_pai se alterou (prevenir ciclos)
    if (dados.time_pai_id !== undefined && dados.time_pai_id !== timeAtual.time_pai_id) {
      if (dados.time_pai_id) {
        // Verificar se o time_pai não é o próprio time
        if (dados.time_pai_id === id) {
          return {
            success: false,
            error: 'Um time não pode ser pai dele mesmo',
          }
        }

        // Verificar se o time_pai não é descendente do time atual (prevenir ciclos).
        // Reutiliza a fonte única de recursão (subárvore incl. o próprio time).
        const permissaoService = new PermissaoService(supabase)
        const hierarquiaAtualIds = await permissaoService.getHierarquiaCompleta(id)
        if (hierarquiaAtualIds.includes(dados.time_pai_id)) {
          return {
            success: false,
            error: 'Não é possível definir um time filho como time pai (ciclo detectado)',
          }
        }

        const timePai = await timeRepo.findById(dados.time_pai_id)
        if (!timePai) {
          return {
            success: false,
            error: 'Time pai não encontrado',
          }
        }
      }
    }

    // Atualiza time
    await timeRepo.update(id, dados)

    // Revalida as páginas
    revalidatePath('/times')
    revalidatePath('/organograma')

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
 * Desativa time (soft delete)
 *
 * VALIDAÇÕES:
 * - Admin pode desativar qualquer time
 * - Gestor pode desativar times da sua hierarquia
 * - Não pode desativar se tiver membros ativos ou times filhos
 */
export async function softDeleteTime(id: string): Promise<ActionResult> {
  try {
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const isAdmin = usuario.tipo_perfil === 'admin'
    const isGestor = usuario.tipo_perfil === 'gestor'

    if (!isAdmin && !isGestor) {
      return {
        success: false,
        error: 'Você não tem permissão para desativar times',
      }
    }

    const supabase = await createClient()
    const timeRepo = new TimeRepository(supabase)

    // Busca time
    const time = await timeRepo.findById(id)
    if (!time) {
      return {
        success: false,
        error: 'Time não encontrado',
      }
    }

    // Gestor só pode desativar times da sua hierarquia (fonte única)
    if (isGestor && !isAdmin) {
      const permissaoService = new PermissaoService(supabase)
      const hierarquiaIds = await permissaoService.getTimesHierarquia(usuario)
      if (!hierarquiaIds.includes(id)) {
        return {
          success: false,
          error: 'Você só pode desativar times da sua hierarquia',
        }
      }
    }

    // Verifica se tem membros
    const membrosCount = await timeRepo.countMembros(id)
    if (membrosCount > 0) {
      return {
        success: false,
        error: `Não é possível desativar. Este time tem ${membrosCount} membros ativos.`,
      }
    }

    // Verifica se tem times filhos
    const filhosCount = await timeRepo.countFilhos(id)
    if (filhosCount > 0) {
      return {
        success: false,
        error: `Não é possível desativar. Este time tem ${filhosCount} times filhos.`,
      }
    }

    // Desativa time
    await timeRepo.softDelete(id)

    // Revalida as páginas
    revalidatePath('/times')
    revalidatePath('/organograma')

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
 * Constrói hierarquia recursiva de um time
 */
async function buildTimeHierarchy(timeId: string, timeRepo: TimeRepository): Promise<TimeHierarquico | null> {
  const time = await timeRepo.findByIdWithBasicRelationships(timeId)

  if (!time) {
    return null
  }

  // Busca estatísticas
  const [membrosCount, vagasCount, filhosCount] = await Promise.all([
    timeRepo.countMembros(time.id),
    timeRepo.countVagas(time.id),
    timeRepo.countFilhos(time.id),
  ])

  // Busca filhos diretos
  const filhosDirectos = await timeRepo.findByTimePaiId(timeId)

  // Recursivamente busca hierarquia de cada filho
  const filhosComHierarquia: TimeHierarquico[] = []

  for (const filho of filhosDirectos) {
    const hierarquiaFilho = await buildTimeHierarchy(filho.id, timeRepo)
    if (hierarquiaFilho) {
      filhosComHierarquia.push(hierarquiaFilho)
    }
  }

  return {
    id: time.id,
    nome: time.nome,
    descricao: time.descricao,
    time_pai_id: time.time_pai_id,
    gestor_id: time.gestor_id,
    ativo: time.ativo,
    created_at: time.created_at,
    updated_at: time.updated_at,
    time_pai: time.time_pai || null,
    gestor: time.gestor || null,
    membros: membrosCount,
    vagas: vagasCount,
    times_filhos: filhosCount,
    filhos: filhosComHierarquia,
  }
}
