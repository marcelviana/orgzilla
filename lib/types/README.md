# 🦖 Types - Orgzilla

Sistema de tipos TypeScript para o Orgzilla, incluindo tipos do banco de dados Supabase e tipos auxiliares.

## 📁 Estrutura

```
lib/types/
├── database.ts   # Tipos gerados do banco Supabase (16 tabelas)
├── index.ts      # Exports centralizados + tipos auxiliares
└── README.md     # Este arquivo
```

## 🚀 Como Usar

### Importação Simples

Importe todos os tipos de um único lugar:

```tsx
import type {
  // Database types
  Pessoa,
  Time,
  Cargo,
  TrilhaCarreira,
  ProjetoProduto,
  Usuario,

  // Enums
  TipoPerfil,
  StatusPessoa,

  // Types with relationships
  PessoaComRelacionamentos,
  TimeComRelacionamentos,

  // Form types
  PessoaFormData,
  TimeFormData,

  // Supabase Database type
  Database,
} from '@/lib/types'
```

## 📊 Tipos Disponíveis

### 1. Tipos de Tabelas (Row)

Tipos básicos das tabelas do banco:

```tsx
import type { Pessoa, Time, Cargo } from '@/lib/types'

const pessoa: Pessoa = {
  id: '...',
  nome: 'João Silva',
  email_corporativo: 'joao@empresa.com',
  cargo_id: '...',
  time_id: '...',
  status: 'ativo',
  // ... outros campos
}
```

**Tabelas disponíveis:**
- `Usuario` - Usuários do sistema
- `Nivel` - Níveis hierárquicos (L1-L16)
- `TrilhaCarreira` - Trilhas de carreira
- `Cargo` - Cargos (posição = trilha + nível)
- `Time` - Times/departamentos
- `Pessoa` - Pessoas/colaboradores
- `ProjetoProduto` - Projetos e produtos
- `PessoaProjetoProduto` - Alocações de pessoas em projetos
- `VagaTime` - Vagas abertas em times
- `Tag` - Tags customizadas
- `PessoaTag` - Relacionamento pessoa-tag
- `Anotacao` - Anotações sobre pessoas/times
- `HistoricoMudanca` - Auditoria de mudanças
- `HistoricoReajuste` - Histórico de reajustes salariais
- `HistoricoTime` - Histórico de times
- `HistoricoCargo` - Histórico de cargos

### 2. Tipos de Insert

Para inserção de dados (campos opcionais):

```tsx
import type { PessoaInsert } from '@/lib/types'

const novaPessoa: PessoaInsert = {
  nome: 'Maria Santos',
  email_corporativo: 'maria@empresa.com',
  status: 'ativo',
  // id, created_at, updated_at são automáticos
}

const { data, error } = await supabase
  .from('pessoa')
  .insert(novaPessoa)
```

**Insert types disponíveis:**
- `UsuarioInsert`
- `NivelInsert`
- `TrilhaCarreiraInsert`
- `CargoInsert`
- `TimeInsert`
- `PessoaInsert`
- `ProjetoProdutoInsert`
- `PessoaProjetoProdutoInsert`
- `VagaTimeInsert`
- `TagInsert`
- `PessoaTagInsert`
- `AnotacaoInsert`

### 3. Tipos de Update

Para atualização de dados (todos os campos opcionais):

```tsx
import type { PessoaUpdate } from '@/lib/types'

const atualizacao: PessoaUpdate = {
  telefone: '(11) 98765-4321',
  updated_at: new Date().toISOString(),
}

const { data, error } = await supabase
  .from('pessoa')
  .update(atualizacao)
  .eq('id', pessoaId)
```

**Update types disponíveis:**
- `UsuarioUpdate`
- `NivelUpdate`
- `TrilhaCarreiraUpdate`
- `CargoUpdate`
- `TimeUpdate`
- `PessoaUpdate`
- `ProjetoProdutoUpdate`
- `PessoaProjetoProdutoUpdate`
- `VagaTimeUpdate`
- `TagUpdate`
- `PessoaTagUpdate`
- `AnotacaoUpdate`

