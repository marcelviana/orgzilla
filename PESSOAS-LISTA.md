# 👥 Lista de Pessoas - Orgzilla

> ⚠️ **DOCUMENTO DESATUALIZADO — não usar como referência.**
> Os exemplos abaixo mostram padrões que **já não valem**:
> - `selectFields += ', salario_atual, data_ultimo_reajuste'` na tabela `pessoa` — o salário **saiu de `pessoa`** para a tabela 1:1 `pessoa_remuneracao` e é buscado via `PessoaService` (nunca no `select` de `pessoa`).
> - `getTimeHierarchyIds(time do membro)` — a hierarquia do gestor agora é **fonte única** em `PermissaoService.getTimesHierarquia` (times que o gestor **gerencia** via `gestor_id` + descendentes, com proteção contra ciclos).
> - `UPDATE pessoa SET salario_atual = ...` — o salário vive em `pessoa_remuneracao`.
>
> Para arquitetura, ver **`CLAUDE.md`**; para o estado atual, **`STATUS.md`**.

Página de listagem de pessoas com filtros, busca e paginação, conectada ao Supabase.

## ✅ Implementação Completa

### Arquitetura

```
app/(dashboard)/pessoas/page.tsx (Server Component - busca dados)
    ↓
Server Actions (pessoas.actions.ts)
    ↓
Supabase (queries com filtros e paginação)
    ↓
PessoasTable (Client Component - renderiza UI)
```

## 📁 Arquivos Criados/Modificados

### 1. app/actions/pessoas.actions.ts - 🆕 Server Actions

**Funções Principais:**

```typescript
// Busca pessoas com filtros e paginação
getPessoasComFiltros(
  filters: PessoasFilters,
  pagination: PessoasPagination
): Promise<ActionResult<PessoasResult>>

// Busca times para o filtro (respeitando hierarquia para gestores)
getTimesParaFiltro(): Promise<ActionResult<Array<{ id: string; nome: string }>>>

// Busca cargos para o filtro
getCargosParaFiltro(): Promise<ActionResult<Array<{ id: string; nome: string }>>>

// Exporta pessoas para CSV
exportPessoasCSV(filters: PessoasFilters): Promise<ActionResult<string>>
```

**Tipos:**

```typescript
type PessoaListItem = {
  id: string
  nome: string
  nome_social: string | null
  email_corporativo: string | null
  email_pessoal: string | null
  foto_url: string | null
  status: 'ativo' | 'ferias' | 'licenca' | 'afastamento' | 'desligado'
  data_entrada: string | null
  cargo: {
    id: string
    nome: string
    nivel: { nome: string } | null
    trilha: { nome: string } | null
  } | null
  time: {
    id: string
    nome: string
  } | null
  tags: Array<{
    tag: {
      id: string
      nome: string
      cor: string
    }
  }>
  // Campos sensíveis (apenas para gestores)
  salario_atual?: number | null
  data_ultimo_reajuste?: string | null
}

type PessoasFilters = {
  search?: string      // Busca em nome, email
  timeId?: string      // Filtro por time
  cargoId?: string     // Filtro por cargo
  status?: string      // Filtro por status
  tagId?: string       // Filtro por tag
}

type PessoasPagination = {
  page: number
  itemsPerPage: number
}

type PessoasResult = {
  pessoas: PessoaListItem[]
  total: number
  page: number
  totalPages: number
}
```

**Query do Supabase:**

```typescript
// Query base (sem salários para admin/visualizador)
const selectFields = `
  id,
  nome,
  nome_social,
  email_corporativo,
  email_pessoal,
  foto_url,
  status,
  data_entrada,
  cargo:cargo_id (
    id,
    nome,
    nivel:nivel_id (nome),
    trilha:trilha_id (nome)
  ),
  time:time_id (id, nome),
  tags:pessoa_tag (
    tag:tag_id (id, nome, cor)
  )
