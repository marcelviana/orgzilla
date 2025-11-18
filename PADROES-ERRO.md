# 🚨 Padrões de Gestão de Erros - Orgzilla

Sistema centralizado e padronizado para tratamento de erros em toda a aplicação.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquivos do Sistema](#arquivos-do-sistema)
3. [Tipos de Erro](#tipos-de-erro)
4. [Como Usar](#como-usar)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Personalização](#personalização)
7. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

### Princípios

1. **Centralizado**: Todo tratamento de erro passa por `lib/errors/error-handler.ts`
2. **Traduzido**: Erros do Supabase são automaticamente traduzidos para português
3. **Amigável**: Mensagens seguem a personalidade Orgzilla (🦖, tom amigável)
4. **Consistente**: Todas as páginas usam o mesmo padrão de toast
5. **Tipado**: TypeScript garante uso correto

### Filosofia

- **APENAS toast para feedback** (uma mensagem por vez)
- Mensagens inline só em casos específicos (formulários complexos)
- Erros de validação ANTES de enviar ao servidor
- Erros de autenticação/banco traduzidos automaticamente
- Visual consistente (cores da marca)

---

## 📁 Arquivos do Sistema

### 1. `lib/errors/error-handler.ts`

Sistema centralizado de tratamento de erros.

**Funções principais:**

```typescript
// Processa qualquer erro e retorna AppError
handleError(error: any, type: ErrorType): AppError

// Validações reutilizáveis
validateEmail(email: string): AppError | null
validatePassword(password: string, minLength?: number): AppError | null
validateRequired(value: any, fieldName: string): AppError | null
```

**Tipos de erro:**

```typescript
type ErrorType =
  | 'auth'           // Erros de autenticação
  | 'validation'     // Erros de validação de formulário
  | 'permission'     // Erros de permissão
  | 'not_found'      // Recurso não encontrado
  | 'database'       // Erros do Supabase/banco
  | 'network'        // Erros de rede
  | 'unknown'        // Erros desconhecidos
```

### 2. `lib/ui/toast-config.ts`

Configuração centralizada do Toast (Sonner) com estilos da marca.

**Funções:**

```typescript
toast.success(message: string)           // Toast verde
toast.error(error: string | AppError)    // Toast vermelho
toast.info(message: string)              // Toast azul
toast.warning(message: string)           // Toast laranja
toast.successDino(message: string)       // Toast com 🦖
```

### 3. `hooks/use-form-validation.ts`

Hook para gerenciar erros de formulário (quando necessário).

**API:**

```typescript
const {
  errors,              // Objeto com erros por campo
  isSubmitting,        // Estado de loading
  setIsSubmitting,     // Setter
  setFieldError,       // Define erro em campo específico
  clearFieldError,     // Limpa erro de campo
  clearErrors,         // Limpa todos os erros
  hasError,            // Verifica se campo tem erro
  getError,            // Retorna mensagem de erro do campo
  hasAnyError,         // Verifica se há algum erro
} = useFormValidation()
```

### 4. `components/ui/form-error.tsx`

Componente para mostrar erros inline (usar apenas quando necessário).

```typescript
<FormError error={getError('email')} />
```

---

## 🏷️ Tipos de Erro

### 1. Auth (Autenticação)

**Erros traduzidos automaticamente:**

| Erro Supabase | Mensagem Orgzilla |
|---------------|-------------------|
| `Invalid login credentials` | Email ou senha incorretos |
| `Email not confirmed` | Email não confirmado. Verifique sua caixa de entrada. |
| `User not found` | Usuário não encontrado |
| `Invalid email` | Email inválido |
| `Password should be at least 6 characters` | A senha deve ter pelo menos 6 caracteres |
| `User already registered` | Este email já está cadastrado |

**Mensagem genérica:**
> Ops! Orgzilla tropeçou na autenticação. Tente novamente.

### 2. Database (Banco de Dados)

**Erros traduzidos automaticamente:**

| Erro Supabase | Mensagem Orgzilla |
|---------------|-------------------|
| `duplicate key value violates unique constraint` | Este registro já existe no sistema |
| `foreign key violation` | Não é possível excluir. Este registro está sendo usado. |
| `null value in column` | Preencha todos os campos obrigatórios |
| `invalid input syntax` | Dados inválidos. Verifique os campos. |

**Mensagem genérica:**
> Ops! Orgzilla tropeçou ao salvar os dados. Tente novamente.

### 3. Validation (Validação)

**Mensagens:**
- Email obrigatório
- Email inválido
- Senha obrigatória
- Senha muito curta
- Campo obrigatório

### 4. Permission (Permissão)

**Mensagem:**
> Ops! Você não tem permissão para fazer isso.

### 5. Not Found (Não Encontrado)

**Mensagem:**
> Ops! Orgzilla não encontrou o que você procura.

### 6. Network (Rede)

**Mensagem:**
> Ops! Orgzilla perdeu a conexão. Verifique sua internet.

### 7. Unknown (Desconhecido)

**Mensagem:**
> Ops! Algo inesperado aconteceu. Tente novamente.

---

## 🛠️ Como Usar

### Padrão 1: Validação + Autenticação (Login, Cadastro)

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { handleError, validateEmail, validatePassword } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false) // Para destacar campos
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHasError(false)

    // 1. Validar ANTES de enviar
    const emailError = validateEmail(email)
    if (emailError) {
      toast.error(emailError)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    setIsLoading(true)

    try {
      // 2. Autenticar
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // 3. Tratar erro
        const appError = handleError(error, 'auth')
        setHasError(true) // Destacar campos
        toast.error(appError)
        return
      }

      // 4. Sucesso
      toast.successDino('Login realizado com sucesso!')
      router.push('/dashboard')

    } catch (error) {
      const appError = handleError(error, 'unknown')
      toast.error(appError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setHasError(false) // Limpar ao digitar
        }}
        className={hasError ? 'border-error' : ''}
      />
      {/* SEM mensagem inline */}

      <Button disabled={isLoading}>
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}
```

### Padrão 2: CRUD (Criar, Editar, Excluir)

```typescript
'use client'

import { validateRequired } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'

async function handleCreate() {
  // 1. Validar campos obrigatórios
  const nomeError = validateRequired(nome, 'Nome')
  if (nomeError) {
    toast.error(nomeError)
    return
  }

  setIsLoading(true)

  try {
    // 2. Criar no banco
    const { data, error } = await supabase
      .from('nivel')
      .insert({ nome })

    if (error) {
      // 3. Tratar erro do banco
      const appError = handleError(error, 'database')
      toast.error(appError)
      return
    }

    // 4. Sucesso
    toast.successDino('Nível criado com sucesso!')
    setOpen(false)
    router.refresh()

  } catch (error) {
    const appError = handleError(error, 'database')
    toast.error(appError)
  } finally {
    setIsLoading(false)
  }
}
```

### Padrão 3: Verificação de Permissão

```typescript
import { handleError } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'

function handleDelete() {
  // Verificar permissão
  if (usuario.tipo_perfil !== 'admin') {
    const error = {
      type: 'permission' as const,
      message: 'Ops! Você não tem permissão para fazer isso.',
    }
    toast.error(error)
    return
  }

  // Prosseguir com exclusão...
}
```

### Padrão 4: Buscar Dados (Server Actions)

```typescript
// app/actions/pessoas.actions.ts
'use server'

import { handleError } from '@/lib/errors/error-handler'

export async function getPessoas() {
  try {
    const { data, error } = await supabase
      .from('pessoa')
      .select('*')

    if (error) {
      const appError = handleError(error, 'database')
      return { success: false, error: appError }
    }

    return { success: true, data }

  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError }
  }
}
```

```typescript
// Cliente
'use client'

