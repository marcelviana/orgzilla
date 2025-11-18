# 📊 Dashboard - Orgzilla

Dashboard principal com métricas e visualizações em tempo real, conectado ao Supabase.

## ✅ Implementação Completa

### Arquitetura

```
app/(dashboard)/page.tsx (Server Component - busca dados)
    ↓
Server Actions (dashboard.actions.ts)
    ↓
Supabase (queries otimizadas)
    ↓
DashboardContent (Client Component - renderiza UI)
```

## 📁 Arquivos Criados/Modificados

### 1. app/actions/dashboard.actions.ts - 🆕 Server Actions

**Funções:**

```typescript
// Busca métricas principais
getDashboardMetrics(): Promise<ActionResult<DashboardMetrics>>
  - Total de pessoas ativas
  - Total de times ativos
  - Total de vagas abertas (soma de quantidade)
  - Total de projetos ativos
  - Tendências (variação este mês vs mês passado)

// Distribuição de pessoas por nível (para gráfico de pizza)
getNivelDistribution(): Promise<ActionResult<NivelDistribution[]>>
  - Agrupa pessoas por nível (L1, L2, ..., L16)
  - Retorna com cores para o gráfico

// Distribuição de pessoas por time (para gráfico de barras)
getTimeDistribution(): Promise<ActionResult<TimeDistribution[]>>
  - Agrupa pessoas por time
  - Retorna top 5 times com mais pessoas

// Atividades recentes (últimas 5 mudanças)
getRecentActivities(): Promise<ActionResult<RecentActivity[]>>
  - Busca últimos 5 registros de historico_mudanca
  - Formata texto e ícone baseado no tipo
  - Calcula tempo relativo (2h atrás, 1d atrás, etc)
```

**Permissões:**

- **Admin**: Vê todas as métricas (toda a organização)
- **Gestor**: Vê apenas métricas da sua hierarquia (time + filhos)
- **Visualizador**: Vê todas as métricas (dados públicos)

**Filtros de Hierarquia:**

Para gestores, todas as queries filtram por `time_id IN (hierarquia)`:

```typescript
// Busca recursivamente todos os times da hierarquia
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
```

### 2. app/(dashboard)/page.tsx - ✨ Server Component

**Responsabilidades:**

- Verificar autenticação
- Buscar dados em paralelo usando `Promise.all()`
- Aplicar revalidação de cache (60 segundos)
- Passar dados para componente Client

```typescript
export const revalidate = 60 // Revalidar a cada 60 segundos

export default async function Page() {
  const usuario = await getCurrentUser()
  if (!usuario) redirect('/login')

  // Buscar todos os dados em paralelo
  const [metricsResult, nivelDistResult, timeDistResult, activitiesResult] =
    await Promise.all([
      getDashboardMetrics(),
      getNivelDistribution(),
      getTimeDistribution(),
      getRecentActivities(),
    ])

  // Passar para componente Client
  return (
    <DashboardShell>
      <DashboardContent
        userName={primeiroNome}
        currentDate={dataFormatada}
        metrics={metrics}
        nivelDistribution={nivelDistribution}
        timeDistribution={timeDistribution}
        recentActivities={recentActivities}
      />
    </DashboardShell>
  )
}
```

### 3. components/dashboard/dashboard-content.tsx - 🆕 Client Component

**Responsabilidades:**

- Renderizar toda a UI do dashboard
- Exibir gráficos interativos (Recharts)
- Mostrar estados vazios quando não há dados
- Links para páginas relacionadas

**Componentes:**

1. **Header de Boas-vindas**
   - Saudação personalizada com nome do usuário
   - Data atual formatada em português

2. **Cards de Métricas** (4 cards clicáveis)
   - Total de Pessoas → link para `/pessoas`
   - Times Ativos → link para `/times`
   - Vagas Abertas → link para `/times`
   - Projetos Ativos → link para `/projetos`
   - Cada card mostra tendência (↑↓→)

3. **Gráfico de Pizza - Distribuição por Nível**
   - Mostra % de pessoas em cada nível (L1, L2, ...)
   - Cores customizadas por nível
   - Estado vazio: "Adicione pessoas com cargos para ver a distribuição"

4. **Gráfico de Barras - Pessoas por Time (Top 5)**
   - Top 5 times com mais pessoas
   - Barras horizontais ordenadas por quantidade
   - Estado vazio: "Adicione pessoas aos times para ver a distribuição"

5. **Atividades Recentes**
   - Últimas 5 mudanças no sistema
   - Ícone e cor baseado no tipo de atividade
   - Tempo relativo (2h atrás, 1d atrás)
   - Estado vazio: "As alterações no sistema aparecerão aqui"

6. **Botões de Ação Flutuantes**
   - Botão grande (laranja): Adicionar Pessoa → `/pessoas/novo`
   - Botão pequeno (cyan): Criar Time → `/times/novo`

