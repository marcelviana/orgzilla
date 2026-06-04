# 📌 STATUS — Orgzilla

> **Fonte única de verdade sobre o estado real do projeto.**
> Em caso de conflito entre este arquivo e `CLAUDE.md`, READMEs de camadas ou qualquer outra doc, **este arquivo prevalece** até ser revisado.

**Última atualização:** 4 de junho de 2026 (F13 concluída: `currentUser` mock "João Silva" removido de `configuracoes` e `unauthorized`; sessão real via `getUsuarioLogado()` em ambas; 2 débitos novos registrados em §3.3)

---

## 0. Documentação

A documentação foi **enxugada** para um conjunto pequeno e com dono claro. Os "retratos de momento" (docs de "como tal feature/fase foi construída", READMEs de camada, guias de setup superados) foram **removidos** por envelhecerem mal e passarem a enganar.

Conjunto atual:

- **Canônicos:** `README.md` (o que é + como rodar), `CLAUDE.md` (regras + arquitetura), `STATUS.md` (estado atual — este arquivo).
- **Referência durável:** `DESIGN_SYSTEM.md` (identidade visual) e `PADROES-ERRO.md` (padrão de erros/toasts).
- **Tooling de IA** (`.claude/`): subagentes em `.claude/agents/` (`revisor-camadas`, `escritor-testes`, `sincronizador-docs`,`guardiao-rls-lgpd`) e prompts de auditoria avulsos em `.claude/prompts/` (`PROMPT-sincronizar-docs.md`).

Removidos nesta limpeza (conteúdo útil migrado para os canônicos quando aplicável): `AUTENTICACAO.md`, `CONFIGURAR-SUPABASE.md`, `DASHBOARD.md`, `USUARIO-LOGADO.md`, `PESSOAS-LISTA.md`, `LOGIN-MELHORIAS.md`, `PROXIMOS-PASSOS-ERROS.md`, `lib/middleware/README.md`. (Os READMEs de `lib/repositories`, `lib/supabase` e `lib/types` já haviam sido removidos antes.)

---

## 1. Estado do banco de dados (LEIA PRIMEIRO)

🔴 **O projeto Supabase original foi perdido** (pausado +90 dias no free tier, sem reativação; restauração de backup falhou). O banco foi **recriado do zero** com os scripts abaixo.

Scripts de recriação (rodados nesta ordem):
1. `orgzilla_schema.sql` — recria as 17 tabelas, índices, helper de perfil e **RLS habilitado em todas as tabelas** com policies por perfil. **✅ Aplicado.**
2. `orgzilla_seed.sql` — popula dados de teste (~140 pessoas, hierarquia de times, projetos, tags, históricos, remuneração). **✅ Aplicado.**

Checklist de retomada do ambiente:
- [x] `orgzilla_schema.sql` rodado (RLS ativo em todas as tabelas)
- [x] `orgzilla_seed.sql` rodado (dados de teste carregados)
- [x] Cadeia Action → Service → Repository de pessoas/dashboard/times **validada em código**: filtro de hierarquia do gestor passou a aplicar de fato (BUG 2), hierarquia unificada numa fonte única com proteção contra ciclos (BUG 3), salário sem referências órfãs a `pessoa` (BUG 1); `npm run build` passa. (Re-teste de comportamento ponta-a-ponta depende de conectar o app ao banco — itens abaixo + §6.)
- [x] `.env.local` atualizado com URL + chaves do novo projeto
- [x] Mesmas variáveis configuradas na **Vercel**
- [ ] Google OAuth reconfigurado (novo redirect URI do projeto)
- [x] Usuários admin/gestor/visualizador criados no painel e vinculados em `usuario`
- [x] Teste de fumaça de RLS executado (§6)

⚠️ **Todos os dados atuais são de teste** (gerados pelo seed). Não há dado real/produção. Os usuários de login (admin/gestor/visualizador) são criados manualmente no painel de Authentication e vinculados na tabela `usuario` (instruções no fim do seed).

---

## 2. O que está construído (código)

> Distinção importante: os itens abaixo descrevem o que o **código** espera/faz. O que está **ativo e verificado no banco** depende de o `orgzilla_schema.sql` ter sido rodado e testado — ver §4.