`

// Para gestores, adicionar campos de salário
if (isGestor) {
  selectFields += `, salario_atual, data_ultimo_reajuste`
}

let query = supabase
  .from('pessoa')
  .select(selectFields, { count: 'exact' })
  .eq('ativo', true)

// Filtro de hierarquia para gestores
if (isGestor && timeIdsHierarquia.length > 0) {
  query = query.in('time_id', timeIdsHierarquia)
}

// Filtros dinâmicos
if (filters.search) {
  query = query.or(`nome.ilike.%${filters.search}%,email_corporativo.ilike.%${filters.search}%`)
}

if (filters.timeId && filters.timeId !== 'todos') {
  query = query.eq('time_id', filters.timeId)
}

if (filters.cargoId && filters.cargoId !== 'todos') {
  query = query.eq('cargo_id', filters.cargoId)
}

if (filters.status && filters.status !== 'todos') {
  query = query.eq('status', filters.status)
}

// Paginação
const from = (page - 1) * itemsPerPage
const to = from + itemsPerPage - 1
query = query.range(from, to)

// Ordenação
query = query.order('nome')
```

### 2. components/pessoas/pessoas-table.tsx - 🆕 Client Component

**Responsabilidades:**

- Renderizar tabela de pessoas
- Gerenciar estado de filtros locais (antes de aplicar)
- Navegação com query params para filtros e paginação
- Seleção múltipla de linhas
- Export para CSV
- Loading states durante transições

**Funcionalidades:**

1. **Busca em Tempo Real**
   - Campo de busca por nome ou email
   - Aplica filtro ao pressionar Enter ou clicar em "Aplicar Filtros"

2. **Filtros Expansíveis**
   - Time (dropdown com times permitidos)
   - Cargo (dropdown com todos os cargos)
   - Status (ativo, férias, licença, afastamento, desligado)
   - Botão "Limpar" para resetar todos os filtros

3. **Tabela Interativa**
   - Checkbox para seleção múltipla
   - Colunas: Nome, Cargo, Time, Status, Data Entrada, [Salário]
   - Coluna de Salário aparece APENAS para gestores
   - Clique na linha abre detalhes da pessoa
   - Dropdown de ações (Visualizar, Editar)

4. **Paginação Server-Side**
   - Seletor de itens por página (10, 25, 50, 100)
   - Botões de navegação (Anterior, Próxima)
   - Mostra página atual e total de páginas
   - Mantém filtros ao mudar de página

5. **Export CSV**
   - Exporta pessoas com filtros aplicados
   - Formato: Nome, Email, Cargo, Nível, Time, Status, Data Entrada
   - Download automático do arquivo

6. **Estados Vazios**
   - Mensagem amigável quando não há pessoas
   - Sugestão para ajustar filtros

7. **Bulk Actions**
   - Barra fixa no rodapé quando há seleção
   - Mostra quantidade de pessoas selecionadas
   - Botão para limpar seleção

### 3. app/(dashboard)/pessoas/page.tsx - ✨ Server Component

**Responsabilidades:**

- Verificar autenticação
- Parsear filtros da URL (searchParams)
- Buscar dados em paralelo usando `Promise.all()`
- Determinar se usuário pode ver salários (apenas gestores)
- Passar dados para componente Client

```typescript
export const revalidate = 30 // Revalidar a cada 30 segundos

export default async function PessoasPage({ searchParams }: PageProps) {
  const usuario = await getCurrentUser()
  if (!usuario) redirect('/login')

  // Parsear filtros da URL
  const filters = {
    search: searchParams.search,
    timeId: searchParams.timeId,
    cargoId: searchParams.cargoId,
    status: searchParams.status,
  }

  const pagination = {
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    itemsPerPage: searchParams.itemsPerPage ? parseInt(searchParams.itemsPerPage) : 10,
  }

  // Buscar dados em paralelo
  const [pessoasResult, timesResult, cargosResult] = await Promise.all([
    getPessoasComFiltros(filters, pagination),
    getTimesParaFiltro(),
    getCargosParaFiltro(),
  ])

  const canViewSalary = usuario.tipo_perfil === 'gestor'

  return (
    <DashboardShell>
      <PessoasTable
        initialData={pessoasData}
        times={times}
        cargos={cargos}
        canViewSalary={canViewSalary}
      />
    </DashboardShell>
  )
}
```

## 🎯 Permissões (LGPD)

### Coluna de Salário

**Regras:**

- ✅ **Gestor**: VÊ coluna de salário (apenas da sua hierarquia)
- ❌ **Admin**: NÃO VÊ coluna de salário (restrição LGPD)
- ❌ **Visualizador**: NÃO VÊ coluna de salário

