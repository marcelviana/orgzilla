# 🦖 Middleware - Orgzilla

Sistema de autenticação e autorização para Server Components, Server Actions e API Routes.

## 📁 Estrutura

```
lib/middleware/
├── auth.middleware.ts        # Autenticação (sessão, usuário logado)
├── permission.middleware.ts  # Autorização (permissões, hierarquia)
├── index.ts                  # Exports centralizados
└── README.md                 # Este arquivo
```

**Middleware da raiz:**
```
middleware.ts (raiz)          # Middleware Next.js (atualiza sessão, protege rotas)
```

## 🚀 Como Usar

### Importação
```tsx
import {
  // Auth
  getUsuarioLogado,
  requireAuth,
  requireAdmin,

  // Permissions
  requireGestorOrAdmin,
  filterByHierarchy,
  canViewSalary,
} from '@/lib/middleware'
```

## 🔐 Auth Middleware

### getUsuarioLogado()
Busca o usuário logado da sessão atual.

```tsx
import { getUsuarioLogado } from '@/lib/middleware'

export default async function Page() {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    return <div>Você precisa estar logado</div>
  }

  return <div>Olá, {usuario.nome}</div>
}
```

**Retorna:**
- `UsuarioLogado` se autenticado
- `null` se não autenticado

**Dados retornados:**
```typescript
{
  id: string
  email: string
  nome: string
  tipo_perfil: 'admin' | 'gestor' | 'visualizador'
  ativo: boolean
  pessoa_id: string | null
  pessoa?: {
    id: string
    nome: string
    email_corporativo: string | null
    foto_url: string | null
    cargo?: { id: string, nome: string }
    time?: { id: string, nome: string }
  }
  authUser?: any // Dados do Supabase Auth
}
```

### requireAuth()
Garante que há um usuário autenticado ou lança erro.

```tsx
import { requireAuth } from '@/lib/middleware'

export default async function Page() {
  const usuario = await requireAuth() // Lança erro se não autenticado

  // A partir daqui, usuario está garantido
  return <div>Olá, {usuario.nome}</div>
}
```

**Lança:** `AuthError` (401) se não autenticado

### verificarAutenticado()
Apenas verifica autenticação, sem retornar usuário.

```tsx
import { verificarAutenticado } from '@/lib/middleware'

export default async function Page() {
  await verificarAutenticado() // Lança erro se não autenticado

  return <div>Área protegida</div>
}
```

### getTipoPerfil()
Retorna o tipo de perfil do usuário.

```tsx
import { getTipoPerfil } from '@/lib/middleware'

const tipoPerfil = await getTipoPerfil()
// Retorna: 'admin' | 'gestor' | 'visualizador' | null
```

### isAdmin(), isGestor(), isVisualizador()
Helpers para verificar tipo de perfil.

```tsx
import { isAdmin, isGestor } from '@/lib/middleware'

if (await isAdmin()) {
  // Usuário é admin
}

if (await isGestor()) {
  // Usuário é gestor
}
```

## 🔒 Permission Middleware

### requireAdmin()
Garante que usuário é Admin.

```tsx
import { requireAdmin } from '@/lib/middleware'

export default async function AdminPage() {
  await requireAdmin() // Lança erro se não for admin

  return <div>Área administrativa</div>
}
```

**Lança:** `PermissionError` (403) se não for admin

### requireGestorOrAdmin()
Garante que usuário é Gestor ou Admin.

```tsx
import { requireGestorOrAdmin } from '@/lib/middleware'

export default async function GestaoPage() {
  await requireGestorOrAdmin() // Lança erro se for visualizador

  return <div>Área de gestão</div>
}
```

**Lança:** `PermissionError` (403) se for visualizador

### requireMinimumRole()
Garante perfil mínimo requerido.

```tsx
import { requireMinimumRole } from '@/lib/middleware'

export default async function Page() {
  await requireMinimumRole('gestor') // Requer gestor ou admin

  return <div>Área restrita</div>
}
```

### requireCanViewSalary()
Garante que usuário pode ver dados salariais (LGPD).

```tsx
import { requireCanViewSalary } from '@/lib/middleware'

export default async function SalariosPage() {
  await requireCanViewSalary() // Apenas gestores

  return <div>Relatório de salários</div>
}
```

**LGPD:** Apenas gestores podem ver salários. Admins NÃO podem.

## 🌲 Hierarquia (Gestores)

### filterByHierarchy()
Filtra dados baseado na hierarquia do gestor.

```tsx
'use server'

import { requireAuth, filterByHierarchy } from '@/lib/middleware'
import { PessoaRepository } from '@/lib/repositories'
import { createClient } from '@/lib/supabase/server'

export async function buscarPessoas() {
  const usuario = await requireAuth()

  const supabase = await createClient()
  const pessoaRepo = new PessoaRepository(supabase)

  // Aplica filtro automaticamente baseado no perfil
  const pessoas = await filterByHierarchy(usuario, async (timesIds) => {
    if (!timesIds) {
      // Admin ou Visualizador: retorna todas
      return await pessoaRepo.findAll()
    } else {
      // Gestor: filtra por hierarquia
      return await pessoaRepo.findByTimeIds(timesIds)
    }
  })

  return pessoas
}
```

**Como funciona:**
- **Admin/Visualizador:** `timesIds` é `null` → retorna todos os dados
- **Gestor:** `timesIds` contém IDs dos times da hierarquia → filtra dados
- **Gestor sem hierarquia:** retorna array vazio

### getTimesHierarquia()
Busca IDs dos times da hierarquia do gestor.

