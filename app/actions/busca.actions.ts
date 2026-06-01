'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioLogado } from '@/lib/middleware'
import { PermissaoService } from '@/lib/services'
import { TimeRepository, CargoRepository, ProjetoProdutoRepository } from '@/lib/repositories'
import { handleError } from '@/lib/errors/error-handler'
import type { Pessoa } from '@/lib/types'

export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

export type BuscaPessoaItem = Pick<Pessoa, 'id' | 'nome' | 'email_corporativo' | 'foto_url' | 'status'>

export type BuscaEntidadesResult = {
  pessoas: BuscaPessoaItem[]
  times: Array<{ id: string; nome: string }>
  projetos: Array<{ id: string; nome: string }>
  cargos: Array<{ id: string; nome: string }>
}

export async function buscarEntidades(query: string): Promise<ActionResult<BuscaEntidadesResult>> {
  if (!query.trim()) {
    return { success: true, data: { pessoas: [], times: [], projetos: [], cargos: [] } }
  }

  try {
    const supabase = await createClient()
    const usuario = await getUsuarioLogado()

    if (!usuario) {
      return { success: false, error: 'Não autenticado' }
    }

    // Pessoas: query com ilike + filtro de hierarquia para gestor
    let pessoaQuery = supabase
      .from('pessoa')
      .select('id, nome, email_corporativo, foto_url, status, time_id')
      .or(`nome.ilike.%${query}%,email_corporativo.ilike.%${query}%`)
      .eq('ativo', true)
      .order('nome')
      .limit(20)

    if (usuario.tipo_perfil === 'gestor') {
      const permissaoService = new PermissaoService(supabase)
      const timeIds = await permissaoService.getTimesHierarquia(usuario)
      if (timeIds.length === 0) {
        pessoaQuery = pessoaQuery.in('time_id', ['00000000-0000-0000-0000-000000000000'])
      } else {
        pessoaQuery = pessoaQuery.in('time_id', timeIds)
      }
    }

    // Repositórios com ilike no banco — filtragem na camada de dados
    const timeRepo = new TimeRepository(supabase)
    const projetoRepo = new ProjetoProdutoRepository(supabase)
    const cargoRepo = new CargoRepository(supabase)

    const [pessoaResult, timesRaw, projetosRaw, cargosRaw] = await Promise.all([
      pessoaQuery,
      timeRepo.findByNome(query),
      projetoRepo.findByNomeLike(query),
      cargoRepo.findByNome(query),
    ])

    if (pessoaResult.error) throw pessoaResult.error

    const pessoas: BuscaPessoaItem[] = (pessoaResult.data ?? []).map(p => ({
      id: p.id,
      nome: p.nome,
      email_corporativo: p.email_corporativo,
      foto_url: p.foto_url,
      status: p.status,
    }))

    const times = timesRaw
      .filter(t => t.ativo)
      .map(t => ({ id: t.id, nome: t.nome }))

    const projetos = projetosRaw
      .filter(p => p.ativo)
      .map(p => ({ id: p.id, nome: p.nome }))

    const cargos = cargosRaw
      .filter(c => c.ativo)
      .map(c => ({ id: c.id, nome: c.nome }))

    return { success: true, data: { pessoas, times, projetos, cargos } }
  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError.message }
  }
}