- **Tipos** (`lib/types/database.ts`): 17 tabelas tipadas. Salário **fora de `pessoa`**, na tabela 1:1 `pessoa_remuneracao` (`salario_atual`, `data_ultimo_reajuste`, `motivo_ultimo_reajuste`), marcada `// SENSITIVE - LGPD`.
- **Separação de remuneração (código concluído):** `pessoa_remuneracao` acessada via `PessoaRemuneracaoRepository` → `PessoaService` (`buscarRemuneracao`/`salvarRemuneracao`), com a decisão de ver/editar centralizada em `PermissaoService` (`podeVerSalario`/`podeEditarSalario`, gestor da hierarquia). Admin e visualizador nunca recebem nem gravam remuneração; a UI só mostra salário para gestor.
  > ✅ Verificado contra o código: os nomes acima existem como descritos. Nenhuma query lê `salario_atual`/`data_ultimo_reajuste`/`motivo_ultimo_reajuste` da tabela `pessoa` (sem referências órfãs — grep limpo); o salário só é buscado de `pessoa_remuneracao` via `PessoaService`.
- **Repositories** (`lib/repositories/`): `base.repository.ts` (CRUD genérico, soft delete, contagens, existência) + repositories por entidade.
- **Services** (`lib/services/`): `AuthService`, `PermissaoService`, `AuditoriaService`, `HistoricoService`, `PessoaService`, `TimeService`, `VagaService`, `PessoaRemuneracaoRepository`, factory `createServices()`.
- **Server Actions**: auth, busca, cargos, dashboard, níveis, pessoas, projetos, tags, times, trilhas, usuários.
- **Dashboard** (`dashboard.actions.ts`): métricas, distribuições por nível/time, filtragem por hierarquia de gestor.
- **Autenticação**: email/senha + Google OAuth, middleware de rotas, auto-criação de usuário no 1º login.

---

## 3. O que está incompleto, quebrado ou inconsistente

### 3.1 Migração mock → real está pela metade (irregular)

| Página | Estado |
|---|---|
| `busca` | ✅ Dados reais via `buscarEntidades` (`busca.actions.ts`): executa em paralelo `getPessoasComFiltros`, `getTimesParaFiltro`, `getProjetosParaFiltro`, `getCargosParaFiltro` |
| `relatorios` | ✅ Dados reais via `relatorios.actions.ts`: distribuição por nível/status, top times, pessoas por cargo, vagas, projetos; tab Financeiro protegida por `PermissaoService` (gestor only, LGPD), agregados salariais com supressão n<3 |
| `configuracoes/page.tsx` (landing) | ⚠️ Dados reais via `getNiveisComEstatisticas`, `getTrilhasComEstatisticas`, `getTagsComEstatisticas`; histórico de login substituído por mensagem estática "em breve" (não implementado). `currentUser` mock removido: `page.tsx` busca `getUsuarioLogado()` e passa `usuario: UsuarioLogado` por prop ao client; gating `isAdmin`/`isGestor` reflete `tipo_perfil` real |
| `unauthorized/page.tsx` | ✅ Server component com `getUsuarioLogado()` + null-handling; nome e label de perfil passados a `unauthorized-client.tsx` (split necessário: rota fora do grupo `(dashboard)`, sem `UserProvider`). `export const dynamic = 'force-dynamic'` aplicado. Mock "João Silva" removido |
| `configuracoes/tags` | ✅ Pessoas reais via `getPessoasComTag`; import/export pendentes (disabled) |
| `perfil` (troca de senha) | ✅ Real: chama `atualizarSenhaAction` → `AuthService.atualizarSenha` |
| `configuracoes/cargos` | ✅ Real: cargos via `cargos.actions`, pessoas via `getPessoasNoCargo` com filtro de hierarquia |
| `configuracoes/trilhas` | ✅ Real: cargos via `CargoService.buscarCargosNaTrilha` (`getCargosNaTrilha`) e pessoas via `PessoaService.buscarPorTrilha` (`getPessoasNaTrilha`) com filtro de hierarquia para gestor |
| `pessoas/nova` | ✅ Dados reais (projetos e tags via `getProjetosParaFiltro`/`getTagsParaFiltro`) |
| `pessoas/[id]` (detalhe) | ✅ Dados reais (projetos, tags e anotações via `AnotacaoService`; aba "Histórico profissional" via `getHistoricoProfissional` → `HistoricoService` — cargos + times, sem reajuste/LGPD) |
| `pessoas/[id]/editar` | ✅ Dados reais (projetos e tags via `getProjetosParaFiltro`/`getTagsParaFiltro`) |
| `configuracoes/usuarios` | ✅ Usa actions reais; `mockUsers` removido |
| Dashboard | ✅ Dados reais |
| `pessoas` (lista) | ✅ Dados reais |
| `times` | ✅ Dados reais |
| `organograma` | ✅ Dados reais via `getOrganograma()` |