import { toast } from '@/lib/ui/toast-config'
import { getPessoas } from '@/app/actions/pessoas.actions'

async function loadData() {
  const result = await getPessoas()

  if (!result.success) {
    toast.error(result.error!)
    return
  }

  setPessoas(result.data)
}
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Formulário com Múltiplos Campos

```typescript
import { useFormValidation } from '@/hooks/use-form-validation'
import { validateRequired } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'
import { FormError } from '@/components/ui/form-error'

function PessoaForm() {
  const { hasError, getError, setFieldError, clearFieldError } = useFormValidation()

  async function handleSubmit() {
    // Validar todos os campos
    const errors = []

    if (!nome) errors.push(validateRequired(nome, 'Nome'))
    if (!email) errors.push(validateRequired(email, 'Email'))
    if (!cargo) errors.push(validateRequired(cargo, 'Cargo'))

    // Se houver erros, mostrar o primeiro no toast
    if (errors.length > 0) {
      const firstError = errors.find(e => e !== null)
      if (firstError) {
        toast.error(firstError)
        // Opcionalmente marcar campo com erro
        setFieldError(firstError.field!, firstError.message)
      }
      return
    }

    // Prosseguir com submit...
  }

  return (
    <form>
      <div>
        <Label>Nome *</Label>
        <Input
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            clearFieldError('nome')
          }}
          className={hasError('nome') ? 'border-error' : ''}
        />
        {/* Opcional: mostrar erro inline */}
        <FormError error={getError('nome')} />
      </div>
    </form>
  )
}
```

