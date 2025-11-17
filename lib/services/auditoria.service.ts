import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, TipoMudanca } from '@/lib/types'
import { HistoricoMudancaRepository } from '@/lib/repositories'

/**
 * Auditoria Service
 *
 * Service para registro de auditoria de todas as mudanças no sistema.
 * Registra em historico_mudanca toda criação/edição/exclusão.
 *
 * Campos: tipo_entidade, entidade_id, tipo_mudanca, campo_alterado,
 *         valor_anterior (jsonb), valor_novo (jsonb), usuario_id, created_at
 */
export class AuditoriaService {
  private supabase: SupabaseClient<Database>
  private historicoRepo: HistoricoMudancaRepository

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.historicoRepo = new HistoricoMudancaRepository(supabase)
  }

  // ==========================================================================
  // REGISTRO DE AUDITORIA
  // ==========================================================================

  /**
   * Registra uma mudança no sistema
   */
  async registrar(dados: RegistroAuditoria): Promise<void> {
    try {
      await this.historicoRepo.create({
        tipo_entidade: dados.tipoEntidade,
        entidade_id: dados.entidadeId,
        tipo_mudanca: dados.tipoMudanca,
        campo_alterado: dados.campoAlterado || null,
        valor_anterior: dados.valorAnterior || null,
        valor_novo: dados.valorNovo || null,
        usuario_id: dados.usuarioId,
      })
    } catch (error) {
      console.error('[AuditoriaService] Erro ao registrar auditoria:', error)
      // Não lança erro para não bloquear operação principal
    }
  }

  /**
   * Registra criação de entidade
   */
  async registrarCriacao(
    tipoEntidade: string,
    entidadeId: string,
    valorNovo: any,
    usuarioId: string
  ): Promise<void> {
    await this.registrar({
      tipoEntidade,
      entidadeId,
      tipoMudanca: 'criacao',
      valorNovo,
      usuarioId,
    })
  }

  /**
   * Registra edição de entidade
   */
  async registrarEdicao(
    tipoEntidade: string,
    entidadeId: string,
    campoAlterado: string,
    valorAnterior: any,
    valorNovo: any,
    usuarioId: string
  ): Promise<void> {
    // Não registra se valores são iguais
    if (JSON.stringify(valorAnterior) === JSON.stringify(valorNovo)) {
      return
    }

    await this.registrar({
      tipoEntidade,
      entidadeId,
      tipoMudanca: 'edicao',
      campoAlterado,
      valorAnterior,
      valorNovo,
      usuarioId,
    })
  }

  /**
   * Registra exclusão de entidade
   */
  async registrarExclusao(
    tipoEntidade: string,
    entidadeId: string,
    valorAnterior: any,
    usuarioId: string
  ): Promise<void> {
    await this.registrar({
      tipoEntidade,
      entidadeId,
      tipoMudanca: 'exclusao',
      valorAnterior,
      usuarioId,
    })
  }

  /**
   * Registra múltiplas mudanças de uma vez (atualização de entidade)
   */
  async registrarMudancas(
    tipoEntidade: string,
    entidadeId: string,
    dadosAnteriores: any,
    dadosNovos: any,
    usuarioId: string
  ): Promise<void> {
    // Compara objetos e registra apenas campos alterados
    const camposAlterados = this.getCamposAlterados(dadosAnteriores, dadosNovos)

    for (const campo of camposAlterados) {
      await this.registrarEdicao(
        tipoEntidade,
        entidadeId,
        campo,
        dadosAnteriores[campo],
        dadosNovos[campo],
        usuarioId
      )
    }
  }

  // ==========================================================================
  // BUSCA DE AUDITORIA
  // ==========================================================================

  /**
   * Busca histórico de mudanças de uma entidade
   */
  async buscarPorEntidade(tipoEntidade: string, entidadeId: string) {
    return await this.historicoRepo.findByEntidadeWithUsuario(tipoEntidade, entidadeId)
  }

  /**
   * Busca mudanças feitas por um usuário
   */
  async buscarPorUsuario(usuarioId: string) {
    return await this.historicoRepo.findByUsuarioId(usuarioId)
  }

  /**
   * Busca mudanças recentes
   */
  async buscarRecentes(limit: number = 50) {
    return await this.historicoRepo.findRecent(limit)
  }

  /**
   * Busca mudanças por período
   */
  async buscarPorPeriodo(dataInicio: string, dataFim: string) {
    return await this.historicoRepo.findByPeriodo(dataInicio, dataFim)
  }

  /**
   * Busca com filtros avançados
   */
  async buscarComFiltros(filtros: {
    tipoEntidade?: string
    entidadeId?: string
    tipoMudanca?: TipoMudanca
    usuarioId?: string
    campoAlterado?: string
    dataInicio?: string
    dataFim?: string
  }) {
    return await this.historicoRepo.findWithFilters(filtros)
  }

  // ==========================================================================
  // RELATÓRIOS DE AUDITORIA
  // ==========================================================================

  /**
   * Gera relatório de atividades de um usuário
   */
  async gerarRelatorioUsuario(usuarioId: string, dataInicio: string, dataFim: string) {
    const mudancas = await this.historicoRepo.findWithFilters({
      usuario_id: usuarioId,
      data_inicio: dataInicio,
      data_fim: dataFim,
    })

    const totalMudancas = mudancas.length
    const porTipo = mudancas.reduce(
      (acc, m) => {
        acc[m.tipo_mudanca] = (acc[m.tipo_mudanca] || 0) + 1
        return acc
      },
      {} as Record<TipoMudanca, number>
    )

    const porEntidade = mudancas.reduce(
      (acc, m) => {
        acc[m.tipo_entidade] = (acc[m.tipo_entidade] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMudancas,
      porTipo,
      porEntidade,
      mudancas,
    }
  }

  /**
   * Gera relatório de mudanças em uma entidade
   */
  async gerarRelatorioEntidade(tipoEntidade: string, entidadeId: string) {
    const mudancas = await this.historicoRepo.findByEntidadeWithUsuario(tipoEntidade, entidadeId)

    const totalMudancas = mudancas.length
    const porTipo = mudancas.reduce(
      (acc, m) => {
        acc[m.tipo_mudanca] = (acc[m.tipo_mudanca] || 0) + 1
        return acc
      },
      {} as Record<TipoMudanca, number>
    )

    const porUsuario = mudancas.reduce(
      (acc, m) => {
        const nomeUsuario = m.usuario?.nome || 'Desconhecido'
        acc[nomeUsuario] = (acc[nomeUsuario] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMudancas,
      porTipo,
      porUsuario,
      mudancas,
    }
  }

  /**
   * Busca atividades recentes do sistema
   */
  async getAtividadesRecentes(limit: number = 10) {
    return await this.historicoRepo.findRecent(limit)
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Compara dois objetos e retorna lista de campos alterados
   */
  private getCamposAlterados(anterior: any, novo: any): string[] {
    const campos: string[] = []

    // Campos ignorados (timestamps, etc)
    const camposIgnorados = ['updated_at', 'created_at']

    // Compara cada campo
    for (const campo in novo) {
      if (camposIgnorados.includes(campo)) {
        continue
      }

      if (JSON.stringify(anterior[campo]) !== JSON.stringify(novo[campo])) {
        campos.push(campo)
      }
    }

    return campos
  }

  /**
   * Formata valor para exibição no log
   */
  formatarValor(valor: any): string {
    if (valor === null || valor === undefined) {
      return 'N/A'
    }

    if (typeof valor === 'object') {
      return JSON.stringify(valor)
    }

    return String(valor)
  }

  /**
   * Sanitiza dados sensíveis antes de registrar
   * (Remove senhas, tokens, etc)
   */
  sanitizarDadosSensiveis(dados: any): any {
    const camposSensiveis = ['password', 'senha', 'token', 'secret']

    const dadosSanitizados = { ...dados }

    for (const campo of camposSensiveis) {
      if (campo in dadosSanitizados) {
        dadosSanitizados[campo] = '[REDACTED]'
      }
    }

    return dadosSanitizados
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface RegistroAuditoria {
  tipoEntidade: string
  entidadeId: string
  tipoMudanca: TipoMudanca
  campoAlterado?: string
  valorAnterior?: any
  valorNovo?: any
  usuarioId: string
}