### 4. Tipos com Relacionamentos

Para queries com joins:

```tsx
import type { PessoaComRelacionamentos } from '@/lib/types'

const { data } = await supabase
  .from('pessoa')
  .select(`
    *,
    cargo:cargo_id (
      *,
      trilha:trilha_id (*),
      nivel:nivel_id (*)
    ),
    time:time_id (
      *,
      gestor:gestor_id (*),
      time_pai:time_pai_id (*)
    ),
    tags:pessoa_tag (
      tag:tag_id (*)
    )
  `)
  .eq('id', pessoaId)
  .single()

const pessoa = data as PessoaComRelacionamentos
console.log(pessoa.cargo?.trilha?.nome) // TypeScript sabe o tipo!
```

**Types com relacionamentos:**
- `PessoaComRelacionamentos`
- `TimeComRelacionamentos`
- `CargoComRelacionamentos`
- `ProjetoProdutoComRelacionamentos`
- `UsuarioComRelacionamentos`

### 5. Form Types (React Hook Form)

Para formulários com validação:

```tsx
import type { PessoaFormData } from '@/lib/types'
import { useForm } from 'react-hook-form'

export function PessoaForm() {
  const form = useForm<PessoaFormData>({
    defaultValues: {
      nome: '',
      status: 'ativo',
    }
  })

  async function onSubmit(data: PessoaFormData) {
    // TypeScript valida os campos automaticamente
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

**Form types disponíveis:**
- `PessoaFormData`
- `TimeFormData`
- `ProjetoProdutoFormData`
- `CargoFormData`
- `TrilhaCarreiraFormData`
- `TagFormData`
- `UsuarioFormData`
- `AnotacaoFormData`

### 6. Filter Types

Para filtros em listas:

```tsx
import type { PessoaFilters } from '@/lib/types'

const filtros: PessoaFilters = {
  busca: 'João',
  time_id: '...',
  status: 'ativo',
  tags: ['tag1', 'tag2'],
}

// Use os filtros para construir a query
const query = supabase.from('pessoa').select('*')

if (filtros.busca) {
  query.ilike('nome', `%${filtros.busca}%`)
}

if (filtros.time_id) {
  query.eq('time_id', filtros.time_id)
}

// ... etc
```

**Filter types disponíveis:**
- `PessoaFilters`
- `TimeFilters`
- `ProjetoProdutoFilters`
- `AuditoriaFilters`

### 7. Enums

Tipos enumerados para campos específicos:

```tsx
import type { TipoPerfil, StatusPessoa } from '@/lib/types'

const perfil: TipoPerfil = 'admin' // ou 'gestor' ou 'visualizador'
const status: StatusPessoa = 'ativo' // ou 'ferias', 'licenca', etc
```

**Enums disponíveis:**
- `TipoPerfil` - 'admin' | 'gestor' | 'visualizador'
- `StatusPessoa` - 'ativo' | 'ferias' | 'licenca' | 'afastamento' | 'desligado'
- `TipoMudanca` - 'criacao' | 'edicao' | 'exclusao'
- `TipoEntidade` - 'pessoa' | 'time'

### 8. Utility Types

Tipos auxiliares para o aplicativo:

```tsx
import type { SelectOption, DashboardStats } from '@/lib/types'

// Para dropdowns/selects
const opcoes: SelectOption[] = [
  { value: '1', label: 'Opção 1' },
  { value: '2', label: 'Opção 2', disabled: true },
]