**Implementação:**

```typescript
// Server Component determina permissão
const canViewSalary = usuario.tipo_perfil === 'gestor'

// Server Action seleciona campos condicionalmente
if (isGestor) {
  selectFields += `, salario_atual, data_ultimo_reajuste`
}

// Client Component renderiza coluna condicionalmente
{canViewSalary && <TableHead>Salário</TableHead>}
{canViewSalary && (
  <TableCell>
    {pessoa.salario_atual
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(pessoa.salario_atual)
      : '-'}
  </TableCell>
)}
```

### Filtro por Hierarquia (Gestores)

**Regras:**

- ✅ **Gestor**: Vê apenas pessoas dos times da sua hierarquia (time + filhos recursivos)
- ✅ **Admin**: Vê todas as pessoas
- ✅ **Visualizador**: Vê todas as pessoas

**Implementação:**

```typescript
async function getTimeHierarchyIds(timeId: string): Promise<string[]> {
  const ids = [timeId]

  // Buscar filhos recursivamente
  async function buscarFilhos(parentId: string) {
    const { data: filhos } = await supabase
      .from('time')
      .select('id')
      .eq('time_pai_id', parentId)

    if (filhos) {
      for (const filho of filhos) {
        ids.push(filho.id)
        await buscarFilhos(filho.id) // Recursão
      }
    }
  }

  await buscarFilhos(timeId)
  return ids
}

// Aplicar filtro na query
if (isGestor && timeIdsHierarquia.length > 0) {
  query = query.in('time_id', timeIdsHierarquia)
}
```

## 🔄 Fluxo de Filtros e Paginação

### 1. Usuário aplica filtros

1. Preenche campos de busca/filtros
2. Clica em "Aplicar Filtros"
3. Client Component constrói query params:
   ```
   /pessoas?search=maria&timeId=uuid&status=ativo&page=1&itemsPerPage=10
   ```
4. Navega para URL com filtros
5. Server Component parseia searchParams
6. Server Action executa query com filtros
7. Retorna dados filtrados
8. Client Component renderiza

### 2. Usuário muda de página

1. Clica em botão "Próxima"
2. Client Component mantém filtros atuais + muda page
3. Navega para:
   ```
   /pessoas?search=maria&timeId=uuid&status=ativo&page=2&itemsPerPage=10
   ```
4. Server Component busca página 2 com mesmos filtros
5. Client Component renderiza nova página

### 3. Usuário limpa filtros

1. Clica em "Limpar"
2. Client Component navega para `/pessoas` (sem params)
3. Server Component busca todos (página 1, 10 itens)
4. Client Component renderiza lista completa

## 🧪 Como Testar

### 1. Lista Vazia

**Cenário:** Banco sem pessoas

**Resultado esperado:**
- ✅ Tabela vazia mostra "Nenhuma pessoa encontrada"
- ✅ Filtros aparecem vazios
- ✅ Paginação mostra "de 0 pessoas"

### 2. Lista com Dados

**Preparação:**

```sql
-- Criar algumas pessoas
INSERT INTO pessoa (nome, email_corporativo, cargo_id, time_id, status, ativo, data_entrada)
VALUES
  ('Maria Santos', 'maria@empresa.com', '[cargo-id]', '[time-id]', 'ativo', true, '2023-01-15'),
  ('João Silva', 'joao@empresa.com', '[cargo-id]', '[time-id]', 'ativo', true, '2022-06-20'),
  ('Ana Costa', 'ana@empresa.com', '[cargo-id]', '[time-id]', 'ferias', true, '2024-02-10');
```

**Acesse `/pessoas`:**
- ✅ Mostra 3 pessoas
- ✅ Colunas: Nome (com avatar/iniciais), Cargo (com badge de nível), Time (com cor), Status (badge colorido), Data Entrada
- ✅ Paginação mostra "de 3 pessoas"

### 3. Busca por Nome

1. Digite "Maria" no campo de busca
2. Pressione Enter ou clique em "Aplicar Filtros"
3. ✅ URL muda para `/pessoas?search=Maria`
4. ✅ Mostra apenas "Maria Santos"
5. ✅ Contador mostra "de 1 pessoas"

