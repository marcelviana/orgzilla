import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tag, TagInsert, TagUpdate, PessoaTag, PessoaTagInsert, PessoaTagUpdate } from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

/**
 * Tag Repository
 *
 * Repository para acesso a dados da tabela 'tag'.
 * IMPORTANTE: Apenas acessa dados. Lógica de negócio vai em TagService.
 *
 * Campos: id, nome, cor, ativo, created_at
 */
export class TagRepository extends BaseRepository<'tag', Tag, TagInsert, TagUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'tag')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca tag por nome
   */
  async findByNome(nome: string): Promise<Tag | null> {
    return this.executeQuerySingle((query) => query.eq('nome', nome))
  }

  /**
   * Busca tags por nome (case-insensitive, parcial)
   */
  async findByNomeLike(nome: string): Promise<Tag[]> {
    return this.executeQuery((query) => query.ilike('nome', `%${nome}%`))
  }

  /**
   * Busca tags por cor
   */
  async findByCor(cor: string): Promise<Tag[]> {
    return this.executeQuery((query) => query.eq('cor', cor))
  }

  /**
   * Busca tag com contagem de pessoas
   */
  async findByIdWithPessoaCount(id: string): Promise<TagComContagem | null> {
    const tag = await this.findById(id)

    if (!tag) {
      return null
    }

    const count = await this.countPessoas(id)

    return {
      ...tag,
      total_pessoas: count,
    }
  }

  /**
   * Busca todas as tags com contagem de pessoas
   */
  async findAllWithPessoaCount(): Promise<TagComContagem[]> {
    const tags = await this.findAll()

    const tagsComContagem = await Promise.all(
      tags.map(async (tag) => {
        const count = await this.countPessoas(tag.id)
        return {
          ...tag,
          total_pessoas: count,
        }
      })
    )

    return tagsComContagem
  }

  /**
   * Conta quantas pessoas têm esta tag
   */
  async countPessoas(tagId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('pessoa_tag')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', tagId)

    if (error) {
      throw new RepositoryError('Erro ao contar pessoas da tag', error)
    }

    return count || 0
  }

  /**
   * Verifica se uma tag pode ser deletada (não tem pessoas)
   */
  async canDelete(tagId: string): Promise<boolean> {
    const count = await this.countPessoas(tagId)
    return count === 0
  }

  /**
   * Verifica se um nome de tag já existe
   */
  async nomeExists(nome: string, excludeTagId?: string): Promise<boolean> {
    let query = this.supabase.from('tag').select('id').eq('nome', nome)

    if (excludeTagId) {
      query = query.neq('id', excludeTagId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError('Erro ao verificar nome da tag', error)
    }

    return !!data
  }
}

// =============================================================================
// PessoaTag Repository
// =============================================================================

/**
 * PessoaTag Repository
 *
 * Repository para acesso a dados da tabela 'pessoa_tag'.
 * Gerencia o relacionamento N:N entre pessoas e tags.
 *
 * Campos: id, pessoa_id, tag_id, created_at
 */
export class PessoaTagRepository extends BaseRepository<'pessoa_tag', PessoaTag, PessoaTagInsert, PessoaTagUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'pessoa_tag')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca tags de uma pessoa
   */
  async findByPessoaId(pessoaId: string): Promise<PessoaTag[]> {
    return this.executeQuery((query) => query.eq('pessoa_id', pessoaId))
  }

  /**
   * Busca tags de uma pessoa com dados completos das tags
   */
  async findByPessoaIdWithTags(pessoaId: string): Promise<PessoaTagComTag[]> {
    const { data, error } = await this.supabase
      .from('pessoa_tag')
      .select(`
        *,
        tag:tag_id (*)
      `)
      .eq('pessoa_id', pessoaId)

    if (error) {
      throw new RepositoryError('Erro ao buscar tags da pessoa', error)
    }

    return (data || [])
  }

  /**
   * Busca pessoas com uma tag
   */
  async findByTagId(tagId: string): Promise<PessoaTag[]> {
    return this.executeQuery((query) => query.eq('tag_id', tagId))
  }

  /**
   * Busca pessoas com uma tag com dados completos das pessoas
   */
  async findByTagIdWithPessoas(tagId: string): Promise<PessoaTagComPessoa[]> {
    const { data, error } = await this.supabase
      .from('pessoa_tag')
      .select(`
        *,
        pessoa:pessoa_id (*)
      `)
      .eq('tag_id', tagId)

    if (error) {
      throw new RepositoryError('Erro ao buscar pessoas da tag', error)
    }

    return (data || [])
  }

  /**
   * Busca relacionamento específico (pessoa + tag)
   */
  async findByPessoaAndTag(pessoaId: string, tagId: string): Promise<PessoaTag | null> {
    return this.executeQuerySingle((query) => query.eq('pessoa_id', pessoaId).eq('tag_id', tagId))
  }

  /**
   * Verifica se pessoa já tem a tag
   */
  async hasTag(pessoaId: string, tagId: string): Promise<boolean> {
    const relacao = await this.findByPessoaAndTag(pessoaId, tagId)
    return !!relacao
  }

  /**
   * Adiciona tag a uma pessoa
   */
  async addTag(pessoaId: string, tagId: string): Promise<PessoaTag> {
    // Verifica se já existe
    const existe = await this.hasTag(pessoaId, tagId)

    if (existe) {
      const relacao = await this.findByPessoaAndTag(pessoaId, tagId)
      return relacao!
    }

    return this.create({
      pessoa_id: pessoaId,
      tag_id: tagId,
    })
  }

  /**
   * Remove tag de uma pessoa
   */
  async removeTag(pessoaId: string, tagId: string): Promise<void> {
    const relacao = await this.findByPessoaAndTag(pessoaId, tagId)

    if (relacao) {
      await this.delete(relacao.id)
    }
  }

  /**
   * Remove todas as tags de uma pessoa
   */
  async removeAllTags(pessoaId: string): Promise<void> {
    const { error } = await this.supabase.from('pessoa_tag').delete().eq('pessoa_id', pessoaId)

    if (error) {
      throw new RepositoryError('Erro ao remover tags da pessoa', error)
    }
  }

  /**
   * Atualiza tags de uma pessoa (remove antigas e adiciona novas)
   */
  async updateTags(pessoaId: string, tagIds: string[]): Promise<void> {
    // Remove todas as tags atuais
    await this.removeAllTags(pessoaId)

    // Adiciona novas tags
    if (tagIds.length > 0) {
      const inserts = tagIds.map((tagId) => ({
        pessoa_id: pessoaId,
        tag_id: tagId,
      }))

      const { error } = await this.supabase.from('pessoa_tag').insert(inserts)

      if (error) {
        throw new RepositoryError('Erro ao adicionar tags à pessoa', error)
      }
    }
  }

  /**
   * Conta tags de uma pessoa
   */
  async countByPessoa(pessoaId: string): Promise<number> {
    return this.count({ pessoa_id: pessoaId })
  }

  /**
   * Conta pessoas com uma tag
   */
  async countByTag(tagId: string): Promise<number> {
    return this.count({ tag_id: tagId })
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface TagComContagem extends Tag {
  total_pessoas: number
}

export interface PessoaTagComTag extends PessoaTag {
  tag?: Tag
}

export interface PessoaTagComPessoa extends PessoaTag {
  pessoa?: {
    id: string
    nome: string
    email_corporativo: string | null
  }
}