### Exemplo 2: Tratamento de Erro de Network

```typescript
async function fetchData() {
  try {
    const response = await fetch('/api/data')
    const data = await response.json()

    if (!response.ok) {
      throw new Error('Request failed')
    }

    return data

  } catch (error) {
    const appError = handleError(error, 'network')
    toast.error(appError)
    return null
  }
}
```

### Exemplo 3: Confirmar Antes de Excluir

```typescript
import { toast } from '@/lib/ui/toast-config'
import { handleError } from '@/lib/errors/error-handler'

async function handleDelete(id: string) {
  // Confirmar
  if (!confirm('Tem certeza que deseja excluir?')) {
    return
  }

  try {
    const { error } = await supabase
      .from('pessoa')
      .delete()
      .eq('id', id)

    if (error) {
      const appError = handleError(error, 'database')
      toast.error(appError)
      return
    }

    toast.successDino('Pessoa excluída com sucesso!')
    router.refresh()

  } catch (error) {
    const appError = handleError(error, 'database')
    toast.error(appError)
  }
}
```

---

## 🎨 Personalização

### Adicionar Novo Erro do Supabase

Edite `lib/errors/error-handler.ts`:

```typescript
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos',
  'New error from Supabase': 'Nova mensagem em português', // Adicionar aqui
}
```

### Adicionar Nova Validação

```typescript
// Em lib/errors/error-handler.ts

export function validateCPF(cpf: string): AppError | null {
  if (!cpf) {
    return {
      type: 'validation',
      message: 'CPF é obrigatório',
      field: 'cpf',
    }
  }

  // Lógica de validação...
  if (!isValidCPF(cpf)) {
    return {
      type: 'validation',
      message: 'CPF inválido',
      field: 'cpf',
    }
  }

  return null
}
```

### Customizar Estilo do Toast

Edite `lib/ui/toast-config.ts`:

```typescript
const toastStyles = {
  success: {
    style: {
      background: '#1A2734',      // Alterar cores
      color: '#fff',
      border: '2px solid #00C8FF',
    },
  },
  // ...
}
```

---

## ✅ Boas Práticas

### DO ✅

1. **Sempre valide ANTES de enviar**
   ```typescript
   const error = validateEmail(email)
   if (error) {
     toast.error(error)
     return
   }
   ```

2. **Use handleError para processar erros**
   ```typescript
   if (error) {
     const appError = handleError(error, 'database')
     toast.error(appError)
   }
   ```

