/**
 * Central Types Export - Orgzilla
 *
 * Este arquivo centraliza todos os tipos do projeto para fácil importação.
 *
 * @example
 * ```tsx
 * import type { Pessoa, Time, Cargo, Database } from '@/lib/types'
 * ```
 */

// =============================================================================
// DATABASE TYPES
// =============================================================================

export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  Json,
} from './database'

export type {
  TipoPerfil,
  StatusPessoa,
  TipoMudanca,
  TipoEntidade,
} from './database'

// =============================================================================
// TABLE TYPES (Row)
// =============================================================================

import type { Database } from './database'

// Core tables
export type Usuario = Database['public']['Tables']['usuario']['Row']
export type Nivel = Database['public']['Tables']['nivel']['Row']
export type TrilhaCarreira = Database['public']['Tables']['trilha_carreira']['Row']
export type Cargo = Database['public']['Tables']['cargo']['Row']
export type Time = Database['public']['Tables']['time']['Row']
export type Pessoa = Database['public']['Tables']['pessoa']['Row']

// Remuneração (SENSÍVEL - LGPD: tabela 1:1 com pessoa, acesso só gestor via RLS)
export type PessoaRemuneracao = Database['public']['Tables']['pessoa_remuneracao']['Row']

// Project/Product tables
export type ProjetoProduto = Database['public']['Tables']['projeto_produto']['Row']
export type PessoaProjetoProduto = Database['public']['Tables']['pessoa_projeto_produto']['Row']

// Vacancy table
export type VagaTime = Database['public']['Tables']['vaga_time']['Row']

// Tag tables
export type Tag = Database['public']['Tables']['tag']['Row']
export type PessoaTag = Database['public']['Tables']['pessoa_tag']['Row']

// Annotation table
export type Anotacao = Database['public']['Tables']['anotacao']['Row']

// History tables
export type HistoricoMudanca = Database['public']['Tables']['historico_mudanca']['Row']
export type HistoricoReajuste = Database['public']['Tables']['historico_reajuste']['Row']
export type HistoricoTime = Database['public']['Tables']['historico_time']['Row']
export type HistoricoCargo = Database['public']['Tables']['historico_cargo']['Row']

// =============================================================================
// INSERT TYPES
// =============================================================================

export type UsuarioInsert = Database['public']['Tables']['usuario']['Insert']
export type NivelInsert = Database['public']['Tables']['nivel']['Insert']
export type TrilhaCarreiraInsert = Database['public']['Tables']['trilha_carreira']['Insert']
export type CargoInsert = Database['public']['Tables']['cargo']['Insert']
export type TimeInsert = Database['public']['Tables']['time']['Insert']
export type PessoaInsert = Database['public']['Tables']['pessoa']['Insert']
export type PessoaRemuneracaoInsert = Database['public']['Tables']['pessoa_remuneracao']['Insert']
export type ProjetoProdutoInsert = Database['public']['Tables']['projeto_produto']['Insert']
export type PessoaProjetoProdutoInsert = Database['public']['Tables']['pessoa_projeto_produto']['Insert']
export type VagaTimeInsert = Database['public']['Tables']['vaga_time']['Insert']
export type TagInsert = Database['public']['Tables']['tag']['Insert']
export type PessoaTagInsert = Database['public']['Tables']['pessoa_tag']['Insert']
export type AnotacaoInsert = Database['public']['Tables']['anotacao']['Insert']

// =============================================================================
// UPDATE TYPES
// =============================================================================

export type UsuarioUpdate = Database['public']['Tables']['usuario']['Update']
export type NivelUpdate = Database['public']['Tables']['nivel']['Update']
export type TrilhaCarreiraUpdate = Database['public']['Tables']['trilha_carreira']['Update']
export type CargoUpdate = Database['public']['Tables']['cargo']['Update']
export type TimeUpdate = Database['public']['Tables']['time']['Update']
export type PessoaUpdate = Database['public']['Tables']['pessoa']['Update']
export type PessoaRemuneracaoUpdate = Database['public']['Tables']['pessoa_remuneracao']['Update']
export type ProjetoProdutoUpdate = Database['public']['Tables']['projeto_produto']['Update']
export type PessoaProjetoProdutoUpdate = Database['public']['Tables']['pessoa_projeto_produto']['Update']
export type VagaTimeUpdate = Database['public']['Tables']['vaga_time']['Update']
export type TagUpdate = Database['public']['Tables']['tag']['Update']
export type PessoaTagUpdate = Database['public']['Tables']['pessoa_tag']['Update']
export type AnotacaoUpdate = Database['public']['Tables']['anotacao']['Update']

// =============================================================================
// TYPES WITH RELATIONSHIPS (for queries with joins)
// =============================================================================

/**
 * Pessoa com relacionamentos expandidos
 */
export interface PessoaComRelacionamentos extends Pessoa {
  cargo?: Cargo & {
    trilha?: TrilhaCarreira
    nivel?: Nivel
  }
  time?: Time & {
    gestor?: Pessoa
    time_pai?: Time
  }
  tags?: Tag[]
  projetos?: (PessoaProjetoProduto & {
    projeto_produto?: ProjetoProduto
  })[]
  historico_cargos?: HistoricoCargo[]
  historico_times?: HistoricoTime[]
}

/**
 * Time com relacionamentos expandidos
 */
