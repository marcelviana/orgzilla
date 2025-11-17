# 🦖 Repositories - Orgzilla

Camada de acesso a dados do projeto Orgzilla.

**IMPORTANTE:** Repositories apenas acessam dados (CRUD). **Lógica de negócio vai em Services.**

## 📁 Estrutura

```
lib/repositories/
├── base.repository.ts      # Repository genérico com CRUD básico
├── usuario.repository.ts   # Acesso a dados de usuários
├── pessoa.repository.ts    # Acesso a dados de pessoas
├── time.repository.ts      # Acesso a dados de times
├── nivel.repository.ts     # Acesso a dados de níveis
├── cargo.repository.ts     # Acesso a dados de cargos
├── index.ts                # Exports centralizados
└── README.md               # Este arquivo
```

## 🎯 Arquitetura - Clean Architecture

```
┌─────────────────────────────────────────────┐
│  UI Layer (Components, Pages)              │
├─────────────────────────────────────────────┤
│  Service Layer (Business Logic)            │ ← Lógica de negócio, validações, auditoria
├─────────────────────────────────────────────┤
│  Repository Layer (Data Access)            │ ← APENAS acesso a dados (CRUD)
├─────────────────────────────────────────────┤
│  Database (Supabase/PostgreSQL)            │
└─────────────────────────────────────────────┘
```

### O que vai onde?

**Repository (esta camada):**
- ✅ CRUD básico (create, read, update, delete)
- ✅ Queries simples
- ✅ Filtros e paginação
- ❌ Validações de negócio
- ❌ Cálculos complexos
- ❌ Auditoria
- ❌ Permissões

**Service (próxima camada a ser criada):**
- ✅ Validações de negócio
- ✅ Regras complexas
- ✅ Auditoria (histórico de mudanças)
- ✅ Verificação de permissões
- ✅ Cálculos
- ✅ Orquestração de múltiplos repositories

## 🚀 Como Usar

### 1. Importação

```tsx
import { createClient } from '@/lib/supabase/server'
import { PessoaRepository } from '@/lib/repositories'

// Em Server Component ou Server Action
const supabase = await createClient()
const pessoaRepo = new PessoaRepository(supabase)
```

### 2. Operações Básicas (herdadas de BaseRepository)

Todos os repositories herdam estes métodos:

#### findById
```tsx
const pessoa = await pessoaRepo.findById('uuid-aqui')
// Retorna: Pessoa | null
```

#### findAll
```tsx
const pessoas = await pessoaRepo.findAll()
// Retorna: Pessoa[]
// CUIDADO: Usa apenas para tabelas pequenas
```

#### findMany (com paginação)
```tsx
const resultado = await pessoaRepo.findMany({
  page: 1,
  limit: 20,
  orderBy: 'nome',
  orderDirection: 'asc',
  filters: { status: 'ativo' }
})

// Resultado:
// {
//   data: Pessoa[],
//   meta: {
//     page: 1,
//     limit: 20,
//     total: 150,
//     totalPages: 8
//   }
// }
```

#### findActive
```tsx
const ativos = await pessoaRepo.findActive()
// Retorna apenas registros com ativo = true
```

#### create
```tsx
const novaPessoa = await pessoaRepo.create({
  nome: 'João Silva',
  email_corporativo: 'joao@empresa.com',
  status: 'ativo',
})
// Retorna: Pessoa (registro criado)
```

#### update
```tsx
const atualizada = await pessoaRepo.update('uuid-aqui', {
  telefone: '(11) 98765-4321',
})
// Retorna: Pessoa (registro atualizado)
```

#### delete (hard delete)
```tsx
await pessoaRepo.delete('uuid-aqui')
// CUIDADO: Deleta permanentemente
```

#### softDelete
```tsx
const inativada = await pessoaRepo.softDelete('uuid-aqui')
// Marca ativo = false
```