> Rastros `console.log('[v0]...')` confirmam origem v0.dev. Ao migrar seções com mock de projetos/tags, passar obrigatoriamente pelas actions correspondentes — nunca `supabase.from()` direto na UI.

> ⚠️ **Atenção LGPD ao migrar:** qualquer seção que exiba dados de pessoa deve garantir que salário passe pelo `PessoaService`/`PermissaoService` — nunca `supabase.from('pessoa_remuneracao')` direto na Action ou UI.

### 3.2 Testes
**Cobertura inicial implantada.** Vitest 4.1.8 instalado (pnpm, devDependency fixada). Script `test`/`test:watch` no `package.json`. 106 testes em 5 arquivos (`__tests__/`), todos passando.

| Arquivo | Testes | Estado |
|---|---|---|
| `__tests__/permissao.service.test.ts` | 22 | ✅ passando |
| `__tests__/time.service.test.ts` | 11 | ✅ passando |
| `__tests__/remuneracao.separacao.test.ts` | 12 | ✅ passando |
| `__tests__/repositories.test.ts` | 49 | ✅ passando |
| `__tests__/pessoa.service.enriquecer.test.ts` | 11 | ✅ passando |

**Bug resolvido:** `app/actions/relatorios.actions.ts` que acessava `supabase.from('pessoa_remuneracao')` diretamente foi migrado para `PessoaService.buscarAgregadosSalariais(usuario, timeIds)`. O teste `não há referência a supabase.from("pessoa_remuneracao") fora de lib/repositories` agora passa. Novos métodos introduzidos: `PessoaService.buscarAgregadosSalariais` (aplica guarda de perfil gestor + filtro de hierarquia) e `PessoaRemuneracaoRepository.findComCargoETimes` (query com join cargo/nível; tipo `RemuneracaoComCargo` definido no mesmo arquivo).

**Bug resolvido:** `PessoaRepository.findComFiltrosPaginados` passava `.eq('time_id', 'todos')` ao banco quando `filters.timeId` era o sentinela `'todos'`, em vez de ignorar o filtro. Corrigido adicionando `&& filters.timeId !== 'todos'` na condição da linha 352 de `lib/repositories/pessoa.repository.ts`. Teste em `repositories.test.ts` atualizado para verificar que o filtro `.eq` **não** é aplicado quando `timeId` é `'todos'`.

### 3.3 Débito arquitetural — padrões de acesso a dados misturados
A arquitetura-alvo (Repository → Service → Action → UI) ainda está **parcialmente aplicada**:

1. ✅ A lógica de **salário** foi extraída para `PessoaService`/`PermissaoService` (o antigo `selectFields` por perfil saiu). Sem referências órfãs a `pessoa.salario_atual` (verificado por grep).
2. ✅ **Hierarquia do gestor unificada (fonte única).** Removidas as cópias `getTimeHierarchyIds` (`pessoas.actions.ts` + `dashboard.actions.ts`) e `getTimeHierarchyIdsRecursive` (`times.actions.ts`). Todas as actions usam agora `PermissaoService.getTimesHierarquia` (regra correta: times que o gestor **gerencia** via `gestor_id` + descendentes). A recursão vive num só lugar — `PermissaoService.coletarSubarvore` (privado, **com proteção contra ciclos** por conjunto de visitados) — reutilizada por `getHierarquiaCompleta`, `TimeService.buscarDescendentes` e a checagem de ciclo de `times.actions`.
3. ✅ Queries cruas de `pessoas.actions.ts` e `dashboard.actions.ts` migradas para repositories: `PessoaRepository.findComFiltrosPaginados`, `PessoaRepository.findParaSelecao`, `TimeRepository.findAtivosParaFiltro`, `CargoRepository.findAtivosParaFiltro` (pessoas); `PessoaRepository` (countAtivasComStatus, countCriadasNoPeriodo, findParaNivelDistribuicao, findParaTimeDistribuicao), `TimeRepository.countAtivos`, `VagaTimeRepository.sumQuantidadeAtivasEmTimes`, `ProjetoProdutoRepository.countActive`, `HistoricoMudancaRepository.findRecent` (dashboard). `projetos.actions.ts` e `tags.actions.ts` já eram ✅.
4. ✅ `getTimesComEstatisticas` em `times.actions.ts` migrado para `TimeService.buscarComPermissao(usuario)` — não mais `timeRepo.findAll()` + filter manual.

