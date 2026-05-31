import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  ProjetoProduto,
  ProjetoProdutoInsert,
  ProjetoProdutoUpdate,
  PessoaProjetoProduto,
  PessoaProjetoProdutoInsert,
  PessoaProjetoProdutoUpdate,
} from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

/**
 * ProjetoProduto Repository
 *
 * Repository para acesso a dados da tabela 'projeto_produto'.
 * IMPORTANTE: Apenas acessa dados. Lógica de negócio vai em ProjetoProdutoService.
 *
 * Campos: id, nome, ativo, created_at, updated_at
 */
export class ProjetoProdutoRepository extends BaseRepository<
  'projeto_produto',
  ProjetoProduto,
  ProjetoProdutoInsert,
  ProjetoProdutoUpdate
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'projeto_produto')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca projeto com pessoas alocadas
   */
  async findByIdWithPessoas(id: string): Promise<ProjetoComPessoas | null> {
    const { data, error } = await this.supabase
      .from('projeto_produto')
      .select(`
        *,
        alocacoes:pessoa_projeto_produto (
          *,
          pessoa:pessoa_id (
            *,
            cargo:cargo_id (*),
            time:time_id (*)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar projeto com pessoas', error)
    }

    return data
  }

  /**
   * Busca todos os projetos com pessoas alocadas
   */
  async findAllWithPessoas(): Promise<ProjetoComPessoas[]> {
    const { data, error } = await this.supabase
      .from('projeto_produto')
      .select(`
        *,
        alocacoes:pessoa_projeto_produto (
          *,
          pessoa:pessoa_id (
            *,
            cargo:cargo_id (*),
            time:time_id (*)
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new RepositoryError('Erro ao buscar projetos com pessoas', error)
    }

    return (data || [])
  }

  /**
   * Busca projeto por nome
   */
  async findByNome(nome: string): Promise<ProjetoProduto | null> {
    return this.executeQuerySingle((query) => query.eq('nome', nome))
  }

  /**
   * Busca projetos por nome (case-insensitive, parcial)
   */
  async findByNomeLike(nome: string): Promise<ProjetoProduto[]> {
    return this.executeQuery((query) => query.ilike('nome', `%${nome}%`))
  }

  /**
   * Conta quantas pessoas estão alocadas no projeto
   */
  async countPessoas(projetoId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('pessoa_projeto_produto')
      .select('*', { count: 'exact', head: true })
      .eq('projeto_produto_id', projetoId)
      .eq('ativo', true)
      .is('data_fim', null) // Apenas alocações atuais

    if (error) {
      throw new RepositoryError('Erro ao contar pessoas do projeto', error)
    }

    return count || 0
  }

  /**
   * Conta quantas pessoas já passaram pelo projeto (incluindo histórico)
   */
  async countPessoasTotal(projetoId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('pessoa_projeto_produto')
      .select('pessoa_id', { count: 'exact', head: true })
      .eq('projeto_produto_id', projetoId)

    if (error) {
      throw new RepositoryError('Erro ao contar pessoas total do projeto', error)
    }

    return count || 0
  }

  /**
   * Verifica se um projeto pode ser deletado (não tem pessoas alocadas)
   */
  async canDelete(projetoId: string): Promise<boolean> {
    const count = await this.countPessoas(projetoId)
    return count === 0
  }

  /**
   * Verifica se um nome de projeto já existe
   */
  async nomeExists(nome: string, excludeProjetoId?: string): Promise<boolean> {
    let query = this.supabase.from('projeto_produto').select('id').eq('nome', nome)

    if (excludeProjetoId) {
      query = query.neq('id', excludeProjetoId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError('Erro ao verificar nome do projeto', error)
    }

    return !!data
  }

  /**
   * Busca projetos com contagem de pessoas
   */
  async findAllWithPessoaCount(): Promise<ProjetoComContagem[]> {
    const projetos = await this.findAll()

    const projetosComContagem = await Promise.all(
      projetos.map(async (projeto) => {
        const count = await this.countPessoas(projeto.id)
        return {
          ...projeto,
          total_pessoas: count,
        }
      })
    )

    return projetosComContagem
  }
}

// =============================================================================
// PessoaProjetoProduto Repository
// =============================================================================

/**
 * PessoaProjetoProduto Repository
 *
 * Repository para acesso a dados da tabela 'pessoa_projeto_produto'.
 * Gerencia as alocações de pessoas em projetos/produtos.
 *
 * Campos: id, pessoa_id, projeto_produto_id, data_inicio, data_fim, ativo, created_at
 */
export class PessoaProjetoProdutoRepository extends BaseRepository<
  'pessoa_projeto_produto',
  PessoaProjetoProduto,
  PessoaProjetoProdutoInsert,
  PessoaProjetoProdutoUpdate
> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'pessoa_projeto_produto')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca alocações de uma pessoa
   */
  async findByPessoaId(pessoaId: string): Promise<PessoaProjetoProduto[]> {
    return this.executeQuery((query) => query.eq('pessoa_id', pessoaId))
  }

  /**
   * Busca alocações ativas de uma pessoa
   */
  async findAtivasByPessoaId(pessoaId: string): Promise<PessoaProjetoProduto[]> {
    return this.executeQuery((query) =>
      query.eq('pessoa_id', pessoaId).eq('ativo', true).is('data_fim', null)
    )
  }

  /**
   * Busca alocações de um projeto
   */
  async findByProjetoId(projetoId: string): Promise<PessoaProjetoProduto[]> {
    return this.executeQuery((query) => query.eq('projeto_produto_id', projetoId))
  }

  /**
   * Busca alocações ativas de um projeto
   */
  async findAtivasByProjetoId(projetoId: string): Promise<PessoaProjetoProduto[]> {
    return this.executeQuery((query) =>
      query.eq('projeto_produto_id', projetoId).eq('ativo', true).is('data_fim', null)
    )
  }

  /**
   * Busca alocação específica (pessoa + projeto)
   */
  async findByPessoaAndProjeto(
    pessoaId: string,
    projetoId: string
  ): Promise<PessoaProjetoProduto | null> {
    return this.executeQuerySingle((query) =>
      query.eq('pessoa_id', pessoaId).eq('projeto_produto_id', projetoId).is('data_fim', null)
    )
  }

  /**
   * Busca alocações com relacionamentos
   */
  async findByIdWithRelationships(id: string): Promise<AlocacaoComRelacionamentos | null> {
    const { data, error } = await this.supabase
      .from('pessoa_projeto_produto')
      .select(`
        *,
        pessoa:pessoa_id (*),
        projeto:projeto_produto_id (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar alocação com relacionamentos', error)
    }

    return data
  }

  /**
   * Verifica se pessoa já está alocada no projeto
   */
  async isAlocada(pessoaId: string, projetoId: string): Promise<boolean> {
    const alocacao = await this.findByPessoaAndProjeto(pessoaId, projetoId)
    return !!alocacao
  }

  /**
   * Finaliza uma alocação (seta data_fim)
   */
  async finalizarAlocacao(id: string, dataFim: string): Promise<PessoaProjetoProduto> {
    return this.update(id, {
      data_fim: dataFim,
    })
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface ProjetoComPessoas extends ProjetoProduto {
  alocacoes?: Array<{
    id: string
    data_inicio: string
    data_fim: string | null
    pessoa?: {
      id: string
      nome: string
      email_corporativo: string | null
      cargo?: {
        id: string
        nome: string
      }
      time?: {
        id: string
        nome: string
      }
    }
  }>
}

export interface ProjetoComContagem extends ProjetoProduto {
  total_pessoas: number
}

export interface AlocacaoComRelacionamentos extends PessoaProjetoProduto {
  pessoa?: {
    id: string
    nome: string
  }
  projeto?: {
    id: string
    nome: string
  }
}