#### restore
```tsx
const reativada = await pessoaRepo.restore('uuid-aqui')
// Marca ativo = true
```

#### count
```tsx
const total = await pessoaRepo.count()
const ativos = await pessoaRepo.count({ ativo: true })
```

#### exists
```tsx
const existe = await pessoaRepo.exists('uuid-aqui')
// Retorna: boolean
```

## 📚 Repositories Específicos

### UsuarioRepository

```tsx
import { UsuarioRepository } from '@/lib/repositories'

const usuarioRepo = new UsuarioRepository(supabase)

// Buscar por email
const usuario = await usuarioRepo.findByEmail('admin@empresa.com')

// Buscar com dados da pessoa
const usuarioComPessoa = await usuarioRepo.findByIdWithPessoa('uuid')

// Buscar gestores
const gestores = await usuarioRepo.findGestores()

// Verificar se email existe
const emailEmUso = await usuarioRepo.emailExists('teste@empresa.com')

// Contar por tipo de perfil
const totalAdmins = await usuarioRepo.countByTipoPerfil('admin')
```

### PessoaRepository

```tsx
import { PessoaRepository } from '@/lib/repositories'

const pessoaRepo = new PessoaRepository(supabase)

// Buscar com relacionamentos completos
const pessoa = await pessoaRepo.findByIdWithRelationships('uuid')
// Retorna pessoa com cargo, time, tags, projetos, histórico

// Buscar por time
const membros = await pessoaRepo.findByTimeId('time-uuid')

// Buscar por status
const ativas = await pessoaRepo.findAtivas()
const ferias = await pessoaRepo.findByStatus('ferias')

// Buscar por nome
const resultados = await pessoaRepo.findByNome('João')

// Buscar sem time
const semTime = await pessoaRepo.findWithoutTime()

// Buscar com filtros avançados
const filtradas = await pessoaRepo.findWithFilters({
  busca: 'Silva',
  time_id: 'uuid',
  status: 'ativo',
})

// Contar por time
const total = await pessoaRepo.countByTimeId('time-uuid')
```

### TimeRepository

```tsx
import { TimeRepository } from '@/lib/repositories'

const timeRepo = new TimeRepository(supabase)

// Buscar com relacionamentos
const time = await timeRepo.findByIdWithRelationships('uuid')
// Retorna time com gestor, time pai, filhos, membros, vagas

// Buscar times raiz (sem pai)
const raizes = await timeRepo.findRootTeams()

// Buscar filhos de um time
const filhos = await timeRepo.findByTimePaiId('time-pai-uuid')

// Buscar hierarquia (1 nível)
const hierarquia = await timeRepo.findHierarchy('uuid')

// Buscar times com vagas
const comVagas = await timeRepo.findWithVagas()

// Contar membros
const totalMembros = await timeRepo.countMembros('uuid')

// Obter IDs da hierarquia
const ids = await timeRepo.getHierarchyIds('uuid')
```

### NivelRepository

```tsx
import { NivelRepository } from '@/lib/repositories'

const nivelRepo = new NivelRepository(supabase)

// Buscar por nome
const l3 = await nivelRepo.findByNome('L3')

// Buscar primeiro nível (L1)
const l1 = await nivelRepo.findPrimeiroNivel()

// Buscar todos ordenados (L1, L2, L3, ...)
const ordenados = await nivelRepo.findAllOrdered()

// Buscar cadeia anterior (até L1)
const cadeia = await nivelRepo.findCadeiaAnterior('nivel-uuid')

// Buscar por índice
const nivel = await nivelRepo.findByIndice(2) // L3

// Verificar se pode deletar
const podeDeletar = await nivelRepo.canDelete('uuid')
```

### CargoRepository