**Débitos pendentes — resolvidos nesta rodada:**
- ✅ `pessoas.actions.ts`: função `anexarRemuneracaoLista` removida da Action; lógica LGPD de enriquecimento de lista com salário extraída para `PessoaService.enriquecerListaComRemuneracao`. Import direto de `PessoaRemuneracaoRepository` removido da Action.
- ✅ `dashboard.actions.ts`: blocos `catch` migrados de `console.error` para `handleError` (convenção de `lib/errors/error-handler.ts`).
- ✅ `times.actions.ts`: função `buildTimeHierarchy` eliminada; `getTimesHierarquia` usa `timeService.buscarHierarquiaComEstatisticas` (proteção a ciclos via Set de visitados). Tipos `TimeComEstatisticas` e `TimeHierarquico` definidos em `lib/services/time.service.ts`, re-exportados via `lib/services/index.ts` e `times.actions.ts`.

**Débitos abertos:**
- 🟥 `addPessoaAoProjeto` (`app/actions/projetos.actions.ts`) **fura a camada**: faz `supabase.from('pessoa_projeto_produto')` (select de verificação + insert) direto na Action, em vez de passar por Repository/Service de alocação. Débito **pré-existente**, não introduzido pela F12 (apenas constatado ao remover o menu que o acionaria — ver §5, item M). Migrar para o padrão (Repository de `pessoa_projeto_produto` → Service) numa fase futura, idealmente junto com a UI de alocação.
- 🟡 `<Lock>` dead code em `app/(dashboard)/configuracoes/configuracoes-client.tsx:878`: o ícone `<Lock>` é renderizado sob `item.adminOnly && !isAdmin`, mas a linha 865 (`if (item.adminOnly && !isAdmin) return null`) já descarta o item antes de chegar nesse ponto — o `<Lock>` é código inalcançável. Débito de limpeza; sem impacto funcional (registrado na F13).
- 🟡 **Assimetria de permissão em tags (decisão de produto pendente):** `app/actions/tags.actions.ts` (`checkPermission`) autoriza **admin OU gestor** no servidor, mas a UI de Configurações (`configuracoes-client.tsx:106`) gatea a seção "Tags" sob `item.adminOnly: true`, exibindo-a **apenas para admin**. Não é vulnerabilidade (o servidor impõe o perfil; visualizador é barrado nas duas camadas). Decisão de produto pendente: gestor PODE gerenciar tags (apertar a UI para incluir gestor) ou NÃO (apertar o servidor para `requireAdmin`)? Manter inconsistência indefinidamente não é opção — decidir e unificar (registrado na F13).

**Consequências (resolvidas):**
- ✅ Recursão de hierarquia não está mais duplicada nem desprotegida: era ilimitada (loop infinito em ciclo de `time_pai_id`); agora há uma única implementação com `Set` de visitados.
- ✅ **Auto-criação de usuário unificada**: ocorre em **1 lugar** (`lib/middleware/auth.middleware.ts:73` via `usuarioRepo.create`). O layout e o `auth.service.ts` não criam usuários — apenas consultam.

### 3.4 Dependências — builds não reprodutíveis
- **Lockfile:** apenas `pnpm-lock.yaml` (o `package-lock.json` foi removido). Use **pnpm** como gerenciador único.
- **Pins `"latest"` resolvidos** (item B do roadmap): os 19 especificadores `"latest"` foram substituídos por versões concretas com prefixo `^`, espelhando as versões já resolvidas no `pnpm-lock.yaml` (`@radix-ui/*`, `recharts`, `sonner`, `date-fns`, `next-themes`, `react-day-picker`, `@xyflow/react`, entre outros). `vaul` já usava `"^0.9.9"` (OK). Nenhuma versão foi bumpada — apenas os especificadores foram corrigidos.
- Stack bleeding edge (Next 16 + React 19.2) com versões agora fixadas; risco de quebra silenciosa por `"latest"` eliminado.

### 3.5 TypeScript — limpeza concluída
- `typescript.ignoreBuildErrors: true` foi **removido** de `next.config.mjs`. O build agora passa **com checagem de tipos ativa**.
- `tsc --noEmit` retorna **0 erros**. Partiu de ~63 erros (antes dos grupos G1–G9); todos resolvidos.
- **Corrigidos — grupo G1:**
  - `lib/types/index.ts`: `import type { StatusPessoa, TipoPerfil, TipoEntidade, TipoMudanca }` adicionado — resolvia TS2304 (identificadores não encontrados).
  - `lib/repositories/base.repository.ts`: casts `as unknown as SelectQueryBuilder` e `as unknown as Update` adicionados nos métodos CRUD/soft-delete — resolvia TS2345 (incompatibilidade de generics do Supabase SDK).
