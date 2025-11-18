# 🔐 Autenticação - Orgzilla

Sistema de autenticação completo com Supabase Auth.

## ✅ Implementado

### 1. Login com Email/Senha
- ✅ Validação de email e senha
- ✅ Mensagens de erro traduzidas
- ✅ Feedback visual (toast)
- ✅ Loading states
- ✅ Redirecionamento após login

### 2. Login com Google OAuth
- ✅ Botão "Continuar com Google"
- ✅ Callback handler em `/auth/callback`
- ✅ Tratamento de erros
- ✅ Redirecionamento automático

### 3. Logout
- ✅ Route handler `/api/auth/logout`
- ✅ Server action `signOut()` (alternativa)
- ✅ Implementado no sidebar (botão de logout)
- ✅ Toast de despedida com 🦖

### 4. Middleware de Proteção
- ✅ Protege todas as rotas (exceto `/login`)
- ✅ Redireciona não autenticados para `/login`
- ✅ Redireciona autenticados de `/login` para `/`
- ✅ Compatível com Next.js 15

## 📁 Arquivos Criados/Modificados

```
app/
├── login/page.tsx              # ✅ Login com auth real
├── auth/
│   └── callback/route.ts       # ✅ Callback para OAuth
├── api/
│   └── auth/
│       └── logout/route.ts     # ✅ Route handler de logout
└── actions/
    └── auth.actions.ts         # ✅ signOut() server action

components/
└── dashboard-shell.tsx         # ✅ Botão de logout implementado

middleware.ts                   # ✅ Proteção de rotas (Next.js 15)
```

## 🧪 Como Testar

### Teste 1: Login com Email/Senha

1. Execute o projeto: `npm run dev`
2. Acesse: http://localhost:3000/login
3. Tente acessar qualquer outra rota → deve redirecionar para `/login`
4. **Criar usuário no Supabase:**
   - Vá para: Supabase Dashboard → Authentication → Users
   - Clique em "Add user" → "Create new user"
   - Email: `admin@orgzilla.com`
   - Password: `orgzilla123`
   - Desmarque "Auto Confirm User" (ou confirme manualmente depois)
5. Faça login na aplicação
6. Deve redirecionar para `/` (dashboard)

### Teste 2: Validações

**Email inválido:**
- Digite: `teste` (sem @)
- Clique em "Entrar"
- ✅ Deve mostrar: "Por favor, insira um email válido"

**Senha curta:**
- Digite email válido
- Digite senha: `123` (< 6 caracteres)
- ✅ Deve mostrar: "A senha deve ter no mínimo 6 caracteres"

**Credenciais incorretas:**
- Digite: `teste@teste.com` / `senhaerrada`
- ✅ Deve mostrar: "Email ou senha incorretos"

### Teste 3: Login com Google (Requer Configuração)

**Configurar Google OAuth no Supabase:**

1. Acesse: Supabase Dashboard → Authentication → Providers
2. Clique em "Google"
3. Habilite "Enable Sign in with Google"
4. **Criar OAuth App no Google:**
   - Acesse: https://console.cloud.google.com/
   - Crie um projeto (ou use existente)
   - Vá em: APIs & Services → Credentials
   - Clique em "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `https://[SEU-PROJECT-REF].supabase.co/auth/v1/callback`
   - Copie o Client ID e Client Secret
5. Cole no Supabase (Google Provider)
6. Salve

**Testar no app:**
1. Clique em "Continuar com Google"
2. Deve abrir popup do Google
3. Selecione sua conta Google
4. Após autorizar, deve redirecionar para `/`

## 🔧 Configuração do Supabase

### Criar Tabela `usuario`

Se ainda não existe, execute no SQL Editor do Supabase:

```sql
-- Tabela de usuários do sistema
CREATE TABLE usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  tipo_perfil TEXT NOT NULL CHECK (tipo_perfil IN ('admin', 'gestor', 'visualizador')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  pessoa_id UUID REFERENCES pessoa(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_usuario_updated_at
  BEFORE UPDATE ON usuario
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index para buscar por email
CREATE INDEX idx_usuario_email ON usuario(email);
```

