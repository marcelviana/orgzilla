import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  PessoaRemuneracao,
  PessoaRemuneracaoInsert,
} from '@/lib/types'
import { RepositoryError } from './base.repository'

export interface RemuneracaoComCargo {
  salario_atual: number | null
  pessoa: {
    time_id: string | null
    cargo: {
      nivel: { nome: string } | null
      nome: string
    } | null
  } | null
}

/**
 * PessoaRemuneracao Repository
 *
 * Repository para acesso a dados da tabela 'pessoa_remuneracao' (1:1 com pessoa).
 *
 * ⚠️ SENSÍVEL - LGPD: a tabela é protegida por RLS no banco (apenas perfil
 * 'gestor' consegue ler/gravar). Mesmo assim, NÃO coloque regra de permissão
 * aqui — isso é responsabilidade do PessoaService. Este repository apenas
 * acessa dados.
 *
 * NOTA: a chave primária é `pessoa_id` (não há coluna `id` nem `ativo`), por
 * isso este repository não estende o BaseRepository.
 */
export class PessoaRemuneracaoRepository {
  private readonly supabase: SupabaseClient<Database>
  private readonly tableName = 'pessoa_remuneracao' as const

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  /**
   * Busca a remuneração de uma pessoa
   */
  async findByPessoaId(pessoaId: string): Promise<PessoaRemuneracao | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('pessoa_id', pessoaId)
      .maybeSingle()

    if (error) {
      throw new RepositoryError('Erro ao buscar remuneração da pessoa', error)
    }

    return (data) || null
  }

  /**
   * Busca a remuneração de várias pessoas (para listas)
   */
  async findByPessoaIds(pessoaIds: string[]): Promise<PessoaRemuneracao[]> {
    if (pessoaIds.length === 0) {
      return []
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .in('pessoa_id', pessoaIds)

    if (error) {
      throw new RepositoryError('Erro ao buscar remunerações', error)
    }

    return (data || [])
  }

  /**
   * Cria ou atualiza a remuneração de uma pessoa (upsert pela PK pessoa_id)
   */
  async upsert(dados: PessoaRemuneracaoInsert): Promise<PessoaRemuneracao> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .upsert(dados as never, { onConflict: 'pessoa_id' })
      .select()
      .single()

    if (error) {
      throw new RepositoryError('Erro ao salvar remuneração', error)
    }

    return data
  }

  /**
   * Busca remunerações com cargo e time para agregações (relatórios financeiros).
   * Retorna apenas pessoas com salário não-nulo; sem filtro de hierarquia — o
   * chamador (PessoaService) é responsável por restringir aos timeIds permitidos.
   */
  async findComCargoETimes(): Promise<RemuneracaoComCargo[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        salario_atual,
        pessoa:pessoa_id(
          time_id,
          cargo:cargo_id(
            nivel:nivel_id(nome),
            nome
          )
        )
      `)
      .not('salario_atual', 'is', null)

    if (error) {
      throw new RepositoryError('Erro ao buscar remunerações para agregação', error)
    }

    return data ?? []
  }

  /**
   * Remove a remuneração de uma pessoa
   */
  async deleteByPessoaId(pessoaId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('pessoa_id', pessoaId)

    if (error) {
      throw new RepositoryError('Erro ao remover remuneração', error)
    }
  }
}
