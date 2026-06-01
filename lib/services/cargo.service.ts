import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'
import { CargoRepository } from '@/lib/repositories'

export interface CargoNaTrilha {
  id: string
  nome: string
  nivel_nome: string | null
  pessoas_count: number
}

export class CargoService {
  private cargoRepo: CargoRepository

  constructor(supabase: SupabaseClient<Database>) {
    this.cargoRepo = new CargoRepository(supabase)
  }

  /**
   * Retorna cargos ativos de uma trilha com nome do nível e contagem de pessoas ativas.
   */
  async buscarCargosNaTrilha(trilhaId: string): Promise<CargoNaTrilha[]> {
    const cargos = await this.cargoRepo.findByTrilhaIdWithNivel(trilhaId)

    return Promise.all(
      cargos.map(async (cargo) => ({
        id: cargo.id,
        nome: cargo.nome,
        nivel_nome: cargo.nivel_nome,
        pessoas_count: await this.cargoRepo.countPessoas(cargo.id),
      }))
    )
  }
}