export interface TimeComRelacionamentos extends Time {
  gestor?: Pessoa
  time_pai?: Time
  times_filhos?: Time[]
  membros?: Pessoa[]
  vagas?: (VagaTime & {
    cargo?: Cargo & {
      trilha?: TrilhaCarreira
      nivel?: Nivel
    }
  })[]
}

/**
 * Cargo com relacionamentos expandidos
 */
export interface CargoComRelacionamentos extends Cargo {
  trilha: TrilhaCarreira | null
  nivel: Nivel | null
}

/**
 * Projeto/Produto com relacionamentos expandidos
 */
export interface ProjetoProdutoComRelacionamentos extends ProjetoProduto {
  pessoas?: (PessoaProjetoProduto & {
    pessoa?: Pessoa & {
      cargo?: Cargo
      time?: Time
    }
  })[]
}

/**
 * Usuário com relacionamentos expandidos
 */
export interface UsuarioComRelacionamentos extends Usuario {
  pessoa?: Pessoa & {
    cargo?: Cargo
    time?: Time
  }
}

// =============================================================================
// FORM TYPES (for React Hook Form)
// =============================================================================

/**
 * Form data para criação/edição de pessoa
 */
export interface PessoaFormData {
  // Dados pessoais
  nome: string
  nome_social?: string
  email_corporativo?: string
  email_pessoal?: string
  telefone?: string
  foto_url?: string

  // Dados profissionais
  cargo_id?: string
  time_id?: string
  data_entrada?: string
  data_inicio_cargo_atual?: string
  status: StatusPessoa

  // Dados salariais (SENSITIVE - apenas gestores)
  salario_atual?: number
  data_ultimo_reajuste?: string
  motivo_ultimo_reajuste?: string

  // Projetos
  projetos?: string[] // IDs de projetos

  // Tags
  tags?: string[] // IDs de tags
}

/**
 * Form data para criação/edição de time
 */
export interface TimeFormData {
  nome: string
  descricao?: string
  time_pai_id?: string
  gestor_id?: string
}

/**
 * Form data para criação/edição de projeto
 */
export interface ProjetoProdutoFormData {
  nome: string
  pessoas?: Array<{
    pessoa_id: string
    data_inicio: string
    data_fim?: string
  }>
}

/**
 * Form data para criação/edição de cargo
 */
export interface CargoFormData {
  nome: string
  trilha_id: string
  nivel_id: string
}

/**
 * Form data para criação/edição de trilha de carreira
 */
export interface TrilhaCarreiraFormData {
  nome: string
  descricao?: string
}

/**
 * Form data para criação/edição de tag
 */
export interface TagFormData {
  nome: string
  cor: string
}

/**
 * Form data para criação/edição de usuário
 */
export interface UsuarioFormData {
  email: string
  nome: string
  tipo_perfil: TipoPerfil
  pessoa_id?: string
}

/**
 * Form data para criação de anotação
 */
export interface AnotacaoFormData {
  tipo_entidade: TipoEntidade
  entidade_id: string
  conteudo: string
}

// =============================================================================
// FILTER TYPES (for list pages)
// =============================================================================

/**
 * Filtros para lista de pessoas
 */
export interface PessoaFilters {
  busca?: string
  time_id?: string
  cargo_id?: string
  trilha_id?: string
  nivel_id?: string
  status?: StatusPessoa
  tags?: string[]
  projeto_id?: string
}

/**
 * Filtros para lista de times
 */
export interface TimeFilters {
  busca?: string
  time_pai_id?: string
  gestor_id?: string
  com_vagas?: boolean
}

/**
 * Filtros para lista de projetos
 */
export interface ProjetoProdutoFilters {
  busca?: string
  com_pessoas?: boolean
}

/**
 * Filtros para auditoria
 */
export interface AuditoriaFilters {
  tipo_entidade?: string
  entidade_id?: string
  tipo_mudanca?: TipoMudanca
  usuario_id?: string
  data_inicio?: string
  data_fim?: string
}

// =============================================================================
// RESPONSE TYPES (for API responses)
// =============================================================================

/**
 * Response padrão de API
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

/**
 * Response de lista paginada
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// =============================================================================
// PERMISSION TYPES
// =============================================================================

/**
 * Contexto de permissões do usuário
 */
export interface PermissionContext {
  usuario: Usuario
  pessoa?: Pessoa
  tipo_perfil: TipoPerfil
  hierarquia_ids?: string[] // IDs dos times na hierarquia (para gestores)
}

/**
 * Resultado de verificação de permissão
 */
export interface PermissionCheck {
  allowed: boolean
  reason?: string
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Tipo para seleção de opções (dropdowns, selects)
 */
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Tipo para estatísticas do dashboard
 */
export interface DashboardStats {
  total_pessoas: number
  total_times: number
  total_projetos: number
  total_vagas: number
  pessoas_por_status: Record<StatusPessoa, number>
  pessoas_por_nivel: Record<string, number>
  crescimento_mes: {
    pessoas: number
    projetos: number
  }
}

/**
 * Tipo para item de organograma
 */
export interface OrgChartNode {
  id: string
  nome: string
  cargo?: string
  foto_url?: string
  children?: OrgChartNode[]
  isGestor?: boolean
  metadata?: Record<string, unknown>
}