### Vincular Auth User → Usuario

**Opção 1: Manualmente no Supabase Dashboard**
1. Authentication → Users → Copie o UUID do auth user
2. SQL Editor → Execute:
```sql
INSERT INTO usuario (id, email, nome, tipo_perfil)
VALUES (
  '[UUID-DO-AUTH-USER]',
  'admin@orgzilla.com',
  'Admin Orgzilla',
  'admin'
);
```

**Opção 2: Criar trigger automático**
```sql
-- Função para criar usuário na tabela quando auth user é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuario (id, email, nome, tipo_perfil)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'visualizador' -- Tipo padrão
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa quando auth user é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## 🚀 Como Usar no Código

### Fazer Logout

**Opção 1: Route Handler (Recomendado)**
```tsx
'use client'

import { toast } from 'sonner'

export function LogoutButton() {
  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('🦖 Até logo!')
        window.location.href = '/login'
      } else {
        toast.error(data.error || 'Erro ao fazer logout')
      }
    } catch (error) {
      toast.error('Ops! Orgzilla tropeçou ao fazer logout')
    }
  }

  return (
    <button onClick={handleLogout}>
      Sair
    </button>
  )
}
```

**Opção 2: Server Action (Alternativa)**
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/app/actions/auth.actions'
import { toast } from 'sonner'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const result = await signOut()

    if (result.success) {
      toast.success('🦖 Até logo!')
      router.push('/login')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao fazer logout')
    }
  }

  return (
    <button onClick={handleLogout}>
      Sair
    </button>
  )
}
```

### Verificar Usuário Logado

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/app/actions/auth.actions'

export function UserInfo() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  if (!user) return <div>Carregando...</div>

  return <div>Olá, {user.nome}!</div>
}
```

## 🔒 Segurança

### RLS (Row Level Security)

O Supabase protege os dados automaticamente com RLS. Para permitir que usuários autenticados acessem suas próprias informações:

```sql
-- Permitir que usuários leiam seus próprios dados
CREATE POLICY "Users can view own data"
  ON usuario
  FOR SELECT
  USING (auth.uid() = id);

-- Permitir que usuários atualizem seus próprios dados
CREATE POLICY "Users can update own data"
  ON usuario
  FOR UPDATE
  USING (auth.uid() = id);
```

### Permissões de Admin

Operações administrativas devem usar o middleware `requireAdmin()`:

```tsx
'use server'

import { requireAdmin } from '@/lib/middleware'

export async function deleteUser(userId: string) {
  // Garante que apenas admin pode executar
  await requireAdmin()

  // ... lógica de delete
}
```

## 🐛 Troubleshooting

### Erro: "Invalid login credentials"
- ✅ Verifique se o email está correto
- ✅ Verifique se a senha está correta
- ✅ Verifique se o usuário confirmou o email (se configurado)

### Erro: "Email not confirmed"
- ✅ No Supabase Dashboard, vá em Authentication → Users
- ✅ Clique no usuário → "Confirm email"

### Erro: "middleware-to-proxy"
- ✅ Certifique-se que o middleware usa `getUser()` e não `updateSession()`
- ✅ Verifique se está na versão correta (já corrigido no projeto)

### Google OAuth não funciona
- ✅ Verifique se configurou o Google Cloud Console
- ✅ Verifique se o Redirect URI está correto
- ✅ Verifique se habilitou o provider no Supabase

### Redirecionamento não funciona
- ✅ Certifique-se de usar `router.refresh()` após login
- ✅ Verifique se o middleware está ativo

## 📝 Próximos Passos

- [ ] Implementar "Esqueci minha senha"
- [ ] Adicionar email de confirmação de conta
- [ ] Implementar 2FA (autenticação de dois fatores)
- [ ] Adicionar página de perfil do usuário
- [ ] Implementar convites por email

---

**🦖 Orgzilla** - Sistema de Gestão de Times