## 🎯 Dados Exibidos

### Métricas Principais

```typescript
{
  totalPessoas: number          // Count de pessoa WHERE ativo=true AND status='ativo'
  totalTimes: number            // Count de time WHERE ativo=true
  totalVagas: number            // SUM(quantidade) de vaga_time WHERE ativo=true
  totalProjetos: number         // Count de projeto_produto WHERE ativo=true
  tendenciaPessoas: number      // Diferença de pessoas este mês vs mês passado
  tendenciaTimes: number        // (não implementado ainda)
  tendenciaVagas: number        // (não implementado ainda)
  tendenciaProjetos: number     // (não implementado ainda)
}
```

### Distribuição por Nível

```typescript
[
  { nome: "L1", value: 15, color: "#FF7A00" },
  { nome: "L2", value: 32, color: "#FF9533" },
  { nome: "L3", value: 45, color: "#FFB066" },
  ...
]
```

**Query:**

```sql
SELECT
  pessoa.id,
  cargo.nivel.nome
FROM pessoa
LEFT JOIN cargo ON pessoa.cargo_id = cargo.id
LEFT JOIN nivel ON cargo.nivel_id = nivel.id
WHERE pessoa.ativo = true
  AND pessoa.status = 'ativo'
```

Agrupamento feito no código TypeScript.

### Distribuição por Time (Top 5)

```typescript
[
  { team: "Engenharia", count: 35 },
  { team: "Produto", count: 22 },
  { team: "Design", count: 18 },
  ...
]
```

**Query:**

```sql
SELECT
  pessoa.id,
  time.nome
FROM pessoa
LEFT JOIN time ON pessoa.time_id = time.id
WHERE pessoa.ativo = true
  AND pessoa.status = 'ativo'
```

Agrupamento e ordenação feitos no código TypeScript.

### Atividades Recentes

```typescript
[
  {
    text: "Nova pessoa adicionada ao sistema",
    time: "2h atrás",
    icon: "Users",
    color: "bg-blue-100 text-blue-600",
    created_at: "2025-11-18T10:30:00Z"
  },
  ...
]
```

**Query:**

```sql
SELECT *
FROM historico_mudanca
ORDER BY created_at DESC
LIMIT 5
```

**Mapeamento de Tipos:**

| tipo_entidade | tipo_mudanca | campo_alterado | Texto Exibido | Ícone | Cor |
|---------------|--------------|----------------|---------------|-------|-----|
| pessoa | criacao | - | Nova pessoa adicionada ao sistema | Users | Blue |
| pessoa | edicao | time_id | Pessoa mudou de time | Activity | Cyan |
| pessoa | edicao | cargo_id | Pessoa foi promovida | TrendingUp | Purple |
| time | criacao | - | Novo time criado | Network | Green |
| vaga_time | criacao | - | Nova vaga aberta | Briefcase | Green |
| projeto_produto | criacao | - | Novo projeto criado | FolderKanban | Orange |

## 🔄 Fluxo de Dados

1. **Usuário acessa** `/` (dashboard)
2. **Server Component** verifica autenticação
3. **Server Actions** buscam dados do Supabase em paralelo
4. **Filtros de permissão** aplicados nas queries:
   - Gestor: filtra por hierarquia de times
   - Admin/Visualizador: sem filtro (todos os dados)
5. **Cache** armazena resultado por 60 segundos
6. **Client Component** renderiza UI com os dados
7. **Gráficos** são renderizados com Recharts
8. **Revalidação** automática a cada 60 segundos

## 🧪 Como Testar

### 1. Dashboard Vazio (Novo Sistema)

**Cenário:** Banco de dados sem pessoas/times/projetos

**Resultado esperado:**
- ✅ Métricas mostram "0" em todos os cards
- ✅ Gráfico de níveis mostra "Nenhum dado disponível"
- ✅ Gráfico de times mostra "Nenhum dado disponível"
- ✅ Atividades recentes mostra "Nenhuma atividade recente"
- ✅ Header mostra nome do usuário logado e data atual

### 2. Dashboard com Dados

**Preparação:**

1. Crie alguns times:
   ```sql
   INSERT INTO time (nome, descricao, ativo)
   VALUES
     ('Engenharia', 'Time de engenharia', true),
     ('Produto', 'Time de produto', true),
     ('Design', 'Time de design', true);
   ```

2. Crie alguns níveis e cargos:
   ```sql
   -- (Já deve estar criado via página de Níveis)
   INSERT INTO cargo (nome, trilha_id, nivel_id, ativo)
   VALUES
     ('Engenheiro Pleno', '[trilha-id]', '[nivel-l2-id]', true),
     ('Designer Sênior', '[trilha-id]', '[nivel-l3-id]', true);
   ```

