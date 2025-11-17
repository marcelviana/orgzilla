import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Nivel, NivelInsert, NivelUpdate } from '@/lib/types'
import { BaseRepository, RepositoryError } from './base.repository'

/**
 * Nivel Repository
 *
 * Repository para acesso a dados da tabela 'nivel'.
 * IMPORTANTE: Apenas acessa dados. Lógica de negócio vai em NivelService.
 *
 * Os níveis formam uma cadeia sequencial: L1 → L2 → L3 → ... → L16
 */
export class NivelRepository extends BaseRepository<'nivel', Nivel, NivelInsert, NivelUpdate> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'nivel')
  }

  // ==========================================================================
  // QUERIES CUSTOMIZADAS
  // ==========================================================================

  /**
   * Busca nível por nome (L1, L2, L3, etc.)
   */
  async findByNome(nome: string): Promise<Nivel | null> {
    return this.executeQuerySingle((query) => query.eq('nome', nome))
  }

  /**
   * Busca nível com nível anterior
   */
  async findByIdWithAnterior(id: string): Promise<NivelComAnterior | null> {
    const { data, error } = await this.supabase
      .from('nivel')
      .select(`
        *,
        nivel_anterior:nivel_anterior_id (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new RepositoryError('Erro ao buscar nível com anterior', error)
    }

    return data as NivelComAnterior
  }

  /**
   * Busca níveis que vêm depois de um nível específico
   */
  async findByNivelAnteriorId(nivelAnteriorId: string): Promise<Nivel[]> {
    return this.executeQuery((query) => query.eq('nivel_anterior_id', nivelAnteriorId))
  }

  /**
   * Busca o primeiro nível da cadeia (L1)
   */
  async findPrimeiroNivel(): Promise<Nivel | null> {
    return this.executeQuerySingle((query) => query.is('nivel_anterior_id', null))
  }

  /**
   * Busca o último nível da cadeia (L16)
   * NOTA: Assume que o último nível é aquele que nenhum outro nível referencia
   */
  async findUltimoNivel(): Promise<Nivel | null> {
    // Busca todos os níveis que são referenciados como anterior
    const { data: referenciados } = await this.supabase
      .from('nivel')
      .select('nivel_anterior_id')
      .not('nivel_anterior_id', 'is', null)

    const idsReferenciados = new Set(referenciados?.map((n) => n.nivel_anterior_id) || [])

    // Busca todos os níveis
    const todos = await this.findAll()

    // Encontra o nível que não está na lista de referenciados
    const ultimo = todos.find((nivel) => !idsReferenciados.has(nivel.id))

    return ultimo || null
  }

  /**
   * Busca todos os níveis ordenados pela cadeia (L1, L2, L3, ...)
   */
  async findAllOrdered(): Promise<Nivel[]> {
    const todos = await this.findAll()

    if (todos.length === 0) {
      return []
    }

    // Ordena pela cadeia de nivel_anterior_id
    const ordenados: Nivel[] = []
    const nivelMap = new Map(todos.map((n) => [n.id, n]))

    // Encontra o primeiro nível (sem anterior)
    let atual = todos.find((n) => !n.nivel_anterior_id)

    while (atual) {
      ordenados.push(atual)

      // Encontra o próximo nível
      const proximo = todos.find((n) => n.nivel_anterior_id === atual!.id)
      atual = proximo
    }

    return ordenados
  }

  /**
   * Busca a cadeia completa de níveis a partir de um nível
   * Retorna todos os níveis anteriores até L1
   */
  async findCadeiaAnterior(nivelId: string): Promise<Nivel[]> {
    const cadeia: Nivel[] = []
    let atual = await this.findById(nivelId)

    while (atual) {
      cadeia.push(atual)

      if (!atual.nivel_anterior_id) {
        break
      }

      atual = await this.findById(atual.nivel_anterior_id)
    }

    return cadeia.reverse() // L1 -> L2 -> ... -> nivelId
  }

  /**
   * Busca a cadeia completa de níveis após um nível
   * Retorna todos os níveis posteriores até L16
   */
  async findCadeiaPosterior(nivelId: string): Promise<Nivel[]> {
    const cadeia: Nivel[] = []
    let atual = await this.findById(nivelId)

    while (atual) {
      cadeia.push(atual)

      // Busca próximo nível
      const proximo = await this.executeQuerySingle((query) =>
        query.eq('nivel_anterior_id', atual!.id)
      )

      atual = proximo
    }

    return cadeia
  }

  /**
   * Conta quantos cargos usam este nível
   */
  async countCargos(nivelId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('cargo')
      .select('*', { count: 'exact', head: true })
      .eq('nivel_id', nivelId)

    if (error) {
      throw new RepositoryError('Erro ao contar cargos do nível', error)
    }

    return count || 0
  }

  /**
   * Verifica se um nível pode ser deletado (não tem cargos)
   */
  async canDelete(nivelId: string): Promise<boolean> {
    const count = await this.countCargos(nivelId)
    return count === 0
  }

  /**
   * Verifica se um nome de nível já existe
   */
  async nomeExists(nome: string, excludeNivelId?: string): Promise<boolean> {
    let query = this.supabase.from('nivel').select('id').eq('nome', nome)

    if (excludeNivelId) {
      query = query.neq('id', excludeNivelId)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new RepositoryError('Erro ao verificar nome do nível', error)
    }

    return !!data
  }

  /**
   * Busca nível pelo índice na cadeia (0 = L1, 1 = L2, etc.)
   */
  async findByIndice(indice: number): Promise<Nivel | null> {
    const ordenados = await this.findAllOrdered()
    return ordenados[indice] || null
  }

  /**
   * Retorna o índice de um nível na cadeia (L1 = 0, L2 = 1, etc.)
   */
  async getIndice(nivelId: string): Promise<number> {
    const ordenados = await this.findAllOrdered()
    return ordenados.findIndex((n) => n.id === nivelId)
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface NivelComAnterior extends Nivel {
  nivel_anterior?: {
    id: string
    nome: string
  } | null
}