- **Corrigidos — grupo G2/G3:**
  - `lib/repositories/pessoa.repository.ts`: shape do JOIN `tags` normalizado — o Supabase retornava `{ tag: Tag }[]` (objeto aninhado) mas o cast esperava `Tag[]` direto. Desembrulhamento feito antes do cast.
  - `lib/repositories/time.repository.ts`: shape do JOIN `times_filhos` (auto-referência) normalizado — retornava `object | null` mas o cast esperava array. Normalizado para array vazio quando `null` antes do cast.
  - `lib/services/auditoria.service.ts`: (a) cast explícito `Json | null` aplicado aos campos `valor_anterior`/`valor_novo` do tipo Supabase (TS2345 de tipo literal vs. union); (b) mapeamento camelCase→snake_case corrigido no método `buscarComFiltros` (chaves de filtro não batiam com as colunas do banco).
- **Corrigidos — grupo G4:**
  - `app/actions/cargos.actions.ts`, `app/actions/tags.actions.ts`, `app/actions/times.actions.ts`, `app/actions/trilhas.actions.ts`: chamadas `findAll()` com argumentos inválidos (filters/orderBy/limit) migradas para `findMany()`, que aceita esses parâmetros — elimina erros TS2554 (argumentos inesperados) nesses 4 arquivos.
- **Corrigidos — grupo G5:**
  - `components/ui/tooltip.tsx` e `components/ui/skeleton.tsx` criados (componentes shadcn ausentes que causavam TS2307 — módulo não encontrado).
  - `components/shared/filter-panel.tsx:92`: cast de tipo corrigido (TS2345).
- **Corrigidos — grupo G6:**
  - `components/dashboard/dashboard-content.tsx:168`: campo `nome` renomeado para `name`; `percent ?? 0` adicionado onde o valor era possivelmente `undefined`.
  - `app/(dashboard)/relatorios/relatorios-client.tsx`: `percent ?? 0` aplicado em 3 locais; tipo explícito adicionado em 2 formatters anônimos — elimina erros TS2345/TS7006 nesses pontos.
- **Corrigidos — grupo G7:**
  - `configuracoes/configuracoes-client.tsx`: prop `readOnly` trocada por `disabled` no componente `Switch` (TS2322 — propriedade não existe).
  - `configuracoes/cargos/page.tsx`: estado inicial e reset do formulário corrigidos (`trilha`→`trilha_id`, `nivel`→`nivel_id`); null guards adicionados em `selectedPosition` (TS2322/TS18048).
  - `configuracoes/niveis/page.tsx`: campo do estado corrigido (`nivelAnteriorId`→`nivel_anterior_id`); null guards adicionados em `selectedLevel` — 17 erros eliminados (TS2322/TS18048).
  - `configuracoes/tags/page.tsx`: tipo `boolean|null` estreitado para `boolean` no prop `disabled` (TS2322).
  - `configuracoes/usuarios/page.tsx`: narrowing de `ActionResult` corrigido, remoção de referência a `user.avatar` (campo inexistente) e cast explícito `TipoPerfil` — elimina TS2339/TS2352.
- **Corrigidos — grupo G8:**
  - `organograma/page.tsx`: parâmetros de tipo explícitos adicionados a `useNodesState<Node>` e `useEdgesState<Edge>` — elimina erros de inferência de tipo genérico.
  - `pessoas/[id]/page.tsx`: narrowing de `ActionResult` corrigido com `else if (!result.success)` em vez de verificação isolada.
  - `projetos/page.tsx`: mesmo padrão de narrowing `ActionResult` aplicado.
- **Corrigidos — grupo G9:**
  - `times/novo/page.tsx`: prop `title` de ícone Lucide substituída por `aria-label` (a propriedade não existe no tipo); tipo de `availableTeams` ampliado para incluir `nivel?: number; path?: string`; guard `(team.nivel ?? 0)` adicionado onde o valor era potencialmente `undefined`.
  - `__tests__/pessoa.service.enriquecer.test.ts`: fixture `pessoaComExtras` tipada explicitamente com `Omit<...> & { remuneracao: Pick<PessoaRemuneracao, ...> | null }`.
- **Corrigidos — grupo G10 (erro final):**
  - `lib/repositories/base.repository.ts:191`: método `select` adicionado ao `SelectQueryBuilder`; método `update` passou a usar cast `as unknown as SelectQueryBuilder` — eliminava o último erro TS restante.
- **Total: 0 erros.** Todos os grupos G1–G10 resolvidos; `ignoreBuildErrors` removido.