### 4. Filtro por Time

1. Expanda "Filtros"
2. Selecione um time no dropdown
3. Clique em "Aplicar Filtros"
4. ✅ URL muda para `/pessoas?timeId=[uuid]`
5. ✅ Mostra apenas pessoas daquele time

### 5. Filtro por Status

1. Expanda "Filtros"
2. Selecione "Férias" no dropdown de Status
3. Clique em "Aplicar Filtros"
4. ✅ URL muda para `/pessoas?status=ferias`
5. ✅ Mostra apenas pessoas de férias

### 6. Múltiplos Filtros

1. Busca: "Silva"
2. Time: "Engenharia"
3. Status: "Ativo"
4. Clique em "Aplicar Filtros"
5. ✅ URL: `/pessoas?search=Silva&timeId=[uuid]&status=ativo`
6. ✅ Mostra apenas pessoas que atendem TODOS os critérios

### 7. Paginação

**Preparação:** Adicione 25+ pessoas

1. Acesse `/pessoas`
2. Selecione "10" itens por página
3. ✅ Mostra 10 pessoas
4. ✅ Paginação mostra "de 25 pessoas"
5. ✅ Botões de página (1, 2, 3)
6. Clique em "Próxima"
7. ✅ URL muda para `/pessoas?page=2&itemsPerPage=10`
8. ✅ Mostra próximos 10

### 8. Coluna de Salário (Gestor)

**Preparação:**

```sql
-- Criar usuário gestor
UPDATE usuario
SET tipo_perfil = 'gestor'
WHERE email = 'gestor@empresa.com';

-- Vincular à pessoa com time
UPDATE usuario
SET pessoa_id = '[pessoa-id-que-esta-em-time]'
WHERE email = 'gestor@empresa.com';

-- Adicionar salários às pessoas
UPDATE pessoa
SET salario_atual = 5000.00
WHERE id IN ('[id1]', '[id2]');
```

**Faça login como gestor:**
- ✅ Coluna "Salário" aparece na tabela
- ✅ Salários formatados em R$ (ex: R$ 5.000,00)
- ✅ Mostra apenas pessoas da hierarquia do gestor

**Faça login como admin:**
- ✅ Coluna "Salário" NÃO aparece
- ✅ Mostra todas as pessoas (sem filtro de hierarquia)

**Faça login como visualizador:**
- ✅ Coluna "Salário" NÃO aparece
- ✅ Mostra todas as pessoas

### 9. Export CSV

1. Aplique alguns filtros (ex: Time = "Engenharia")
2. Clique em "Exportar"
3. ✅ Download automático de arquivo CSV
4. ✅ Nome do arquivo: `pessoas-2025-11-18.csv`
5. ✅ CSV contém apenas pessoas filtradas
6. ✅ Colunas: Nome, Email, Cargo, Nível, Time, Status, Data Entrada
7. ✅ Toast: "🦖 Dados exportados com sucesso!"

### 10. Seleção Múltipla

1. Clique no checkbox da primeira pessoa
2. ✅ Linha fica com fundo laranja claro
3. ✅ Barra fixa aparece no rodapé: "1 pessoa selecionada"
4. Clique no checkbox de mais 2 pessoas
5. ✅ Barra atualiza: "3 pessoas selecionadas"
6. Clique no X na barra
7. ✅ Todas as seleções são limpas
8. ✅ Barra desaparece

### 11. Navegação para Detalhes

1. Clique em qualquer linha da tabela
2. ✅ Redireciona para `/pessoas/[id]`

### 12. Menu de Ações

1. Clique no botão "..." de uma pessoa
2. ✅ Dropdown abre com opções:
   - Visualizar → `/pessoas/[id]`
   - Editar → `/pessoas/[id]/editar`

### 13. Limpar Filtros

1. Aplique vários filtros
2. ✅ URL tem vários params
3. Clique em "Limpar"
4. ✅ URL volta para `/pessoas` (sem params)
5. ✅ Campos de filtro resetam para "Todos"
6. ✅ Busca fica vazia
7. ✅ Mostra todas as pessoas

## 🚀 Performance

### Otimizações

1. **Paginação Server-Side**
   - `.range(from, to)` busca apenas registros da página atual
   - Não busca todos os registros