3. Crie algumas pessoas:
   ```sql
   INSERT INTO pessoa (nome, email_corporativo, cargo_id, time_id, status, ativo)
   VALUES
     ('João Silva', 'joao@empresa.com', '[cargo-id]', '[time-engenharia-id]', 'ativo', true),
     ('Maria Santos', 'maria@empresa.com', '[cargo-id]', '[time-produto-id]', 'ativo', true),
     ('Ana Costa', 'ana@empresa.com', '[cargo-id]', '[time-design-id]', 'ativo', true);
   ```

4. Crie um projeto:
   ```sql
   INSERT INTO projeto_produto (nome, ativo)
   VALUES ('Projeto Alpha', true);
   ```

5. Crie uma vaga:
   ```sql
   INSERT INTO vaga_time (time_id, cargo_id, quantidade, ativo)
   VALUES ('[time-id]', '[cargo-id]', 2, true);
   ```

**Acesse o dashboard:**
- ✅ Total de Pessoas: 3
- ✅ Times Ativos: 3
- ✅ Vagas Abertas: 2
- ✅ Projetos Ativos: 1
- ✅ Gráfico de níveis mostra distribuição (L2, L3, etc)
- ✅ Gráfico de times mostra 3 barras
- ✅ Atividades recentes mostra criações

### 3. Dashboard de Gestor (Apenas Hierarquia)

**Preparação:**

1. Crie um usuário gestor vinculado a um time:
   ```sql
   UPDATE usuario
   SET tipo_perfil = 'gestor'
   WHERE email = 'gestor@empresa.com';

   -- Vincular à pessoa que está em um time
   UPDATE usuario
   SET pessoa_id = '[pessoa-id-que-esta-em-time-engenharia]'
   WHERE email = 'gestor@empresa.com';
   ```

2. Crie times filhos:
   ```sql
   INSERT INTO time (nome, time_pai_id, ativo)
   VALUES
     ('Engenharia Backend', '[time-engenharia-id]', true),
     ('Engenharia Frontend', '[time-engenharia-id]', true);
   ```

3. Adicione pessoas aos times filhos:
   ```sql
   INSERT INTO pessoa (nome, email_corporativo, time_id, status, ativo)
   VALUES
     ('Pedro Backend', 'pedro@empresa.com', '[backend-id]', 'ativo', true),
     ('Paula Frontend', 'paula@empresa.com', '[frontend-id]', 'ativo', true);
   ```

**Faça login como gestor:**
- ✅ Deve ver apenas pessoas dos times: Engenharia + Backend + Frontend
- ✅ NÃO deve ver pessoas dos times: Produto, Design
- ✅ Métricas refletem apenas sua hierarquia
- ✅ Gráficos mostram apenas dados da hierarquia

### 4. Cache e Revalidação

**Teste:**

1. Acesse o dashboard
2. Anote os valores das métricas
3. Adicione uma nova pessoa pelo CRUD
4. **Aguarde 60 segundos** (tempo de revalidação)
5. Recarregue a página

**Resultado esperado:**
- ✅ Após 60s, dashboard atualiza com nova pessoa
- ✅ Total de pessoas aumentou em 1
- ✅ Gráficos atualizados
- ✅ Atividade recente mostra "Nova pessoa adicionada"

**Teste alternativo (forçar revalidação):**

1. Adicione `?revalidate=true` na URL
2. Ou faça hard refresh (Ctrl + Shift + R)

### 5. Estados Vazios

**Teste cada estado vazio:**

1. **Sem distribuição por nível:**
   - DELETE todas as pessoas OU remova cargo_id de todas
   - ✅ Mostra mensagem "Adicione pessoas com cargos para ver a distribuição"

2. **Sem distribuição por time:**
   - DELETE todas as pessoas OU remova time_id de todas
   - ✅ Mostra mensagem "Adicione pessoas aos times para ver a distribuição"

3. **Sem atividades recentes:**
   - TRUNCATE historico_mudanca
   - ✅ Mostra mensagem "As alterações no sistema aparecerão aqui"

### 6. Links de Navegação

**Teste os links clicáveis:**

- ✅ Card "Total de Pessoas" → `/pessoas`
- ✅ Card "Times Ativos" → `/times`
- ✅ Card "Vagas Abertas" → `/times`
- ✅ Card "Projetos Ativos" → `/projetos`
- ✅ Botão flutuante grande → `/pessoas/novo`
- ✅ Botão flutuante pequeno → `/times/novo`

## 🚀 Performance

### Otimizações Implementadas

1. **Queries Paralelas**
   - `Promise.all()` executa todas as queries simultaneamente
   - Tempo de resposta = query mais lenta (não soma de todas)

2. **Cache com Revalidação**
   - `export const revalidate = 60`
   - Cache server-side do Next.js
   - Reduz carga no banco