### 3.6 Padronização de toast/erros — concluída
✅ Todos os arquivos migrados para `handleError` + `lib/ui/toast-config`. Nenhum arquivo em `app/` importa `useToast` ou `sonner` diretamente.

Convenção para código novo: usar sempre `handleError(error, tipo)` de `lib/errors/error-handler.ts` e os helpers de `lib/ui/toast-config` (`toast.error`, `toast.successDino`, etc.). Não usar `useToast`/`sonner` diretamente.

### 3.7 Débito de design — overflow das abas no mobile (Fase C, não resolvido por escolha)
As `TabsList` das telas de pessoa usam `grid w-full grid-cols-5` (cai para `grid-cols-4` sem aba financeira), espremendo 5 abas em telas estreitas (~375px):
- `app/(dashboard)/pessoas/[id]/page.tsx:353` — abas: informações gerais, histórico profissional, histórico salarial, projetos, anotações.
- `app/(dashboard)/pessoas/nova/page.tsx:277` e `app/(dashboard)/pessoas/[id]/editar/page.tsx:325` — abas: dados pessoais, dados profissionais, dados financeiros (gestor), projetos/produtos, tags.

**Por que ficou como débito (não foi alterado):** trocar o `grid-cols-5` por uma tab-strip com scroll horizontal **não é um swap trivial** — muda a distribuição das abas em todos os breakpoints (não só mobile), exigindo classes responsivas que convivam com o estilo base do shadcn (`inline-flex`/`h-9`/`bg-muted`/`p-1`) e tratamento de *scroll-into-view* da aba ativa e affordance de rolagem. É mudança de **UX de navegação**, e essas telas são **autenticadas** — não validáveis no viewport real do agente (auth wall). Decisão consciente: não fazer mudança de navegação às cegas. Requer implementação + **teste manual no mobile** pelo mantenedor.

---

## 4. Segurança

### 4.1 RLS — ativo no banco; comportamento ainda a verificar por teste
O `orgzilla_schema.sql` foi **aplicado** (✅), então o **RLS está habilitado nas 17 tabelas** com policies por perfil, incluindo as duas sensíveis:
- `pessoa_remuneracao`: acesso total (select/insert/update/delete) **apenas para `gestor`**.
- `historico_reajuste`: leitura/escrita **apenas para `gestor`**.

Não há "RLS pendente em outras tabelas" — está tudo ativo no mesmo script. O que **falta** é a verificação de comportamento de ponta a ponta (depende de conectar o app ao banco):

- [x] `orgzilla_schema.sql` rodado → RLS ativo
- [x] Testado: `visualizador` e `admin` **não** conseguem ler `pessoa_remuneracao` nem `historico_reajuste` direto via Supabase (teste de fumaça §6)

### 4.2 Defesa em profundidade do salário
- **Banco:** RLS gestor-only em `pessoa_remuneracao` e `historico_reajuste`.
- **Aplicação:** `PessoaService` só busca/grava remuneração quando `PermissaoService` autoriza (gestor da hierarquia). O recorte **por hierarquia** é responsabilidade do código — o RLS garante só "é gestor", não "é gestor *daquela* pessoa". ✅ O filtro de hierarquia é aplicado: lista, detalhe, criação e edição usam `PermissaoService.getTimesHierarquia`/`podeVerSalario` (fonte única) para limitar salário à hierarquia do gestor.
- 🧹 Removidos os helpers mortos `filterSensitiveFields`/`filterSensitiveFieldsArray` de `lib/middleware/permission.middleware.ts` (e seus exports): desestruturavam `salario_atual`/`data_ultimo_reajuste`/`motivo_ultimo_reajuste` de `pessoa`, campos que **não existem mais** ali (salário foi para `pessoa_remuneracao`) — eram no-ops sem nenhum uso real. A proteção de salário hoje é via RLS em `pessoa_remuneracao` + `PessoaService`/`PermissaoService`.

### 4.3 Regra de salário (centralizada)
Admin **não** vê salário (admin de sistema, não de RH); Gestor vê só da sua hierarquia; Visualizador não vê. Centralizado em `PermissaoService`, aplicado pelo `PessoaService`.

### 4.4 Auto-criação + OAuth sem restrição de domínio
Se o login Google não estiver restrito a um domínio, qualquer conta Google se autentica e vira `visualizador` com leitura de todas as pessoas (exceto salário). Travar o domínio.

---

## 5. Roadmap priorizado