2. **Count Otimizado**
   - `{ count: 'exact' }` retorna total sem buscar todos os dados
   - Usado para cálculo de totalPages

3. **Queries Paralelas**
   - `Promise.all()` busca pessoas, times e cargos simultaneamente
   - Tempo total = query mais lenta (não soma de todas)

4. **Cache Server-Side**
   - `export const revalidate = 30`
   - Cache de 30 segundos no Next.js
   - Reduz carga no banco

5. **Filtros na Query**
   - Filtros aplicados no Supabase (SQL)
   - Não filtra dados no JavaScript

6. **Eager Loading**
   - Busca cargo, time e tags em uma única query
   - Evita N+1 queries

### Queries Executadas

```typescript
// 1. Buscar pessoas (com count)
SELECT
  pessoa.*,
  cargo.*,
  nivel.*,
  trilha.*,
  time.*,
  pessoa_tag.*,
  tag.*,
  COUNT(*) OVER() as total
FROM pessoa
LEFT JOIN cargo ON pessoa.cargo_id = cargo.id
LEFT JOIN nivel ON cargo.nivel_id = nivel.id
LEFT JOIN trilha ON cargo.trilha_id = trilha.id
LEFT JOIN time ON pessoa.time_id = time.id
LEFT JOIN pessoa_tag ON pessoa.id = pessoa_tag.pessoa_id
LEFT JOIN tag ON pessoa_tag.tag_id = tag.id
WHERE pessoa.ativo = true
  AND [filtros dinâmicos]
ORDER BY pessoa.nome
LIMIT 10 OFFSET 0

// 2. Buscar times para filtro
SELECT id, nome FROM time WHERE ativo = true ORDER BY nome

// 3. Buscar cargos para filtro
SELECT id, nome FROM cargo WHERE ativo = true ORDER BY nome

// Total: 3 queries em paralelo
```

## 🔒 Segurança

### Validações

- ✅ Autenticação obrigatória (redirect para `/login`)
- ✅ Filtros de permissão aplicados nas queries (gestor vê hierarquia)
- ✅ Campos sensíveis (salário) não expostos para admin/visualizador
- ✅ Queries SQL-injection safe (Supabase usa prepared statements)

### Server-Side Rendering

- ✅ Dados buscados no servidor (Server Component)
- ✅ Nenhuma query exposta ao client
- ✅ Tokens de autenticação não vazam para o browser
- ✅ Permissões aplicadas no servidor (não confia no client)

## 🐛 Troubleshooting

### Tabela vazia (mas existem pessoas no banco)

**Causa:** Filtro `ativo = true` esconde pessoas desativadas

**Solução:**
1. Verifique se pessoas têm `ativo = true`
2. Execute: `UPDATE pessoa SET ativo = true`

### Gestor não vê pessoas do time

**Causa:** Usuário gestor não está vinculado a uma pessoa com time

**Solução:**
1. Verifique se `usuario.pessoa_id` está preenchido
2. Verifique se a pessoa tem `time_id` preenchido

### Coluna de salário aparece para admin

**Causa:** Lógica de permissão incorreta

**Solução:**
1. Verifique `usuario.tipo_perfil` no banco
2. Debug `canViewSalary` no Server Component

### Filtros não funcionam

**Causa:** Query params não chegam ao Server Component

**Solução:**
1. Verifique URL (deve ter `?search=...`)
2. Debug `searchParams` no Server Component
3. Veja console do terminal (server logs)

### Export CSV vazio

**Causa:** Filtros aplicados no export

**Solução:**
1. Export usa mesmos filtros da tabela
2. Para exportar tudo, limpe filtros antes

## 📝 Próximos Passos

- [ ] Implementar ordenação clicável nas colunas (nome, cargo, time, data)
- [ ] Adicionar filtro por tags (multi-select)
- [ ] Implementar busca avançada (múltiplos campos)
- [ ] Adicionar ações em massa (mover time, desativar)
- [ ] Implementar visualização em cards (mobile)
- [ ] Adicionar indicadores visuais (aniversariantes, novos, etc)
- [ ] Implementar cache de filtros no localStorage
- [ ] Adicionar export em PDF

---

**🦖 Orgzilla** - Sistema de Gestão de Times
