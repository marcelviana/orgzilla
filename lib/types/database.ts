/**
 * Database Types - Orgzilla
 *
 * Tipos TypeScript gerados para o banco de dados Supabase.
 * Baseado na especificação de 16 tabelas do sistema.
 *
 * Para regenerar automaticamente:
 * npx supabase login
 * npx supabase gen types typescript --project-id tjkiwuhctveyyxcemtqu > lib/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =============================================================================
// ENUMS / TIPOS CUSTOMIZADOS
// =============================================================================

export type TipoPerfil = 'admin' | 'gestor' | 'visualizador'

export type StatusPessoa = 'ativo' | 'ferias' | 'licenca' | 'afastamento' | 'desligado'

export type TipoMudanca = 'criacao' | 'edicao' | 'exclusao'

export type TipoEntidade = 'pessoa' | 'time'

// =============================================================================
// DATABASE SCHEMA
// =============================================================================

export interface Database {
  public: {
    Tables: {
      // CORE TABLES
      usuario: {
        Row: {
          id: string
          email: string
          nome: string
          tipo_perfil: TipoPerfil
          ativo: boolean
          pessoa_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nome: string
          tipo_perfil: TipoPerfil
          ativo?: boolean
          pessoa_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          tipo_perfil?: TipoPerfil
          ativo?: boolean
          pessoa_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'usuario_pessoa_id_fkey'
            columns: ['pessoa_id']
            isOneToOne: false
            referencedRelation: 'pessoa'
            referencedColumns: ['id']
          }
        ]
      }

      nivel: {
        Row: {
          id: string
          nome: string
          nivel_anterior_id: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          nivel_anterior_id?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          nivel_anterior_id?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nivel_nivel_anterior_id_fkey'
            columns: ['nivel_anterior_id']
            isOneToOne: false
            referencedRelation: 'nivel'
            referencedColumns: ['id']
          }
        ]
      }

      trilha_carreira: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      cargo: {
        Row: {
          id: string
          nome: string
          trilha_id: string
          nivel_id: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          trilha_id: string
          nivel_id: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          trilha_id?: string
          nivel_id?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cargo_trilha_id_fkey'
            columns: ['trilha_id']
            isOneToOne: false
            referencedRelation: 'trilha_carreira'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cargo_nivel_id_fkey'
            columns: ['nivel_id']
            isOneToOne: false
            referencedRelation: 'nivel'
            referencedColumns: ['id']
          }
        ]
      }

      time: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          time_pai_id: string | null
          gestor_id: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          time_pai_id?: string | null
          gestor_id?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          time_pai_id?: string | null
          gestor_id?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'time_time_pai_id_fkey'
            columns: ['time_pai_id']
            isOneToOne: false
            referencedRelation: 'time'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'time_gestor_id_fkey'
            columns: ['gestor_id']
            isOneToOne: false
            referencedRelation: 'pessoa'
            referencedColumns: ['id']
          }
        ]
      }

      pessoa: {
        Row: {
          id: string
          nome: string
          nome_social: string | null
          email_corporativo: string | null
          email_pessoal: string | null
          telefone: string | null
          foto_url: string | null
          cargo_id: string | null
          time_id: string | null
          data_entrada: string | null
          data_inicio_cargo_atual: string | null
          data_desligamento: string | null
          status: StatusPessoa
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          nome_social?: string | null
          email_corporativo?: string | null
          email_pessoal?: string | null
          telefone?: string | null
          foto_url?: string | null
          cargo_id?: string | null
          time_id?: string | null
          data_entrada?: string | null
          data_inicio_cargo_atual?: string | null
          data_desligamento?: string | null
          status?: StatusPessoa
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          nome_social?: string | null
          email_corporativo?: string | null
          email_pessoal?: string | null
          telefone?: string | null
          foto_url?: string | null
          cargo_id?: string | null
          time_id?: string | null
          data_entrada?: string | null
          data_inicio_cargo_atual?: string | null
          data_desligamento?: string | null
          status?: StatusPessoa
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pessoa_cargo_id_fkey'
            columns: ['cargo_id']
            isOneToOne: false
            referencedRelation: 'cargo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pessoa_time_id_fkey'
            columns: ['time_id']
            isOneToOne: false
            referencedRelation: 'time'
            referencedColumns: ['id']
          }
        ]
      }

      // SENSÍVEL - LGPD: tabela 1:1 com pessoa, protegida por RLS (apenas gestor)
      pessoa_remuneracao: {
        Row: {
          pessoa_id: string
          salario_atual: number | null // SENSITIVE - LGPD
          data_ultimo_reajuste: string | null // SENSITIVE - LGPD
          motivo_ultimo_reajuste: string | null // SENSITIVE - LGPD
          created_at: string
          updated_at: string
        }
        Insert: {
          pessoa_id: string
          salario_atual?: number | null
          data_ultimo_reajuste?: string | null
          motivo_ultimo_reajuste?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          pessoa_id?: string
          salario_atual?: number | null
          data_ultimo_reajuste?: string | null
          motivo_ultimo_reajuste?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pessoa_remuneracao_pessoa_id_fkey'
            columns: ['pessoa_id']
            isOneToOne: true
            referencedRelation: 'pessoa'
            referencedColumns: ['id']
          }
        ]
      }

      projeto_produto: {
        Row: {
          id: string
          nome: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      pessoa_projeto_produto: {
        Row: {
          id: string
          pessoa_id: string
          projeto_produto_id: string
          data_inicio: string
          data_fim: string | null
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pessoa_id: string
          projeto_produto_id: string
          data_inicio: string
          data_fim?: string | null
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pessoa_id?: string
          projeto_produto_id?: string
          data_inicio?: string
          data_fim?: string | null
          ativo?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pessoa_projeto_produto_pessoa_id_fkey'
            columns: ['pessoa_id']
            isOneToOne: false
            referencedRelation: 'pessoa'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pessoa_projeto_produto_projeto_produto_id_fkey'
            columns: ['projeto_produto_id']
            isOneToOne: false
            referencedRelation: 'projeto_produto'
            referencedColumns: ['id']
          }
        ]
      }

      vaga_time: {
        Row: {
          id: string
          time_id: string
          cargo_id: string
          quantidade: number
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          time_id: string
          cargo_id: string
          quantidade: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          time_id?: string
          cargo_id?: string
          quantidade?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vaga_time_time_id_fkey'
            columns: ['time_id']
            isOneToOne: false
            referencedRelation: 'time'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vaga_time_cargo_id_fkey'
            columns: ['cargo_id']
            isOneToOne: false
            referencedRelation: 'cargo'
            referencedColumns: ['id']
          }
        ]
      }

      tag: {
        Row: {
          id: string
          nome: string
          cor: string
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          cor: string
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cor?: string
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }

      pessoa_tag: {
        Row: {
          id: string
          pessoa_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          pessoa_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          pessoa_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pessoa_tag_pessoa_id_fkey'
            columns: ['pessoa_id']
            isOneToOne: false
            referencedRelation: 'pessoa'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pessoa_tag_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tag'
            referencedColumns: ['id']
          }
        ]
      }

      anotacao: {
        Row: {
          id: string
          tipo_entidade: TipoEntidade
          entidade_id: string
          conteudo: string
          criado_por_usuario_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tipo_entidade: TipoEntidade
          entidade_id: string
          conteudo: string
          criado_por_usuario_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tipo_entidade?: TipoEntidade
          entidade_id?: string
          conteudo?: string
          criado_por_usuario_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'anotacao_criado_por_usuario_id_fkey'
            columns: ['criado_por_usuario_id']
            isOneToOne: false
            referencedRelation: 'usuario'
            referencedColumns: ['id']
          }
        ]
      }

      // HISTORY TABLES
      historico_mudanca: {
        Row: {
          id: string
          tipo_entidade: string
          entidade_id: string
          tipo_mudanca: TipoMudanca
          campo_alterado: string | null
          valor_anterior: Json | null
          valor_novo: Json | null
          usuario_id: string
          created_at: string
        }
        Insert: {
          id?: string
          tipo_entidade: string
          entidade_id: string
          tipo_mudanca: TipoMudanca
          campo_alterado?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json | null
          usuario_id: string
          created_at?: string
        }
        Update: {
          id?: string
          tipo_entidade?: string
          entidade_id?: string
          tipo_mudanca?: TipoMudanca
          campo_alterado?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json | null
          usuario_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'historico_mudanca_usuario_id_fkey'
            columns: ['usuario_id']
            isOneToOne: false
            referencedRelation: 'usuario'
            referencedColumns: ['id']
          }
        ]
      }

      historico_reajuste: {
        Row: {
          id: string
          pessoa_id: string
          salario_anterior: number | null
          salario_novo: number
          percentual: number | null
          data_reajuste: string
          motivo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pessoa_id: string
          salario_anterior?: number | null
          salario_novo: number
          percentual?: number | null
          data_reajuste: string
          motivo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pessoa_id?: string
          salario_anterior?: number | null
          salario_novo?: number
          percentual?: number | null
          data_reajuste?: string
          motivo?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'historico_reajuste_pessoa_id_fkey'
            columns: ['pessoa_id']
            isOneToOne: false
            referencedRelation: 'pessoa'
            referencedColumns: ['id']
          }
        ]
      }

      historico_time: {
        Row: {
          id: string
          pessoa_id: string
          time_id: string
          data_inicio: string
          data_fim: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pessoa_id: string
          time_id: string
          data_inicio: string
          data_fim?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pessoa_id?: string
          time_id?: string
          data_inicio?: string
          data_fim?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'historico_time_pessoa_id_fkey'
            columns: ['pessoa_id']
            isOneToOne: false
            referencedRelation: 'pessoa'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'historico_time_time_id_fkey'
            columns: ['time_id']
            isOneToOne: false
            referencedRelation: 'time'
            referencedColumns: ['id']
          }
        ]
      }

      historico_cargo: {
        Row: {
          id: string
          pessoa_id: string
          cargo_id: string
          data_inicio: string
          data_fim: string | null
          created_at: string
        }
        Insert: {
          id?: string
          pessoa_id: string
          cargo_id: string
          data_inicio: string
          data_fim?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          pessoa_id?: string
          cargo_id?: string
          data_inicio?: string
          data_fim?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'historico_cargo_pessoa_id_fkey'
            columns: ['pessoa_id']
            isOneToOne: false
            referencedRelation: 'pessoa'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'historico_cargo_cargo_id_fkey'
            columns: ['cargo_id']
            isOneToOne: false
            referencedRelation: 'cargo'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tipo_perfil: TipoPerfil
      status_pessoa: StatusPessoa
      tipo_mudanca: TipoMudanca
      tipo_entidade: TipoEntidade
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =============================================================================
// HELPER TYPES
// =============================================================================

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'])
  ? (Database['public']['Tables'] &
      Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
  ? Database['public']['Enums'][PublicEnumNameOrOptions]
  : never