### ✅ Concluído (anteriormente 🟨)
1. ✅ Migração para repositories: `pessoas`/`dashboard`/`times` — queries cruas eliminadas.
2. ✅ Recursão de hierarquia unificada em `PermissaoService.coletarSubarvore` (proteção a ciclos).
3. ✅ Auto-criação de usuário unificada em `auth.middleware.ts`.
4. ✅ Testes introduzidos — 98 testes passando (Vitest 4.1.8).
5. ✅ Débitos §3.3 resolvidos: LGPD extraída para `PessoaService.enriquecerListaComRemuneracao`;
   `buildTimeHierarchy` eliminada; `catch` de dashboard padronizados com `handleError`.
6. ✅ TypeScript limpo: 0 erros em `tsc --noEmit`; `ignoreBuildErrors` removido de `next.config.mjs`.
7. ✅ Concluído em 2 jun 2026 — pins `"latest"` substituídos por versões fixas (`^`) em 19 deps do `package.json`; lockfile consistente (`pnpm install --frozen-lockfile` passa); build e 98 testes passando.
8. ✅ Concluído em 2 jun 2026 — toast misto em `projetos/page.tsx` corrigido: `sonner`+`useToast` substituídos por `handleError`+`toast-config`; build e 98 testes passando.
9. ✅ Concluído em 2 jun 2026 — organograma migrado de mock hardcoded (`hierarchyData` estático) para dados reais via `getOrganograma()` chamando `TimeService`; elimina a última página mock do projeto.
10. ✅ Concluído em 2 jun 2026 — migração de toasts concluída (item D): 11 arquivos em `times/*`, `projetos/*`, `configuracoes/usuarios`, `pessoas/*` migrados de `useToast`/`sonner` para `handleError`+`toast-config`; nenhum uso direto de `useToast`/`sonner` permanece em `app/`.
11. ✅ Concluído em 2 jun 2026 — N+1 de times otimizado (item F, parcial): `TimeRepository.findEstatisticasAgregadas` reduz `getTimesComEstatisticas` de 4N+1 para 5 queries fixas; 7 novos testes; build e 106 testes passando.
12. ✅ Concluído em 3 jun 2026 — tipagem do query builder Supabase nos repositories: padrão `let query: any` eliminado em `pessoa.repository.ts`, `time.repository.ts` e `vaga-time.repository.ts`. `SelectQueryBuilder` exportado de `base.repository.ts`; cast `as unknown as SelectQueryBuilder` aplicado nos métodos com filtros condicionais. ~74 erros `@typescript-eslint/no-unsafe-*` zerados.
13. ✅ Concluído em 3 jun 2026 — lint zerado (0 errors, 0 warnings). Corrigidos: `no-useless-assignment` em testes de separação LGPD, `no-unused-vars`/`require-await` em testes, `no-unnecessary-type-assertion` em repositories/actions/organograma, `no-misused-promises` em `pessoas/[id]`, `restrict-template-expressions` em relatórios, `react-hooks/immutability` em projetos, `react-hooks/set-state-in-effect` em `busca/page.tsx` (bug real: estado derivado substituiu setStates síncronos no efeito) e em `projetos/page.tsx`. `tsc --noEmit`, 106 testes e build passando.
14. ✅ Concluído em 3 jun 2026 — gate de CI adicionado (`.github/workflows/ci.yml`): dispara em PR e push para `main`; roda tsc, lint, testes e build com Node 24 + pnpm frozen-lockfile. Padrão `SelectQueryBuilder` documentado na nova seção "Padrões de tipagem — Supabase" do `CLAUDE.md`. Agente `sincronizador-docs` atualizado para confrontar afirmações factuais do `CLAUDE.md` contra o repo.
15. ✅ Concluído em 3 jun 2026 — busca do header conectada à `/busca?q=`: `DashboardShell` agora usa `useRouter` e estado controlado (`headerSearch`); Enter e clique na lupa navegam para `/busca?q=<termo>`; `/busca` sincroniza estado quando o `?q=` muda via header (novo `useEffect` em `busca/page.tsx`). Badge numérico falso do sino removido; bloco comentado com TODO para reativar quando houver backend de notificações.
16. ✅ Concluído em 3 jun 2026 — loading de página padronizado em skeletons compartilhados (`components/shared/loading-state.tsx`): 15 spinners `Loader2` de tela cheia migrados para `TableSkeleton` (listas) ou `DetailsSkeleton` (detalhes/formulários); skeleton manual em `configuracoes/niveis` com `bg-gray-200` hardcoded migrado para `Skeleton` base + `TableSkeleton`. Spinners de ação (submit de modal/botão) mantidos por design. Caveat: `CardSkeleton` usa `lg:grid-cols-${columns}` dinâmico — não usar com `columns` arbitrário; valor padrão (3) pode não estar no CSS Tailwind em produção.
17. ✅ Concluído em 3 jun 2026 — breadcrumb centralizado em componente único (`components/shared/breadcrumb.tsx`): 15 breadcrumbs inline eliminados de 14 páginas; `PageHeader` usa o componente internamente. Convenção unificada: primeiro item sempre `{ label: "Dashboard", href: "/" }`, separador ChevronRight. Padrões eliminados: `>` literal, ícone Home, cores inconsistentes `text-gray-500`/`text-gray-900`.

