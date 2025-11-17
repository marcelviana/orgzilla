# 🦖 Supabase Client Configuration - Orgzilla

Cliente Supabase configurado para Next.js 14 App Router com SSR.

## 📁 Estrutura

```
lib/supabase/
├── client.ts       # Cliente para uso no browser (Client Components)
├── server.ts       # Cliente para uso server-side (Server Components, API Routes)
├── middleware.ts   # Helper para middleware de autenticação
├── types.ts        # Tipos TypeScript do banco de dados
└── README.md       # Este arquivo
```

## 🚀 Como Usar

### 1. Client Components (Browser)

Use `client.ts` em componentes que rodam no navegador:

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const supabase = createClient()
  const [data, setData] = useState([])

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('pessoa')
        .select('*')

      setData(data || [])
    }

    fetchData()
  }, [])

  return <div>...</div>
}
```

### 2. Server Components

Use `server.ts` em Server Components:

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  const { data: pessoas } = await supabase
    .from('pessoa')
    .select('*')

  return (
    <div>
      {pessoas?.map(pessoa => (
        <div key={pessoa.id}>{pessoa.nome}</div>
      ))}
    </div>
  )
}
```

### 3. Server Actions

Use `server.ts` em Server Actions:

```tsx
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePessoa(id: string, data: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('pessoa')
    .update(data)
    .eq('id', id)

  if (error) throw error

  revalidatePath('/pessoas')
}
```

### 4. API Routes (Route Handlers)

Use `server.ts` em Route Handlers:

```tsx
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pessoa')
    .select('*')

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}
```

## 🔐 Autenticação

O middleware em `/middleware.ts` (raiz do projeto) já está configurado para:

- ✅ Atualizar sessão do usuário em cada requisição
- ✅ Proteger rotas do dashboard (redireciona para `/login` se não autenticado)
- ✅ Redirecionar usuários autenticados de `/login` para o dashboard

### Exemplo de Login

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Erro no login:', error.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  return <form>...</form>
}
```

### Exemplo de Logout

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <button onClick={handleLogout}>Sair</button>
}
```

### Verificar Usuário Logado

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Usuário não autenticado (não deve acontecer se middleware está ativo)
    return <div>Acesso negado</div>
  }

  return <div>Bem-vindo, {user.email}!</div>
}
```

## 🔧 Configuração

### Variáveis de Ambiente

Certifique-se de que `.env.local` está configurado:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key # Opcional, para operações admin
```

## 📝 Tipos

Os tipos do banco de dados estão em `types.ts`. Você pode usá-los assim:

```tsx
import type { Pessoa, Time, Cargo } from '@/lib/supabase/types'

const pessoa: Pessoa = {
  id: '...',
  nome: 'João Silva',
  // ... outros campos
}
```

### Gerar Tipos Automaticamente

Quando o banco for criado, você pode gerar os tipos automaticamente:

```bash
npx supabase gen types typescript --project-id seu-project-id > lib/supabase/types.ts
```

## 🎯 Próximos Passos

1. ✅ Cliente Supabase configurado
2. ⏳ Criar tabelas no banco de dados
3. ⏳ Implementar services layer (lib/services/)
4. ⏳ Substituir mock data por queries reais
5. ⏳ Implementar lógica de permissões
6. ⏳ Adicionar audit logging

## 📚 Referências

- [Supabase + Next.js SSR Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Orgzilla CLAUDE.md](../../../CLAUDE.md) - Documentação do projeto

---

**🦖 Orgzilla** - Sistema de Gestão de Times