```tsx
import { getTimesHierarquia } from '@/lib/middleware'

const timesIds = await getTimesHierarquia()
// Retorna: ['time1', 'time2', 'time3', ...] ou []
```

### pertenceHierarquia()
Verifica se entidade pertence à hierarquia do gestor.

```tsx
import { pertenceHierarquia } from '@/lib/middleware'

const pertence = await pertenceHierarquia('pessoa', pessoaId)
// Retorna: boolean
```

## 🛡️ Checks de Permissão

### canCreate(), canEdit(), canDelete()
Verifica permissões básicas.

```tsx
import { canCreate, canEdit, canDelete } from '@/lib/middleware'

if (await canCreate('pessoa')) {
  // Usuário pode criar pessoa
}

if (await canEdit('pessoa', pessoaId)) {
  // Usuário pode editar esta pessoa
}

if (await canDelete('time', timeId)) {
  // Usuário pode deletar este time
}
```

### canViewSalary()
Verifica se pode ver salário de uma pessoa específica.

```tsx
import { canViewSalary } from '@/lib/middleware'

if (await canViewSalary(pessoaId)) {
  // Pode mostrar salário
  return pessoa.salario_atual
} else {
  // Oculta salário
  return 'N/A'
}
```

## 🔍 Filtragem de Dados Sensíveis

### filterSensitiveFields()
Remove campos sensíveis de um objeto baseado em permissões.

```tsx
import { filterSensitiveFields } from '@/lib/middleware'

const pessoa = await pessoaRepo.findById(id)

// Remove salario_atual, data_ultimo_reajuste, motivo_ultimo_reajuste
// se usuário não pode ver
const pessoaFiltrada = await filterSensitiveFields(pessoa, id)

return pessoaFiltrada
```

### filterSensitiveFieldsArray()
Remove campos sensíveis de um array de objetos.

```tsx
import { filterSensitiveFieldsArray } from '@/lib/middleware'

const pessoas = await pessoaRepo.findAll()

// Remove campos sensíveis de todas as pessoas
// baseado nas permissões do usuário logado
const pessoasFiltradas = await filterSensitiveFieldsArray(pessoas)

return pessoasFiltradas
```

## 📋 Exemplos Completos

### Server Component Protegida (Admin Only)

```tsx
import { requireAdmin } from '@/lib/middleware'
import { UsuarioRepository } from '@/lib/repositories'
import { createClient } from '@/lib/supabase/server'

export default async function UsuariosPage() {
  // Protege a página (apenas admin)
  await requireAdmin()

  const supabase = await createClient()
  const usuarioRepo = new UsuarioRepository(supabase)

  const usuarios = await usuarioRepo.findAll()

  return (
    <div>
      <h1>Gerenciar Usuários</h1>
      {usuarios.map((u) => (
        <div key={u.id}>{u.nome}</div>
      ))}
    </div>
  )
}
```

### Server Action com Hierarquia

```tsx
'use server'

import { requireAuth, filterByHierarchy } from '@/lib/middleware'
import { createServices } from '@/lib/services'
import { createClient } from '@/lib/supabase/server'

export async function buscarPessoasAction() {
  const usuario = await requireAuth()

  const supabase = await createClient()
  const services = createServices(supabase)

  // Busca com filtro de hierarquia
  const pessoas = await services.pessoa.buscarComPermissao(usuario)

  return pessoas
}
```

### API Route com Permissões

```tsx
import { requireGestorOrAdmin, canViewSalary, filterSensitiveFields } from '@/lib/middleware'
import { createClient } from '@/lib/supabase/server'
import { PessoaRepository } from '@/lib/repositories'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verifica autenticação e autorização
    await requireGestorOrAdmin()

    const supabase = await createClient()
    const pessoaRepo = new PessoaRepository(supabase)

    const pessoa = await pessoaRepo.findById(params.id)

    if (!pessoa) {
      return NextResponse.json({ error: 'Pessoa não encontrada' }, { status: 404 })
    }

    // Filtra dados sensíveis baseado em permissões
    const pessoaFiltrada = await filterSensitiveFields(pessoa, params.id)

    return NextResponse.json({ data: pessoaFiltrada })
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.name === 'PermissionError') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

### Error Handling

```tsx
import { requireAuth, AuthError, PermissionError } from '@/lib/middleware'

try {
  const usuario = await requireAuth()
  // ... lógica
} catch (error) {
  if (error instanceof AuthError) {
    // Não autenticado (401)
    console.error('Erro de autenticação:', error.message)
  } else if (error instanceof PermissionError) {
    // Sem permissão (403)
    console.error('Erro de permissão:', error.message)
  }
}
```

## 🎯 Regras de Permissão

### Admin
- ✅ Pode criar, editar, deletar tudo
- ❌ **NÃO pode ver salários** (LGPD)
- ✅ Pode gerenciar usuários
- ✅ Pode gerenciar configurações (níveis, trilhas, cargos)

### Gestor
- ✅ Pode criar, editar, deletar **apenas sua hierarquia**
- ✅ **PODE ver salários** da sua hierarquia (LGPD)
- ❌ Não pode gerenciar usuários
- ❌ Não pode gerenciar configurações globais
- ✅ Pode criar tags

### Visualizador
- ✅ Pode visualizar tudo (exceto dados sensíveis)
- ❌ NÃO pode criar, editar ou deletar
- ❌ NÃO pode ver salários
- ❌ Não pode exportar dados

## 📚 Referências

- [Next.js 14 Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Auth SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [CLAUDE.md](../../CLAUDE.md) - Especificação completa do projeto

---

**🦖 Orgzilla** - Sistema de Gestão de Times