3. **Count Otimizado**
   - `{ count: 'exact', head: true }` - não retorna dados, só contagem
   - Queries de count são mais rápidas

4. **Agrupamento no Código**
   - Busca dados brutos do Supabase
   - Agrupamento feito em TypeScript (mais flexível)
   - Evita JOINs complexos

5. **Limit nas Atividades**
   - Apenas últimas 5 atividades
   - Ordenação no banco (indexed)

### Queries Executadas

```typescript
// 1. Total de pessoas (count only)
SELECT COUNT(*) FROM pessoa WHERE ativo = true AND status = 'ativo'

// 2. Total de times (count only)
SELECT COUNT(*) FROM time WHERE ativo = true

// 3. Vagas (soma de quantidade)
SELECT quantidade FROM vaga_time WHERE ativo = true

// 4. Total de projetos (count only)
SELECT COUNT(*) FROM projeto_produto WHERE ativo = true

// 5. Pessoas criadas este mês (count only)
SELECT COUNT(*) FROM pessoa WHERE ativo = true AND created_at >= '[primeiro-dia-mes]'

// 6. Pessoas criadas mês passado (count only)
SELECT COUNT(*) FROM pessoa WHERE ativo = true AND created_at BETWEEN '[mes-passado]' AND '[mes-atual]'

// 7. Distribuição por nível (dados completos)
SELECT pessoa.id, cargo.nivel.nome
FROM pessoa
LEFT JOIN cargo ON pessoa.cargo_id = cargo.id
LEFT JOIN nivel ON cargo.nivel_id = nivel.id
WHERE pessoa.ativo = true AND pessoa.status = 'ativo'

// 8. Distribuição por time (dados completos)
SELECT pessoa.id, time.nome
FROM pessoa
LEFT JOIN time ON pessoa.time_id = time.id
WHERE pessoa.ativo = true AND pessoa.status = 'ativo'

// 9. Atividades recentes (5 registros)
SELECT * FROM historico_mudanca
ORDER BY created_at DESC
LIMIT 5
```

**Total: 9 queries executadas em paralelo**

## 🔒 Segurança

### Validações

- ✅ Autenticação obrigatória (redirect para `/login`)
- ✅ Filtros de permissão aplicados nas queries
- ✅ Gestor vê apenas sua hierarquia
- ✅ Sem exposição de dados sensíveis (salários não aparecem)

### Server-Side Rendering

- ✅ Dados buscados no servidor (Server Component)
- ✅ Nenhuma query exposta ao client
- ✅ Tokens de autenticação não vazam para o browser

## 🐛 Troubleshooting

### Dashboard mostra zeros em tudo

**Causa:** Banco vazio ou sem dados ativos

**Solução:**
1. Verifique se há pessoas/times/projetos no banco
2. Verifique se `ativo = true` e `status = 'ativo'`
3. Execute queries manualmente no Supabase SQL Editor

### Gráficos não aparecem

**Causa:** Recharts não carregou ou dados vazios

**Solução:**
1. Verifique console do browser por erros
2. Certifique-se que Recharts está instalado: `npm install recharts`
3. Verifique se `nivelDistribution` e `timeDistribution` têm dados

### Gestor vê dados de fora da hierarquia

**Causa:** Lógica de hierarquia não aplicada ou pessoa sem time

**Solução:**
1. Verifique se o usuário gestor tem `pessoa_id` vinculado
2. Verifique se a pessoa tem `time_id` preenchido
3. Debug `getTimeHierarchyIds()` para ver IDs retornados

### Cache não atualiza

**Causa:** Next.js cache muito agressivo

**Solução:**
1. Aguarde 60 segundos (tempo de revalidação)
2. Faça hard refresh (Ctrl + Shift + R)
3. Adicione `?revalidate=true` na URL
4. Em dev: `npm run dev` limpa cache ao salvar arquivo

### Atividades recentes não aparecem

**Causa:** Tabela `historico_mudanca` vazia

**Solução:**
1. Verifique se há registros: `SELECT * FROM historico_mudanca LIMIT 10`
2. Crie/edite pessoas/times para gerar atividades
3. Audit log deve ser criado automaticamente nas ações (implementar nos outros CRUDs)

## 📝 Próximos Passos

- [ ] Implementar tendências reais para times, vagas e projetos
- [ ] Adicionar filtros de data no dashboard (este mês, último trimestre, etc)
- [ ] Implementar drill-down nos gráficos (clicar em nível → ver pessoas)
- [ ] Adicionar mais tipos de atividades (exclusões, desligamentos, etc)
- [ ] Implementar export de métricas (PDF, CSV)
- [ ] Adicionar comparativo mês a mês (gráfico de linha)
- [ ] Implementar métricas customizadas por usuário
- [ ] Adicionar widgets configuráveis (escolher quais métricas exibir)

---

**🦖 Orgzilla** - Sistema de Gestão de Times
