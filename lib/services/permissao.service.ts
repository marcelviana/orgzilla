import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Usuario, TipoPerfil } from '@/lib/types'
import { TimeRepository, PessoaRepository } from '@/lib/repositories'

/**
 * Permissao Service
 *
 * Service para controle de permissões do sistema.
 *
 * REGRAS:
 * - Admin: pode tudo EXCETO ver salários
 * - Gestor: pode ver/editar apenas sua hierarquia + PODE ver salários
 * - Visualizador: apenas visualizar (não sensível)
 */
export class PermissaoService {
  private supabase: SupabaseClient<Database>
  private timeRepo: TimeRepository
  private pessoaRepo: PessoaRepository

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.timeRepo = new TimeRepository(supabase)
    this.pessoaRepo = new PessoaRepository(supabase)
  }

  // ==========================================================================
  // PERMISSÕES GERAIS
  // ==========================================================================

  /**
   * Verifica se usuário pode criar uma entidade
   */
  podeCriar(usuario: Usuario, entidade: TipoEntidade): boolean {
    // Visualizador não pode criar nada
    if (usuario.tipo_perfil === 'visualizador') {
      return false
    }

    // Admin e Gestor podem criar
    return true
  }

  /**
   * Verifica se usuário pode editar uma entidade
   */
  async podeEditar(usuario: Usuario, entidade: TipoEntidade, entidadeId: string): Promise<boolean> {
    // Visualizador não pode editar
    if (usuario.tipo_perfil === 'visualizador') {
      return false
    }

    // Admin pode editar tudo
    if (usuario.tipo_perfil === 'admin') {
      return true
    }

    // Gestor: apenas sua hierarquia
    if (usuario.tipo_perfil === 'gestor') {
      return await this.pertenceHierarquia(usuario, entidade, entidadeId)
    }

    return false
  }

  /**
   * Verifica se usuário pode visualizar uma entidade
   */
  async podeVer(usuario: Usuario, entidade: TipoEntidade, entidadeId: string): Promise<boolean> {
    // Admin pode ver tudo
    if (usuario.tipo_perfil === 'admin') {
      return true
    }

    // Gestor: apenas sua hierarquia
    if (usuario.tipo_perfil === 'gestor') {
      return await this.pertenceHierarquia(usuario, entidade, entidadeId)
    }

    // Visualizador: pode ver tudo (exceto dados sensíveis)
    if (usuario.tipo_perfil === 'visualizador') {
      return true
    }

    return false
  }

  /**
   * Verifica se usuário pode deletar uma entidade
   */
  async podeDeletar(usuario: Usuario, entidade: TipoEntidade, entidadeId: string): Promise<boolean> {
    // Apenas Admin e Gestor podem deletar
    return await this.podeEditar(usuario, entidade, entidadeId)
  }

  // ==========================================================================
  // PERMISSÕES ESPECÍFICAS - DADOS SENSÍVEIS (LGPD)
  // ==========================================================================

  /**
   * Verifica se usuário pode ver dados salariais
   *
   * LGPD: Apenas gestores podem ver salários (de sua hierarquia)
   */
  async podeVerSalario(usuario: Usuario, pessoaId: string): Promise<boolean> {
    // Admin NÃO pode ver salários (LGPD)
    if (usuario.tipo_perfil === 'admin') {
      return false
    }

    // Visualizador NÃO pode ver salários
    if (usuario.tipo_perfil === 'visualizador') {
      return false
    }

    // Gestor: apenas de sua hierarquia
    if (usuario.tipo_perfil === 'gestor') {
      return await this.pertenceHierarquia(usuario, 'pessoa', pessoaId)
    }

    return false
  }

  /**
   * Verifica se usuário pode editar dados salariais
   */
  async podeEditarSalario(usuario: Usuario, pessoaId: string): Promise<boolean> {
    // Apenas gestores podem editar salários (de sua hierarquia)
    if (usuario.tipo_perfil === 'gestor') {
      return await this.pertenceHierarquia(usuario, 'pessoa', pessoaId)
    }

    return false
  }

  // ==========================================================================
  // PERMISSÕES DE HIERARQUIA
  // ==========================================================================

  /**
   * Verifica se uma entidade pertence à hierarquia do gestor
   */
  async pertenceHierarquia(usuario: Usuario, entidade: TipoEntidade, entidadeId: string): Promise<boolean> {
    // Se não for gestor, não tem hierarquia
    if (usuario.tipo_perfil !== 'gestor') {
      return false
    }

    // Busca pessoa do usuário para pegar time que ele gerencia
    if (!usuario.pessoa_id) {
      return false
    }

    try {
      // Busca times que o usuário gerencia
      const timesGerenciados = await this.timeRepo.findByGestorId(usuario.pessoa_id)

      if (timesGerenciados.length === 0) {
        return false
      }

      // Busca todos os IDs da hierarquia (time + subtimes)
      const hierarquiaIds: string[] = []

      for (const time of timesGerenciados) {
        const ids = await this.getHierarquiaCompleta(time.id)
        hierarquiaIds.push(...ids)
      }

      // Remove duplicatas
      const hierarquiaIdsUnicos = [...new Set(hierarquiaIds)]

      // Verifica se entidade pertence à hierarquia
      if (entidade === 'time') {
        return hierarquiaIdsUnicos.includes(entidadeId)
      }

      if (entidade === 'pessoa') {
        const pessoa = await this.pessoaRepo.findById(entidadeId)
        if (!pessoa || !pessoa.time_id) {
          return false
        }
        return hierarquiaIdsUnicos.includes(pessoa.time_id)
      }

      return false
    } catch (error) {
      console.error('[PermissaoService] Erro ao verificar hierarquia:', error)
      return false
    }
  }

  /**
   * Busca todos os IDs da subárvore de um time (o próprio time + descendentes),
   * recursivamente.
   *
   * ⚠️ FONTE ÚNICA da recursão de hierarquia de times no projeto. Não duplique
   * esta lógica em Actions/outros Services — reutilize este método (ou
   * `getTimesHierarquia` / `TimeService.buscarDescendentes`, que o reaproveitam).
   *
   * Protegido contra ciclos em `time_pai_id` por um conjunto de visitados.
   */
  async getHierarquiaCompleta(timeId: string): Promise<string[]> {
    const visitados = new Set<string>()
    await this.coletarSubarvore(timeId, visitados)
    return [...visitados]
  }

  /**
   * Coletor recursivo da subárvore, com proteção contra ciclos.
   */
  private async coletarSubarvore(timeId: string, visitados: Set<string>): Promise<void> {
    // Proteção contra ciclos: se já visitamos este time, para.
    if (visitados.has(timeId)) {
      return
    }
    visitados.add(timeId)

    try {
      const filhos = await this.timeRepo.findByTimePaiId(timeId)
      for (const filho of filhos) {
        await this.coletarSubarvore(filho.id, visitados)
      }
    } catch (error) {
      console.error('[PermissaoService] Erro ao buscar hierarquia:', error)
    }
  }

  /**
   * Busca todos os times da hierarquia do gestor.
   *
   * Regra de negócio: o gestor enxerga os times que **ele gerencia**
   * (`time.gestor_id` = sua pessoa) e todos os descendentes. Não é o time em
   * que ele é membro.
   */
  async getTimesHierarquia(usuario: Usuario): Promise<string[]> {
    if (usuario.tipo_perfil !== 'gestor' || !usuario.pessoa_id) {
      return []
    }

    try {
      const timesGerenciados = await this.timeRepo.findByGestorId(usuario.pessoa_id)

      // Conjunto compartilhado: deduplica e protege contra ciclos entre raízes.
      const visitados = new Set<string>()
      for (const time of timesGerenciados) {
        await this.coletarSubarvore(time.id, visitados)
      }

      return [...visitados]
    } catch (error) {
      console.error('[PermissaoService] Erro ao buscar times da hierarquia:', error)
      return []
    }
  }

  // ==========================================================================
  // PERMISSÕES ESPECÍFICAS POR ENTIDADE
  // ==========================================================================

  /**
   * Verifica se usuário pode gerenciar usuários do sistema
   */
  podeGerenciarUsuarios(usuario: Usuario): boolean {
    // Apenas Admin pode gerenciar usuários
    return usuario.tipo_perfil === 'admin'
  }

  /**
   * Verifica se usuário pode gerenciar configurações do sistema
   * (Níveis, Trilhas, Cargos)
   */
  podeGerenciarConfiguracoes(usuario: Usuario): boolean {
    // Apenas Admin pode gerenciar configurações
    return usuario.tipo_perfil === 'admin'
  }

  /**
   * Verifica se usuário pode criar tags
   */
  podeCriarTags(usuario: Usuario): boolean {
    // Admin e Gestor podem criar tags
    return usuario.tipo_perfil === 'admin' || usuario.tipo_perfil === 'gestor'
  }

  /**
   * Verifica se usuário pode ver logs de auditoria
   */
  async podeVerAuditoria(usuario: Usuario, entidade?: TipoEntidade, entidadeId?: string): Promise<boolean> {
    // Admin pode ver toda auditoria
    if (usuario.tipo_perfil === 'admin') {
      return true
    }

    // Gestor pode ver auditoria de sua hierarquia
    if (usuario.tipo_perfil === 'gestor' && entidade && entidadeId) {
      return await this.pertenceHierarquia(usuario, entidade, entidadeId)
    }

    // Visualizador não pode ver auditoria
    return false
  }

  /**
   * Verifica se usuário pode exportar dados
   */
  async podeExportar(usuario: Usuario): Promise<boolean> {
    // Apenas Admin e Gestor podem exportar
    return usuario.tipo_perfil === 'admin' || usuario.tipo_perfil === 'gestor'
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Retorna uma mensagem de erro de permissão
   */
  getMensagemErroPermissao(usuario: Usuario, acao: string): string {
    const mensagens: Record<TipoPerfil, string> = {
      admin: `Você não tem permissão para ${acao}.`,
      gestor: `Você só pode ${acao} itens de sua hierarquia.`,
      visualizador: `Visualizadores não podem ${acao}.`,
    }

    return mensagens[usuario.tipo_perfil] || 'Você não tem permissão para esta ação.'
  }
}

// =============================================================================
// TYPES
// =============================================================================

export type TipoEntidade = 'pessoa' | 'time'

export interface PermissaoResult {
  permitido: boolean
  mensagem?: string
}
