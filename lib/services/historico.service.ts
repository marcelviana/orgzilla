import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'
import { HistoricoCargoRepository, HistoricoTimeRepository, HistoricoReajusteRepository } from '@/lib/repositories'

/**
 * Historico Service
 *
 * Service para gerenciamento de históricos de pessoas.
 * - Histórico de cargos
 * - Histórico de times
 * - Histórico de reajustes salariais (SENSÍVEL - LGPD)
 */
export class HistoricoService {
  private supabase: SupabaseClient<Database>
  private historicoCargoRepo: HistoricoCargoRepository
  private historicoTimeRepo: HistoricoTimeRepository
  private historicoReajusteRepo: HistoricoReajusteRepository

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.historicoCargoRepo = new HistoricoCargoRepository(supabase)
    this.historicoTimeRepo = new HistoricoTimeRepository(supabase)
    this.historicoReajusteRepo = new HistoricoReajusteRepository(supabase)
  }

  // ==========================================================================
  // HISTÓRICO DE CARGOS
  // ==========================================================================

  /**
   * Cria um registro de histórico de cargo
   */
  async criarHistoricoCargo(pessoaId: string, cargoId: string, dataInicio: string): Promise<void> {
    try {
      await this.historicoCargoRepo.create({
        pessoa_id: pessoaId,
        cargo_id: cargoId,
        data_inicio: dataInicio,
        data_fim: null,
      })
    } catch (error) {
      console.error('[HistoricoService] Erro ao criar histórico de cargo:', error)
      throw new Error('Erro ao criar histórico de cargo', { cause: error })
    }
  }

  /**
   * Finaliza o histórico de cargo atual (seta data_fim)
   */
  async finalizarHistoricoCargoAtual(pessoaId: string, dataFim: string): Promise<void> {
    try {
      await this.historicoCargoRepo.finalizarCargoAtual(pessoaId, dataFim)
    } catch (error) {
      console.error('[HistoricoService] Erro ao finalizar histórico de cargo:', error)
      throw new Error('Erro ao finalizar histórico de cargo', { cause: error })
    }
  }

  /**
   * Busca histórico de cargos de uma pessoa
   */
  async buscarHistoricoCargos(pessoaId: string) {
    return await this.historicoCargoRepo.findByPessoaIdWithCargo(pessoaId)
  }

  /**
   * Busca cargo atual de uma pessoa
   */
  async buscarCargoAtual(pessoaId: string) {
    return await this.historicoCargoRepo.findAtualByPessoaId(pessoaId)
  }

  // ==========================================================================
  // HISTÓRICO DE TIMES
  // ==========================================================================

  /**
   * Cria um registro de histórico de time
   */
  async criarHistoricoTime(pessoaId: string, timeId: string, dataInicio: string): Promise<void> {
    try {
      await this.historicoTimeRepo.create({
        pessoa_id: pessoaId,
        time_id: timeId,
        data_inicio: dataInicio,
        data_fim: null,
      })
    } catch (error) {
      console.error('[HistoricoService] Erro ao criar histórico de time:', error)
      throw new Error('Erro ao criar histórico de time', { cause: error })
    }
  }

  /**
   * Finaliza o histórico de time atual (seta data_fim)
   */
  async finalizarHistoricoTimeAtual(pessoaId: string, dataFim: string): Promise<void> {
    try {
      await this.historicoTimeRepo.finalizarTimeAtual(pessoaId, dataFim)
    } catch (error) {
      console.error('[HistoricoService] Erro ao finalizar histórico de time:', error)
      throw new Error('Erro ao finalizar histórico de time', { cause: error })
    }
  }

  /**
   * Busca histórico de times de uma pessoa
   */
  async buscarHistoricoTimes(pessoaId: string) {
    return await this.historicoTimeRepo.findByPessoaIdWithTime(pessoaId)
  }

  /**
   * Busca time atual de uma pessoa
   */
  async buscarTimeAtual(pessoaId: string) {
    return await this.historicoTimeRepo.findAtualByPessoaId(pessoaId)
  }

  // ==========================================================================
  // HISTÓRICO DE REAJUSTES (SENSÍVEL - LGPD)
  // ==========================================================================

  /**
   * Cria um registro de histórico de reajuste
   *
   * ⚠️ SENSÍVEL - LGPD: Apenas gestores podem acessar
   *
   * CALCULA automaticamente o percentual:
   * percentual = ((salarioNovo - salarioAnterior) / salarioAnterior) * 100
   */
  async criarHistoricoReajuste(
    pessoaId: string,
    salarioAnterior: number | null,
    salarioNovo: number,
    dataReajuste: string,
    motivo?: string
  ): Promise<void> {
    try {
      // Calcula percentual de reajuste
      let percentual: number | null = null

      if (salarioAnterior && salarioAnterior > 0) {
        percentual = ((salarioNovo - salarioAnterior) / salarioAnterior) * 100
        // Arredonda para 2 casas decimais
        percentual = Math.round(percentual * 100) / 100
      }

      await this.historicoReajusteRepo.create({
        pessoa_id: pessoaId,
        salario_anterior: salarioAnterior,
        salario_novo: salarioNovo,
        percentual,
        data_reajuste: dataReajuste,
        motivo: motivo || null,
      })
    } catch (error) {
      console.error('[HistoricoService] Erro ao criar histórico de reajuste:', error)
      throw new Error('Erro ao criar histórico de reajuste', { cause: error })
    }
  }

  /**
   * Busca histórico de reajustes de uma pessoa
   *
   * ⚠️ SENSÍVEL - LGPD: Apenas gestores podem acessar
   */
  async buscarHistoricoReajustes(pessoaId: string) {
    return await this.historicoReajusteRepo.findByPessoaId(pessoaId)
  }

  /**
   * Busca último reajuste de uma pessoa
   *
   * ⚠️ SENSÍVEL - LGPD: Apenas gestores podem acessar
   */
  async buscarUltimoReajuste(pessoaId: string) {
    return await this.historicoReajusteRepo.findUltimoReajuste(pessoaId)
  }

  /**
   * Busca reajustes por período
   *
   * ⚠️ SENSÍVEL - LGPD: Apenas gestores podem acessar
   */
  async buscarReajustesPorPeriodo(dataInicio: string, dataFim: string) {
    return await this.historicoReajusteRepo.findByPeriodo(dataInicio, dataFim)
  }

  /**
   * Calcula percentual médio de reajuste em um período
   *
   * ⚠️ SENSÍVEL - LGPD: Apenas gestores podem acessar
   */
  async calcularPercentualMedioReajuste(dataInicio: string, dataFim: string): Promise<number> {
    return await this.historicoReajusteRepo.calcularPercentualMedio(dataInicio, dataFim)
  }

  // ==========================================================================
  // GESTÃO DE MUDANÇAS
  // ==========================================================================

  /**
   * Processa mudança de cargo de uma pessoa
   *
   * 1. Finaliza histórico de cargo atual (se existir)
   * 2. Cria novo histórico de cargo
   */
  async processarMudancaCargo(pessoaId: string, novoCargoId: string): Promise<void> {
    const hoje = new Date().toISOString().split('T')[0]

    try {
      // Finaliza cargo atual
      await this.finalizarHistoricoCargoAtual(pessoaId, hoje)

      // Cria novo histórico
      await this.criarHistoricoCargo(pessoaId, novoCargoId, hoje)
    } catch (error) {
      console.error('[HistoricoService] Erro ao processar mudança de cargo:', error)
      throw new Error('Erro ao processar mudança de cargo', { cause: error })
    }
  }

  /**
   * Processa mudança de time de uma pessoa
   *
   * 1. Finaliza histórico de time atual (se existir)
   * 2. Cria novo histórico de time
   */
  async processarMudancaTime(pessoaId: string, novoTimeId: string): Promise<void> {
    const hoje = new Date().toISOString().split('T')[0]

    try {
      // Finaliza time atual
      await this.finalizarHistoricoTimeAtual(pessoaId, hoje)

      // Cria novo histórico
      await this.criarHistoricoTime(pessoaId, novoTimeId, hoje)
    } catch (error) {
      console.error('[HistoricoService] Erro ao processar mudança de time:', error)
      throw new Error('Erro ao processar mudança de time', { cause: error })
    }
  }

  /**
   * Processa mudança de salário de uma pessoa
   *
   * ⚠️ SENSÍVEL - LGPD: Apenas gestores podem acessar
   *
   * Cria histórico de reajuste com cálculo automático de percentual
   */
  async processarMudancaSalario(
    pessoaId: string,
    salarioAnterior: number | null,
    salarioNovo: number,
    motivo?: string
  ): Promise<void> {
    const hoje = new Date().toISOString().split('T')[0]

    try {
      await this.criarHistoricoReajuste(pessoaId, salarioAnterior, salarioNovo, hoje, motivo)
    } catch (error) {
      console.error('[HistoricoService] Erro ao processar mudança de salário:', error)
      throw new Error('Erro ao processar mudança de salário', { cause: error })
    }
  }

  // ==========================================================================
  // RELATÓRIOS
  // ==========================================================================

  /**
   * Gera relatório completo de histórico de uma pessoa
   */
  async gerarRelatorioCompleto(pessoaId: string) {
    const [cargos, times, reajustes] = await Promise.all([
      this.buscarHistoricoCargos(pessoaId),
      this.buscarHistoricoTimes(pessoaId),
      this.buscarHistoricoReajustes(pessoaId),
    ])

    return {
      cargos,
      times,
      reajustes,
    }
  }

  /**
   * Calcula tempo em cada cargo (em dias)
   */
  calcularTempoEmCargo(dataInicio: string, dataFim: string | null): number {
    const inicio = new Date(dataInicio)
    const fim = dataFim ? new Date(dataFim) : new Date()

    const diff = fim.getTime() - inicio.getTime()
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))

    return dias
  }

  /**
   * Calcula tempo total de empresa (primeiro registro até hoje)
   */
  async calcularTempoEmpresa(pessoaId: string): Promise<number> {
    const historicos = await this.buscarHistoricoCargos(pessoaId)

    if (historicos.length === 0) {
      return 0
    }

    // Ordena por data_inicio (mais antigo primeiro)
    historicos.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())

    const primeiroRegistro = historicos[0]
    return this.calcularTempoEmCargo(primeiroRegistro.data_inicio, null)
  }
}