3. **Use toast.successDino para sucessos**
   ```typescript
   toast.successDino('Salvo com sucesso!')
   ```

4. **Limpe erros visuais ao digitar**
   ```typescript
   onChange={(e) => {
     setValue(e.target.value)
     setHasError(false)
   }}
   ```

5. **Use finally para resetar loading**
   ```typescript
   try {
     // ...
   } finally {
     setIsLoading(false)
   }
   ```

### DON'T ❌

1. **Não use sonner diretamente**
   ```typescript
   ❌ import { toast } from 'sonner'
   ✅ import { toast } from '@/lib/ui/toast-config'
   ```

2. **Não traduza erros manualmente**
   ```typescript
   ❌ if (error.message === 'Invalid login credentials') {
        toast.error('Email ou senha incorretos')
      }
   ✅ const appError = handleError(error, 'auth')
      toast.error(appError)
   ```

3. **Não mostre mensagens inline sem necessidade**
   ```typescript
   ❌ <p className="text-error">{error}</p>
   ✅ Apenas toast (campos destacados sem mensagem)
   ```

4. **Não repita validações APÓS erro**
   ```typescript
   ❌ if (error) {
        if (!email.includes('@')) { // Não validar novamente!
          toast.error('Email inválido')
        }
      }
   ✅ if (error) {
        const appError = handleError(error, 'auth')
        toast.error(appError)
      }
   ```

5. **Não use console.error sem handleError**
   ```typescript
   ❌ console.error(error)
   ✅ const appError = handleError(error, 'database') // Já faz log
   ```

---

## 📊 Fluxo de Erro

```
┌─────────────────┐
│  Usuário submete│
│    formulário   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Validações    │◄─── validateEmail()
│   (frontend)    │◄─── validatePassword()
│                 │◄─── validateRequired()
└────────┬────────┘
         │ (válido)
         ▼
┌─────────────────┐
│  Enviar para    │
│    Supabase     │
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │ Erro?   │
    └────┬────┘
    Sim  │   Não
         │         │
         ▼         ▼
┌─────────────────┐  ┌──────────────┐
│  handleError()  │  │   Sucesso!   │
│   (traduzir)    │  │ toast.success│
└────────┬────────┘  │     Dino     │
         │           └──────────────┘
         ▼
┌─────────────────┐
│  toast.error()  │
│ (uma mensagem)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Destacar campos │
│   (opcional)    │
└─────────────────┘
```

---

## 🧪 Testes

### Cenários de Teste

1. **Campo vazio**: Toast "Campo é obrigatório"
2. **Email inválido**: Toast "Digite um email válido"
3. **Senha curta**: Toast "A senha deve ter pelo menos 6 caracteres"
4. **Credenciais erradas**: Toast "Email ou senha incorretos" + campos vermelhos
5. **Registro duplicado**: Toast "Este registro já existe no sistema"
6. **Sem permissão**: Toast "Ops! Você não tem permissão para fazer isso."
7. **Registro não encontrado**: Toast "Ops! Orgzilla não encontrou o que você procura."
8. **Erro de rede**: Toast "Ops! Orgzilla perdeu a conexão..."
9. **Sucesso**: Toast "🦖 [Ação] realizado com sucesso!"

---

## 📝 Checklist de Implementação

Para cada página/componente:

- [ ] Importar de `@/lib/ui/toast-config` (não `sonner`)
- [ ] Importar validações de `@/lib/errors/error-handler`
- [ ] Validar campos ANTES de enviar
- [ ] Usar `handleError()` para processar erros do Supabase
- [ ] Usar `toast.error()` com AppError
- [ ] Usar `toast.successDino()` para sucessos
- [ ] Destacar campos com erro (sem mensagem inline)
- [ ] Limpar erros ao digitar
- [ ] Resetar loading no `finally`
- [ ] Não repetir validações APÓS erro

---

**🦖 Orgzilla** - Tratamento de erros amigável e consistente!