### 🟥 Agora — débitos técnicos isolados (sem decisão de produto)

**✅ 2 jun 2026 — `styles/globals.css` removido.** Era resíduo órfão do scaffold v0/shadcn (tokens shadcn neutros + fonte Geist) sem nenhum import no projeto. Mantê-lo criava risco de reativação acidental pelo shadcn CLI sobrescrevendo os tokens de marca. `app/globals.css` permanece como única fonte de verdade.

### 🟨 Em seguida — padronização e segurança (sem decisão de produto)
E. **Restringir domínio no Google OAuth** (§4.4) — puramente técnico; qualquer conta
   Google hoje vira `visualizador` com leitura de todas as pessoas. Requer configuração
   no Supabase Auth + variável de ambiente.
F. **Otimizar queries N+1** — `findAllWithPessoaCount` (projetos e tags).
   `getTimesComEstatisticas` **concluído em 2 jun 2026**: novo método `TimeRepository.findEstatisticasAgregadas(timeIds)` reduziu de 4N+1 para 5 queries fixas (ex.: 20 times = 81 → 5 queries); 7 novos testes em `repositories.test.ts`. Restam: `ProjetoProdutoRepository.findAllWithPessoaCount` e `TagRepository.findAllWithPessoaCount` (sem otimização — adiar até sentir lentidão real).

### 🟩 Mais adiante — Phase 3 (requer decisões de produto — ver abaixo)
G. **Exportação** — formato, entidades e regras de acesso a definir.
H. **Viewer de auditoria** — perfis de acesso, filtros mínimos e retenção a definir.
I. **Upload de avatar** — bucket, tamanho máximo, campo no schema a definir.
J. **Busca avançada** — delta em relação à busca atual já real a definir.
K. **Endurecimento para produção** — rate limiting, revalidação de cache (após OAuth resolvido).
L. **Sistema de notificações** — sino no header já comentado aguardando backend. Requer tabela `notificacao`, Action/Service, políticas de acesso e UI. Badge numérico só reativar com fonte de dados real.
M. **UI de alocação a projeto a partir de `pessoas/[id]`** — o item de menu "Adicionar a Projeto" foi **removido na F12** porque não havia UI de seleção (projeto + data de início) e construí-la era feature nova, fora do escopo da migração de design. Requer um diálogo de seleção (projeto + data) ligado a `addPessoaAoProjeto`. Ao implementar, **migrar antes** `addPessoaAoProjeto` para a camada (ver §3.3, débito aberto). A alocação a projeto segue disponível pela página do projeto e pelo form de edição da pessoa.
N. **Organograma focado por time** — "Ver organograma" em `times/[id]` (F12) navega para o `/organograma` **geral**; a rota não aceita parâmetro de time. Focar o organograma no time aberto (ex.: `/organograma?time=<id>` com scroll/zoom no nó) requer plumbing de query-param + interação no canvas — adiado.
O. **Adicionar pessoa ao time a partir de `times/[id]`** — item de menu **removido na F12** (não havia UI de seleção de pessoa, e `pessoas/nova` não lê query-param de time). Requer um diálogo de seleção de pessoa existente → `updatePessoa(pessoaId, { time_id })`, ou plumbing de query-param em `pessoas/nova`. A alocação a time segue disponível pelo form de edição da pessoa.

### Decisões de produto pendentes antes da Phase 3
> Responder estas perguntas desbloqueia G–J. Sem resposta, os itens ficam em 🟩.

1. **Exportação:** formatos (CSV / Excel / PDF), entidades exportáveis, quem pode exportar
   e se o gestor exporta apenas da sua hierarquia.
2. **Auditoria:** quem acessa `historico_mudanca` (admin, gestor, ambos?), filtros
   mínimos, política de retenção.
3. **Avatar:** bucket público ou privado, tamanho/formatos, campo de destino no schema
   (`pessoa.foto_url` — existe? precisa de migration?).
4. **Busca avançada:** o que está faltando em relação à busca atual.