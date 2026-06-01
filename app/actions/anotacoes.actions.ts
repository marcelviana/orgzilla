'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioLogado } from '@/lib/middleware'
import { handleError } from '@/lib/errors/error-handler'
import { AnotacaoService } from '@/lib/services/anotacao.service'
import type { AnotacaoComUsuario } from '@/lib/repositories/anotacao.repository'

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

export async function getAnotacoesDaPessoa(
  pessoaId: string
): Promise<ActionResult<AnotacaoComUsuario[]>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    const anotacaoService = new AnotacaoService(supabase)
    const anotacoes = await anotacaoService.listarPorPessoa(usuario, pessoaId)

    return { success: true, data: anotacoes }
  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError.message }
  }
}

export async function criarAnotacaoDaPessoa(
  pessoaId: string,
  conteudo: string
): Promise<ActionResult<AnotacaoComUsuario>> {
  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    if (!conteudo.trim()) {
      return { success: false, error: 'Conteúdo não pode ser vazio' }
    }

    const anotacaoService = new AnotacaoService(supabase)
    const anotacao = await anotacaoService.criarParaPessoa(usuario, pessoaId, conteudo)

    return { success: true, data: anotacao }
  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError.message }
  }
}
