# 🚀 Próximos Passos - Padronização de Erros

## ✅ O Que Foi Feito

### Arquivos Criados

1. **`lib/errors/error-handler.ts`**
   - Sistema centralizado de tratamento de erros
   - Funções de validação reutilizáveis
   - Tradução automática de erros do Supabase
   - Tipagem TypeScript completa

2. **`lib/ui/toast-config.ts`**
   - Wrapper do Sonner com estilos da marca
   - API simplificada (success, error, info, warning, successDino)
   - Cores consistentes (#1A2734, #00C8FF, #FF5A5F, #FF7A00)

3. **`hooks/use-form-validation.ts`**
   - Hook para gerenciar estado de erros em formulários
   - Funções para set/clear/check erros por campo
   - Estado de submissão integrado

4. **`components/ui/form-error.tsx`**
   - Componente para mensagens inline (quando necessário)
   - Animação suave de entrada
   - Estilo consistente

5. **`PADROES-ERRO.md`**
   - Documentação completa do sistema
   - Exemplos práticos
   - Boas práticas e anti-padrões
   - Fluxo de erro visual

6. **`app/layout.tsx` (Atualizado)**
   - Toaster do Sonner configurado
   - Duration 4s e botão de fechar

7. **`app/login/page.tsx` (Atualizado)**
   - Exemplo completo de implementação
   - Usa validateEmail, validatePassword
   - Usa handleError para erros do Supabase
   - Toast padronizado

---

## 📋 O Que Falta Fazer

### Páginas que precisam ser atualizadas:

#### 1. **Níveis** (`app/(dashboard)/configuracoes/niveis/page.tsx`)

**Status:** Usa `useToast` do shadcn/ui

**Mudanças necessárias:**

```typescript
// ANTES
import { useToast } from '@/hooks/use-toast'
const { toast } = useToast()

toast({
  variant: 'destructive',
  title: 'Erro',
  description: 'Mensagem de erro',
})

// DEPOIS
import { toast } from '@/lib/ui/toast-config'
import { handleError, validateRequired } from '@/lib/errors/error-handler'

toast.error('Mensagem de erro')
// ou
const appError = handleError(error, 'database')
toast.error(appError)
```

**Funções a atualizar:**
- `checkPermissions()` - substituir toast de permissão
- `loadNiveis()` - substituir toast de erro
- `handleCreateLevel()` - adicionar validação + toast padronizado
- `handleEditLevel()` - mesma coisa
- `handleSoftDelete()` - mesma coisa

#### 2. **Dashboard** (`app/(dashboard)/page.tsx`)

**Status:** Pode ter tratamento de erro nas queries

**Verificar:**
- Se há tratamento de erro ao buscar métricas
- Se há feedback visual quando erro ocorre
- Aplicar handleError + toast nos server actions

#### 3. **Pessoas** (`app/(dashboard)/pessoas/page.tsx`)

**Status:** Lista com filtros e tabela

**Mudanças necessárias:**
- Verificar se há toast de erro ao buscar dados
- Aplicar padrões nos modais de criar/editar
- Validações com validateRequired, validateEmail
- Toast padronizado em todas as operações

#### 4. **Actions Files**

**Arquivos:**
- `app/actions/niveis.actions.ts`
- `app/actions/pessoas.actions.ts`
- `app/actions/dashboard.actions.ts`

**Mudanças:**
- Substituir mensagens de erro genéricas por handleError
- Padronizar retorno de `ActionResult`
- Adicionar logs consistentes

**Exemplo:**

```typescript
// ANTES
export async function createNivel(data: NivelInsert): Promise<ActionResult> {
  try {
    // ...
    if (error) {
      return { success: false, error: 'Erro ao criar nível' }
    }
  } catch (error) {
    return { success: false, error: 'Erro inesperado' }
  }
}

// DEPOIS
import { handleError } from '@/lib/errors/error-handler'

export async function createNivel(data: NivelInsert): Promise<ActionResult> {
  try {
    // ...
    if (error) {
      const appError = handleError(error, 'database')
      return { success: false, error: appError.message }
    }
  } catch (error) {
    const appError = handleError(error, 'database')
    return { success: false, error: appError.message }
  }
}
```

---

## 🔧 Como Aplicar (Passo a Passo)

### Para Cada Página Client Component:

1. **Substituir imports**
   ```typescript
   // Remover
   import { useToast } from '@/hooks/use-toast'
   import { toast } from 'sonner'

   // Adicionar
   import { toast } from '@/lib/ui/toast-config'
   import { handleError, validateRequired } from '@/lib/errors/error-handler'
   ```

2. **Remover hook antigo**
   ```typescript
   // Remover
   const { toast } = useToast()
   ```

3. **Substituir chamadas de toast**
   ```typescript
   // ANTES (shadcn/ui)
   toast({
     variant: 'destructive',
     title: 'Erro',
     description: 'Mensagem',
   })

   toast({
     title: 'Sucesso',
     description: 'Operação concluída',
   })

   // DEPOIS (Sonner padronizado)
   toast.error('Mensagem')
   toast.successDino('Operação concluída!')
   ```

4. **Adicionar validações**
   ```typescript
   // ANTES
   if (!nome.trim()) {
     toast.error('Nome é obrigatório')
     return
   }

   // DEPOIS
   const nomeError = validateRequired(nome, 'Nome')
   if (nomeError) {
     toast.error(nomeError)
     return
   }
   ```

5. **Processar erros do Supabase**
   ```typescript
   // ANTES
   if (error) {
     toast.error('Erro ao salvar')
     return
   }

   // DEPOIS
   if (error) {
     const appError = handleError(error, 'database')
     toast.error(appError)
     return
   }
   ```

### Para Server Actions:

1. **Adicionar import**
   ```typescript
   import { handleError } from '@/lib/errors/error-handler'
   ```

2. **Processar erros**
   ```typescript
   try {
     // ... operação
     if (error) {
       const appError = handleError(error, 'database')
       return { success: false, error: appError.message }
     }
   } catch (error) {
     const appError = handleError(error, 'database')
     return { success: false, error: appError.message }
   }
   ```

---

## 📝 Checklist de Migração

### Níveis (`niveis/page.tsx`)
- [ ] Substituir `useToast` por toast do Sonner
- [ ] Adicionar validações com validateRequired
- [ ] Processar erros com handleError
- [ ] Testar create, update, delete
- [ ] Verificar mensagens de sucesso (usar successDino)

### Dashboard (`page.tsx`)
- [ ] Verificar tratamento de erro nas queries
- [ ] Adicionar toast de erro se necessário
- [ ] Testar carregamento com erro simulado

### Pessoas (`pessoas/page.tsx`)
- [ ] Substituir toast
- [ ] Adicionar validações (email, nome, etc)
- [ ] Processar erros com handleError
- [ ] Testar create, update, delete, filtros

### Actions (niveis.actions.ts)
- [ ] Importar handleError
- [ ] Processar erros do Supabase
- [ ] Padronizar mensagens de retorno
- [ ] Testar todas as operações

### Actions (pessoas.actions.ts)
- [ ] Importar handleError
- [ ] Processar erros do Supabase
- [ ] Padronizar mensagens de retorno
- [ ] Testar filtros e paginação

### Actions (dashboard.actions.ts)
- [ ] Importar handleError
- [ ] Processar erros nas queries
- [ ] Padronizar mensagens de retorno

---

## 🧪 Testes Recomendados

Após cada migração, testar:

1. **Validações de formulário**
   - Campo vazio
   - Email inválido (se aplicável)
   - Senha curta (se aplicável)

2. **Operações de CRUD**
   - Criar registro (sucesso e erro)
   - Editar registro (sucesso e erro)
   - Excluir registro (sucesso e erro)
   - Duplicar nome (erro de constraint)

3. **Permissões**
   - Tentar ação sem permissão
   - Verificar mensagem correta

4. **Erros de rede**
   - Desconectar internet
   - Tentar operação
   - Verificar mensagem amigável

5. **Toasts**
   - Verificar posição (top-right)
   - Verificar cores (brand)
   - Verificar botão de fechar
   - Verificar duração (4s)
   - Verificar emoji 🦖 em sucessos

---

## 💡 Dicas

### Uso do useFormValidation

Para formulários complexos com múltiplos campos:

```typescript
import { useFormValidation } from '@/hooks/use-form-validation'

function FormularioComplexo() {
  const { hasError, getError, setFieldError, clearFieldError } = useFormValidation()

  async function handleSubmit() {
    // Validar todos os campos
    const errors = []

    if (!nome) errors.push(validateRequired(nome, 'Nome'))
    if (!email) errors.push(validateEmail(email))

    // Se houver erros
    if (errors.length > 0) {
      const firstError = errors.find(e => e !== null)
      if (firstError) {
        toast.error(firstError)
        setFieldError(firstError.field!, firstError.message)
      }
      return
    }

    // Prosseguir...
  }

  return (
    <form>
      <Input
        value={nome}
        onChange={(e) => {
          setNome(e.target.value)
          clearFieldError('nome')
        }}
        className={hasError('nome') ? 'border-error' : ''}
      />
      {/* Opcional: mensagem inline */}
      <FormError error={getError('nome')} />
    </form>
  )
}
```

### Mensagens Personalizadas

Se precisar de mensagem específica que não está no mapeamento:

```typescript
// Criar AppError manualmente
const customError = {
  type: 'validation' as const,
  message: 'Mensagem específica do contexto',
  field: 'campo',
}
toast.error(customError)
```

### Log Centralizado

O `handleError()` já faz log automaticamente:

```typescript
// Não precisa mais fazer
console.error(error)

// Basta usar
const appError = handleError(error, 'database') // Já faz log
```

---

## 📊 Prioridade de Migração

1. **Alta Prioridade** (usuário interage mais)
   - ✅ Login (FEITO)
   - [ ] Níveis
   - [ ] Pessoas

2. **Média Prioridade**
   - [ ] Dashboard (só visualização)
   - [ ] Actions files

3. **Baixa Prioridade** (ainda não implementadas)
   - Times, Trilhas, Cargos, Projetos

---

## 🎯 Benefícios Após Completar

- ✅ Mensagens consistentes em toda aplicação
- ✅ Tradução automática de erros técnicos
- ✅ Personalidade da marca mantida (🦖)
- ✅ Código mais limpo e reutilizável
- ✅ TypeScript garante uso correto
- ✅ Fácil de adicionar novos erros
- ✅ Experiência do usuário melhorada
- ✅ Debug mais fácil (logs padronizados)

---

**🦖 Orgzilla** - Padronização em progresso!
