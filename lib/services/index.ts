/**
 * Services Export - Orgzilla
 *
 * Este arquivo centraliza todos os services para fácil importação.
 * Services contêm TODA a lógica de negócio do sistema.
 *
 * @example
 * ```tsx
 * import { AuthService, PessoaService } from '@/lib/services'
 * ```
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

// =============================================================================
// SERVICES
// =============================================================================

export { AuthService } from './auth.service'
export type { AuthResult, UsuarioLogado } from './auth.service'

export { PermissaoService } from './permissao.service'
export type { TipoEntidade, PermissaoResult } from './permissao.service'

export { AuditoriaService } from './auditoria.service'
export type { RegistroAuditoria } from './auditoria.service'

export { HistoricoService } from './historico.service'

export { PessoaService } from './pessoa.service'
export type { ServiceResult } from './pessoa.service'

export { TimeService } from './time.service'
export type { TimeComHierarquia } from './time.service'

export { VagaService } from './vaga.service'

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

import { AuthService } from './auth.service'
import { PermissaoService } from './permissao.service'
import { AuditoriaService } from './auditoria.service'
import { HistoricoService } from './historico.service'
import { PessoaService } from './pessoa.service'
import { TimeService } from './time.service'
import { VagaService } from './vaga.service'

/**
 * Cria todas as instâncias de services
 *
 * @example
 * ```tsx
 * import { createClient } from '@/lib/supabase/server'
 * import { createServices } from '@/lib/services'
 *
 * const supabase = await createClient()
 * const services = createServices(supabase)
 *
 * // Usar services
 * const usuario = await services.auth.getUsuarioLogado()
 * const pessoas = await services.pessoa.buscarComPermissao(usuario)
 * ```
 */
export function createServices(supabase: SupabaseClient<Database>) {
  return {
    // Autenticação
    auth: new AuthService(supabase),

    // Permissões
    permissao: new PermissaoService(supabase),

    // Auditoria
    auditoria: new AuditoriaService(supabase),

    // Histórico
    historico: new HistoricoService(supabase),

    // Entidades
    pessoa: new PessoaService(supabase),
    time: new TimeService(supabase),
    vaga: new VagaService(supabase),
  }
}

/**
 * Type helper para os services
 */
export type Services = ReturnType<typeof createServices>
