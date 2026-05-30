/**
 * Repositories Export - Orgzilla
 *
 * Este arquivo centraliza todos os repositories para fácil importação.
 * Repositories apenas acessam dados (CRUD). Lógica de negócio vai em Services.
 *
 * @example
 * ```tsx
 * import { UsuarioRepository, PessoaRepository } from '@/lib/repositories'
 * ```
 */

// =============================================================================
// BASE REPOSITORY
// =============================================================================

export { BaseRepository, RepositoryError } from './base.repository'
export type { FindManyOptions, PaginatedResult } from './base.repository'

// =============================================================================
// REPOSITORIES
// =============================================================================

// Core entities
export { UsuarioRepository } from './usuario.repository'
export type { UsuarioComPessoa } from './usuario.repository'

export { PessoaRepository } from './pessoa.repository'
export type { PessoaComRelacionamentosBasicos, PessoaFilters } from './pessoa.repository'

export { PessoaRemuneracaoRepository } from './pessoa-remuneracao.repository'

export { TimeRepository } from './time.repository'
export type { TimeComRelacionamentosBasicos, TimeHierarchy, TimeFilters } from './time.repository'

export { NivelRepository } from './nivel.repository'
export type { NivelComAnterior } from './nivel.repository'

export { TrilhaCarreiraRepository } from './trilha-carreira.repository'
export type { TrilhaComCargos, TrilhaComContagem } from './trilha-carreira.repository'

export { CargoRepository } from './cargo.repository'
export type { CargoFilters, CargoComStats } from './cargo.repository'

// Vagas
export { VagaTimeRepository } from './vaga-time.repository'
export type { VagaComRelacionamentos, VagaTimeFilters } from './vaga-time.repository'

// Projetos
export { ProjetoProdutoRepository, PessoaProjetoProdutoRepository } from './projeto-produto.repository'
export type { ProjetoComPessoas, ProjetoComContagem, AlocacaoComRelacionamentos } from './projeto-produto.repository'

// Tags
export { TagRepository, PessoaTagRepository } from './tag.repository'
export type { TagComContagem, PessoaTagComTag, PessoaTagComPessoa } from './tag.repository'

// Anotações
export { AnotacaoRepository } from './anotacao.repository'
export type { AnotacaoComUsuario, AnotacaoFilters } from './anotacao.repository'

// Histórico
export {
  HistoricoCargoRepository,
  HistoricoTimeRepository,
  HistoricoReajusteRepository,
  HistoricoMudancaRepository,
} from './historico.repository'
export type {
  HistoricoCargoComCargo,
  HistoricoTimeComTime,
  HistoricoMudancaComUsuario,
  HistoricoMudancaFilters,
} from './historico.repository'

// =============================================================================
// FACTORY FUNCTIONS (opcional - para criar instâncias facilmente)
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'
import { UsuarioRepository } from './usuario.repository'
import { PessoaRepository } from './pessoa.repository'
import { PessoaRemuneracaoRepository } from './pessoa-remuneracao.repository'
import { TimeRepository } from './time.repository'
import { NivelRepository } from './nivel.repository'
import { TrilhaCarreiraRepository } from './trilha-carreira.repository'
import { CargoRepository } from './cargo.repository'
import { VagaTimeRepository } from './vaga-time.repository'
import { ProjetoProdutoRepository, PessoaProjetoProdutoRepository } from './projeto-produto.repository'
import { TagRepository, PessoaTagRepository } from './tag.repository'
import { AnotacaoRepository } from './anotacao.repository'
import {
  HistoricoCargoRepository,
  HistoricoTimeRepository,
  HistoricoReajusteRepository,
  HistoricoMudancaRepository,
} from './historico.repository'

/**
 * Cria todas as instâncias de repositories
 */
export function createRepositories(supabase: SupabaseClient<Database>) {
  return {
    // Core entities
    usuario: new UsuarioRepository(supabase),
    pessoa: new PessoaRepository(supabase),
    pessoaRemuneracao: new PessoaRemuneracaoRepository(supabase),
    time: new TimeRepository(supabase),
    nivel: new NivelRepository(supabase),
    trilhaCarreira: new TrilhaCarreiraRepository(supabase),
    cargo: new CargoRepository(supabase),

    // Vagas
    vagaTime: new VagaTimeRepository(supabase),

    // Projetos
    projetoProduto: new ProjetoProdutoRepository(supabase),
    pessoaProjetoProduto: new PessoaProjetoProdutoRepository(supabase),

    // Tags
    tag: new TagRepository(supabase),
    pessoaTag: new PessoaTagRepository(supabase),

    // Anotações
    anotacao: new AnotacaoRepository(supabase),

    // Histórico
    historicoCargo: new HistoricoCargoRepository(supabase),
    historicoTime: new HistoricoTimeRepository(supabase),
    historicoReajuste: new HistoricoReajusteRepository(supabase),
    historicoMudanca: new HistoricoMudancaRepository(supabase),
  }
}
