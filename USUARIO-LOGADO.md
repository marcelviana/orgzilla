# 👤 Dados do Usuário Logado - Orgzilla

Sistema de carregamento e exibição dos dados do usuário autenticado em todo o dashboard.

## ✅ Implementação Completa

### Arquitetura

```
middleware.ts (protege rotas)
    ↓
app/(dashboard)/layout.tsx (busca dados do Supabase)
    ↓
UserProvider (Context API)
    ↓
DashboardShell (consome dados via useUser())
    ↓
Páginas do dashboard (herdam contexto)
```

## 📁 Arquivos Criados/Modificados

### 1. app/(dashboard)/layout.tsx - 🆕 Layout Server Component

```typescript
// ✅ Busca dados do usuário autenticado
const { data: usuario } = await supabase
  .from('usuario')
  .select(`
    *,
    pessoa:pessoa_id (
      id,
      nome,
      foto_url,
      cargo:cargo_id (id, nome),
      time:time_id (id, nome)
    )
  `)
  .eq('email', authUser.email)
  .single()

// ✅ Cria usuário automaticamente se não existir
if (!usuario) {
  await supabase.from('usuario').insert({
    id: authUser.id,
    email: authUser.email,
    nome: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
    tipo_perfil: 'visualizador',
    ativo: true,
  })
}

// ✅ Fornece dados via Context
return (
  <UserProvider usuario={usuario}>
    {children}
  </UserProvider>
)
```

**Funcionalidades:**
- ✅ Busca dados completos do usuário
- ✅ Inclui relacionamentos (pessoa, cargo, time)
- ✅ Cria usuário automaticamente no primeiro login
- ✅ Fornece dados via Context para toda a árvore de componentes
- ✅ Redireciona para login se não autenticado (fallback)

### 2. components/providers/user-provider.tsx - 🆕 Context Provider

```typescript
const UserContext = createContext<Usuario | null>(null)

export function UserProvider({ children, usuario }) {
  return (
    <UserContext.Provider value={usuario}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
```

**Funcionalidades:**
- ✅ Fornece dados do usuário para toda a aplicação
- ✅ Hook `useUser()` para consumir em qualquer componente
- ✅ Type-safe com TypeScript

### 3. components/dashboard-shell.tsx - ✨ Atualizado

```typescript
export function DashboardShell({ children }: DashboardShellProps) {
  const usuario = useUser() // ✅ Consome dados do Context

  const nomeExibicao = usuario?.pessoa?.nome || usuario?.nome || 'Usuário'
  const iniciais = nomeExibicao.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const isAdmin = usuario?.tipo_perfil === 'admin'

  // Renderiza nome, foto e perfil reais
  return (
    <Avatar>
      {usuario?.pessoa?.foto_url && (
        <AvatarImage src={usuario.pessoa.foto_url} />
      )}
      <AvatarFallback>{iniciais}</AvatarFallback>
    </Avatar>
  )
}
```

**Funcionalidades:**
- ✅ Consome dados via `useUser()`
- ✅ Exibe nome real do usuário
- ✅ Exibe foto do perfil (se tiver)
- ✅ Exibe iniciais como fallback
- ✅ Exibe tipo de perfil (Admin/Gestor/Visualizador)
- ✅ Controla visibilidade de menus baseado no perfil

## 🎯 Dados Disponíveis

### Tipo Usuario

```typescript
{
  id: string                    // UUID do auth user
  nome: string                  // Nome do usuário
  email: string                 // Email do usuário
  tipo_perfil: 'admin' | 'gestor' | 'visualizador'
  ativo: boolean                // Se está ativo
  pessoa?: {                    // Dados da pessoa (se vinculado)
    id: string
    nome: string                // Nome completo (pode ser diferente do nome do usuario)
    foto_url: string | null     // URL da foto de perfil
    cargo?: {                   // Cargo atual
      id: string
      nome: string
    } | null
    time?: {                    // Time atual
      id: string
      nome: string
    } | null
  } | null
}
```

## 🚀 Como Usar

### Em Qualquer Componente Client

```typescript
'use client'

import { useUser } from '@/components/providers/user-provider'

export function MeuComponente() {
  const usuario = useUser()

  if (!usuario) {
    return <div>Carregando...</div>
  }

  return (
    <div>
      <h1>Olá, {usuario.pessoa?.nome || usuario.nome}!</h1>
      <p>Email: {usuario.email}</p>
      <p>Perfil: {usuario.tipo_perfil}</p>

      {usuario.pessoa && (
        <>
          {usuario.pessoa.cargo && (
            <p>Cargo: {usuario.pessoa.cargo.nome}</p>
          )}
          {usuario.pessoa.time && (
            <p>Time: {usuario.pessoa.time.nome}</p>
          )}
        </>
      )}
    </div>
  )
}
```