// Para estatísticas do dashboard
const stats: DashboardStats = {
  total_pessoas: 120,
  total_times: 15,
  total_projetos: 8,
  total_vagas: 5,
  pessoas_por_status: {
    ativo: 100,
    ferias: 10,
    licenca: 5,
    afastamento: 2,
    desligado: 3,
  },
  // ... etc
}
```

**Utility types disponíveis:**
- `SelectOption` - Para dropdowns
- `DashboardStats` - Estatísticas do dashboard
- `OrgChartNode` - Nó do organograma
- `ApiResponse<T>` - Response padrão de API
- `PaginatedResponse<T>` - Response paginado
- `PermissionContext` - Contexto de permissões
- `PermissionCheck` - Resultado de verificação

### 9. Database Type (Supabase)

Tipo completo do banco para uso com Supabase client:

```tsx
import type { Database } from '@/lib/types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Agora o Supabase client tem tipagem completa!
const { data } = await supabase
  .from('pessoa') // TypeScript sabe que 'pessoa' existe
  .select('*') // TypeScript sabe os campos de Pessoa
```

## 🔄 Regenerar Tipos Automaticamente

Quando o schema do banco mudar, regenere os tipos:

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Faça login no Supabase CLI
npx supabase login

# 2. Gere os tipos
npx supabase gen types typescript --project-id tjkiwuhctveyyxcemtqu > lib/types/database.ts
```

### Opção 2: Manualmente

Edite `lib/types/database.ts` baseado nas mudanças no schema.

## 📝 Convenções

### Nomenclatura

- **Tabelas**: snake_case (`pessoa`, `trilha_carreira`)
- **Tipos**: PascalCase (`Pessoa`, `TrilhaCarreira`)
- **Campos**: snake_case (`nome_social`, `data_entrada`)
- **Enums**: PascalCase para o tipo, lowercase para valores

### Campos Sensíveis (LGPD)

Campos marcados como SENSITIVE são protegidos:

```tsx
// ⚠️ SENSITIVE - Apenas gestores podem ver
pessoa.salario_atual
pessoa.data_ultimo_reajuste
pessoa.motivo_ultimo_reajuste

// Todas as tabelas de historico_reajuste
```

Sempre verifique permissões antes de exibir esses dados!

### Campos Nullable

Campos com `| null` podem ser nulos. Use optional chaining:

```tsx
const email = pessoa.email_corporativo ?? 'Não informado'
const cargo = pessoa.cargo?.nome ?? 'Sem cargo'
```

## 🎯 Exemplos Práticos

### Server Component com Tipos

```tsx
import { createClient } from '@/lib/supabase/server'
import type { PessoaComRelacionamentos } from '@/lib/types'

export default async function PessoaPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: pessoa } = await supabase
    .from('pessoa')
    .select(`
      *,
      cargo:cargo_id (*),
      time:time_id (*)
    `)
    .eq('id', params.id)
    .single()

  const pessoaComRelacionamentos = pessoa as PessoaComRelacionamentos

  return (
    <div>
      <h1>{pessoaComRelacionamentos.nome}</h1>
      <p>{pessoaComRelacionamentos.cargo?.nome}</p>
      <p>{pessoaComRelacionamentos.time?.nome}</p>
    </div>
  )
}
```

### Client Component com Form

```tsx
'use client'

import { useForm } from 'react-hook-form'
import type { TimeFormData } from '@/lib/types'

export function TimeForm() {
  const form = useForm<TimeFormData>()

  async function onSubmit(data: TimeFormData) {
    const response = await fetch('/api/times', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('nome')} />
      <textarea {...form.register('descricao')} />
      <button type="submit">Salvar</button>
    </form>
  )
}
```

### Server Action com Tipos

```tsx
'use server'

import { createClient } from '@/lib/supabase/server'
import type { PessoaInsert, PessoaUpdate } from '@/lib/types'

export async function createPessoa(data: PessoaInsert) {
  const supabase = await createClient()

  const { data: pessoa, error } = await supabase
    .from('pessoa')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return pessoa
}

export async function updatePessoa(id: string, data: PessoaUpdate) {
  const supabase = await createClient()

  const { data: pessoa, error } = await supabase
    .from('pessoa')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return pessoa
}
```

## 📚 Referências

- [Database Schema](../../CLAUDE.md#-database-schema-16-tables) - Especificação completa das tabelas
- [Supabase TypeScript Support](https://supabase.com/docs/guides/api/rest/generating-types)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**🦖 Orgzilla** - Sistema de Gestão de Times