```tsx
import { CargoRepository } from '@/lib/repositories'

const cargoRepo = new CargoRepository(supabase)

// Buscar com trilha e nível
const cargo = await cargoRepo.findByIdWithRelationships('uuid')

// Buscar por trilha
const cargosEngenharia = await cargoRepo.findByTrilhaId('trilha-uuid')

// Buscar por combinação trilha + nível
const cargo = await cargoRepo.findByTrilhaAndNivel('trilha-uuid', 'nivel-uuid')

// Buscar com estatísticas
const cargosComStats = await cargoRepo.findWithStats()
// Retorna cargos com total de pessoas e vagas

// Verificar se combinação existe
const existe = await cargoRepo.combinacaoExists('trilha-uuid', 'nivel-uuid')

// Verificar se pode deletar
const podeDeletar = await cargoRepo.canDelete('uuid')
```

## 🔧 Factory Functions

Para facilitar, você pode usar as factory functions:

```tsx
import { createRepositories } from '@/lib/repositories'
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const repos = createRepositories(supabase)

// Agora você tem acesso a todos:
const usuario = await repos.usuario.findById('uuid')
const pessoa = await repos.pessoa.findById('uuid')
const time = await repos.time.findById('uuid')
const nivel = await repos.nivel.findById('uuid')
const cargo = await repos.cargo.findById('uuid')
```

## ⚠️ Error Handling

Todos os repositories lançam `RepositoryError` em caso de erro:

```tsx
import { RepositoryError } from '@/lib/repositories'

try {
  const pessoa = await pessoaRepo.findById('uuid')
} catch (error) {
  if (error instanceof RepositoryError) {
    console.error('Erro no repository:', error.message)
    console.error('Erro original:', error.originalError)
  }
}
```

## 🎯 Boas Práticas

### ✅ DO (Faça)

```tsx
// ✅ Use repositories em Server Components
export default async function Page() {
  const supabase = await createClient()
  const pessoaRepo = new PessoaRepository(supabase)
  const pessoas = await pessoaRepo.findAll()

  return <div>...</div>
}

// ✅ Use repositories em Server Actions
'use server'
export async function createPessoa(data: PessoaInsert) {
  const supabase = await createClient()
  const pessoaRepo = new PessoaRepository(supabase)
  return await pessoaRepo.create(data)
}

// ✅ Use repositories em API Routes
export async function GET() {
  const supabase = await createClient()
  const pessoaRepo = new PessoaRepository(supabase)
  const pessoas = await pessoaRepo.findAll()

  return Response.json({ data: pessoas })
}
```

### ❌ DON'T (Não faça)

```tsx
// ❌ NÃO use repositories em Client Components
'use client'
export default function MyComponent() {
  const supabase = createClient() // Client!
  const pessoaRepo = new PessoaRepository(supabase) // ❌ Não funciona
}

// ❌ NÃO coloque lógica de negócio no repository
async create(data: PessoaInsert) {
  // ❌ NÃO faça validações aqui
  if (data.salario_atual > 50000) {
    throw new Error('Salário muito alto')
  }

  // ❌ NÃO faça auditoria aqui
  await this.criarHistorico(...)

  // ✅ APENAS acesse dados
  return await this.supabase.from('pessoa').insert(data)
}

// ❌ NÃO verifique permissões no repository
async findAll() {
  const usuario = await getUsuario()

  // ❌ Permissões vão no Service, não aqui
  if (usuario.tipo_perfil !== 'admin') {
    throw new Error('Sem permissão')
  }

  return await this.supabase.from('pessoa').select('*')
}
```

## 🔜 Próximos Passos

1. ✅ Repositories criados
2. ⏳ **Criar Services** (lógica de negócio, validações, auditoria)
3. ⏳ Integrar repositories nos componentes
4. ⏳ Implementar permissões (via services)

## 📚 Referências

- [CLAUDE.md](../../CLAUDE.md) - Especificação completa do projeto
- [Database Types](../types/README.md) - Tipos TypeScript do banco
- [Supabase Client](../supabase/README.md) - Como usar o cliente Supabase

---

**🦖 Orgzilla** - Sistema de Gestão de Times