### Verificar Permissões

```typescript
const usuario = useUser()
const isAdmin = usuario?.tipo_perfil === 'admin'
const isGestor = usuario?.tipo_perfil === 'gestor'

if (isAdmin) {
  // Renderizar opções de admin
}
```

### Exibir Avatar

```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const usuario = useUser()
const iniciais = usuario?.nome
  .split(' ')
  .map(n => n[0])
  .slice(0, 2)
  .join('')
  .toUpperCase()

<Avatar>
  {usuario?.pessoa?.foto_url && (
    <AvatarImage src={usuario.pessoa.foto_url} />
  )}
  <AvatarFallback>{iniciais}</AvatarFallback>
</Avatar>
```

## 📊 Estrutura de Pastas

```
app/
├── (dashboard)/                    # Grupo de rotas do dashboard
│   ├── layout.tsx                  # ✅ Busca dados do usuário
│   ├── page.tsx                    # Dashboard home
│   ├── pessoas/                    # Páginas de pessoas
│   ├── times/                      # Páginas de times
│   ├── configuracoes/              # Páginas de configuração
│   └── ...
├── login/                          # Login (fora do grupo dashboard)
└── layout.tsx                      # Root layout

components/
├── providers/
│   └── user-provider.tsx           # ✅ Context provider
└── dashboard-shell.tsx             # ✅ Shell com dados do usuário
```

## 🔄 Fluxo de Dados

1. **Usuário faz login** → Supabase Auth cria sessão
2. **Middleware protege rotas** → Verifica autenticação
3. **Layout do dashboard** → Busca dados completos do Supabase
4. **UserProvider** → Fornece dados via Context
5. **DashboardShell** → Consome dados e renderiza
6. **Páginas** → Herdam acesso aos dados do usuário

## 🧪 Como Testar

### 1. Login com Usuário Existente

1. Crie um usuário no Supabase:
   ```sql
   INSERT INTO usuario (id, email, nome, tipo_perfil)
   VALUES (
     '[AUTH-USER-UUID]',
     'admin@orgzilla.com',
     'Admin Orgzilla',
     'admin'
   );
   ```

2. Faça login na aplicação
3. ✅ Deve exibir "Admin Orgzilla" no sidebar
4. ✅ Deve exibir "Administrador" como perfil
5. ✅ Deve exibir iniciais "AO" no avatar

### 2. Login com Novo Usuário

1. Crie um usuário apenas no Supabase Auth (não na tabela usuario)
2. Faça login na aplicação
3. ✅ Deve criar automaticamente na tabela `usuario`
4. ✅ Tipo de perfil padrão: "Visualizador"
5. ✅ Nome extraído do email ou metadata do Google

### 3. Vincular com Pessoa

1. Crie uma pessoa no banco:
   ```sql
   INSERT INTO pessoa (nome, email_corporativo, foto_url)
   VALUES ('João Silva', 'joao@empresa.com', 'https://...');
   ```

2. Vincule ao usuário:
   ```sql
   UPDATE usuario
   SET pessoa_id = '[PESSOA-UUID]'
   WHERE email = 'joao@empresa.com';
   ```

3. Faça logout e login novamente
4. ✅ Deve exibir "João Silva" (nome da pessoa)
5. ✅ Deve exibir foto da pessoa (se tiver)
6. ✅ Deve exibir cargo e time (se vinculado)

## 🎨 UI Atualizada

### Sidebar (Parte Inferior)

**Antes:**
```
[Avatar JS] João Silva
            Administrador
            [Sair]
```

**Agora (dados reais):**
```
[Avatar com foto ou iniciais reais]
[Nome real da pessoa/usuário]
[Tipo de perfil real]
[Sair]
```

### Header (Canto Superior Direito)

**Antes:**
```
[Avatar JS]
```

**Agora (dados reais):**
```
[Avatar com foto ou iniciais reais clicável para /perfil]
```

## 🔒 Segurança

### ✅ Proteção em Camadas

1. **Middleware** → Bloqueia acesso não autenticado
2. **Layout** → Verifica autenticação (fallback)
3. **Server Component** → Busca dados server-side
4. **Context** → Dados disponíveis apenas para autenticados

### ✅ Dados Sensíveis

- Senha **nunca** é exposta (apenas hash no Supabase Auth)
- Dados de salário **não** são carregados no layout (LGPD)
- Apenas dados necessários para UI são buscados

## 🚀 Próximos Passos

- [ ] Implementar cache dos dados do usuário
- [ ] Adicionar loading state no layout
- [ ] Implementar atualização em tempo real
- [ ] Adicionar foto de perfil upload
- [ ] Implementar edição de perfil

---

**🦖 Orgzilla** - Sistema de Gestão de Times
