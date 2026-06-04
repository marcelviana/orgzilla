# Plano — Migração ao DESIGN_SYSTEM.md (estado e continuação)

> **Para retomar numa sessão NOVA e enxuta.** Este documento é autossuficiente: contém
> o que já foi feito (com commits) e o que falta (com os cuidados embutidos). Quem ler
> só este arquivo consegue continuar sem o histórico da conversa original.

---

## 1. Contexto e fonte de verdade

**O que é:** adequar todo o projeto ao `DESIGN_SYSTEM.md` (reescrito/expandido). A migração
foi quebrada em fases pequenas e revisáveis; F1–F11 já foram executadas (ver §2). Restam
as fases de §3 e os débitos de §4.

**Fonte de verdade (em conflito, vale nesta ordem):**
1. `STATUS.md` — estado real do projeto (o que está pronto/mock/quebrado).
2. `CLAUDE.md` — arquitetura em camadas e convenções de código.
3. `DESIGN_SYSTEM.md` — identidade visual, tokens, padrões de UI/UX.

Leia os três antes de começar qualquer fase. Em dúvida sobre *como a tela se parece/comporta*,
vale o `DESIGN_SYSTEM.md`; sobre *estado*, o `STATUS.md`; sobre *arquitetura*, o `CLAUDE.md`.

**Regra de processo (não negociável):**
- **UMA fase por vez.** Ao terminar, **PARE**, dê um resumo e **aguarde o "ok"** do mantenedor.
  Nunca emende a próxima fase sem confirmação.
- Fase grande → **sub-commits revisáveis** (um por preocupação/componente), nunca um commit
  gigante atravessando várias preocupações.
- Cada fase deve passar o gate de validação (§5) antes do commit.
- Decisão de design subjetiva ou que muda comportamento/permissão/salário → **pergunte antes**,
  não decida sozinho.

**Agentes auxiliares disponíveis:** `revisor-design` (crítica de UI), `revisor-camadas`
(aderência à arquitetura — acionar quando tocar acesso/fluxo de dados), `guardiao-rls-lgpd`
(dados sensíveis/RLS/permissão — read-only, pede confirmação humana), `escritor-testes`,
`sincronizador-docs` (atualiza STATUS/CLAUDE/README).

---

## 2. Fases CONCLUÍDAS (não refazer)

Todas com `tsc --noEmit` 0, `pnpm lint` 0, `pnpm build` ok, `pnpm test` 106/106 no momento do commit.

| Fase | O que fez | Commit |
|---|---|---|
| **F1 — Tokens** | Adiciona `primary-strong (#C85F00)` + semânticos (`success #1FA971`, `warning #E8A317`, `danger #FF5A5F`, `info #00C8FF` + `-light`) ao `app/globals.css` (`@theme inline`). | `f77894a` |
| **F2 — Contraste do laranja** | Texto branco sobre `#FF7A00` (reprova WCAG AA) → `primary-strong`. `Button` default vira `bg-primary-strong text-white`; item ativo da sidebar, badges, avatares, botões. | `df9f8d0` |
| **F3 — Tokeniza hex de className + text-gray** | `text-[#…]`/`bg-[#…]`/`border-[#…]` → tokens; `text-gray-*` → `foreground`/`muted-foreground` (claro) e `text-white/70…` (sidebar escura). | `51f4520` |
| **F3.5 — Chart tokens** | `--chart-1..8` + `--chart-grid`/`--chart-axis` em `:root` (FORA do `@theme inline`, senão não são emitidos p/ uso via prop). Religa Recharts/xyflow (relatorios, dashboard-content, organograma). | `4e25a37` |
| **F4 — StatusBadge + semântica §6.9** | `StatusBadge` único e normalizado (ativo→success, férias→info, licença/afastamento→warning, **desligado→danger**, inativo/encerrado→neutro); texto escuro sobre tinta (AA). Substitui 3 impls inline + badges de projeto/time. Estado em gráficos → `--success/--warning/--danger/--info` em `:root`. Trend up/down→success/danger. | `b31318f` |
| **F5 — PageHeader + remove título do shell** | `PageHeader` (com Breadcrumb) em todas as list/form/config/landing; `<h1>` de rota removido do `dashboard-shell`. Detalhe (pessoa/time/projeto), perfil, organograma e dashboard mantêm header próprio (DESIGN_SYSTEM §5), cada um com 1 `<h1>`. | `063ff08` |
| **F6 — EmptyState** | `<p>` cru de lista vazia → `EmptyState`, diferenciando vazio vs busca/filtro; "entidade não encontrada" → `illustration="error"` + ação; gráficos vazios → ícone neutro. | `164c936` |
| **F6 follow-up** | Casos que o grep da F6 não pegou (empties em `<h3>`/`<td>`/modais) + `bg-orange-500` residual em projetos. | `0e55538` |
| **F7 — ConfirmDialog** | Variantes do `confirm-dialog` → tokens semânticos + texto escuro (AA). `window.confirm` eliminado (projetos, times/novo, times/[id]/editar). `times/page` AlertDialog → ConfirmDialog. **Bug:** `Button variant="destructive"` usava `bg-destructive` (token inexistente) → `bg-danger text-secondary`. | `5943a1e` |
| **F8 — Inputs nativos → primitivos** | `<input type=radio\|checkbox>` → `RadioGroup`/`Checkbox`. Criado `components/ui/radio-group.tsx`. Handlers reescritos junto (`onChange/e.target` → `onValueChange(string)`/`onCheckedChange(boolean)`). | `0d4a4cb` |
| **F9 — Acessibilidade** | `aria-label` descritivo (por ação/entidade) em ~26 botões só-ícone; senha com label dinâmico. Nenhum estilo de foco alterado. | `f49b6d6` |
| **F10 — Toasts** | `sonner` cru → `handleError` (nos catch) + `toast-config` (mensagens próprias) em `dashboard-shell` e `pessoas-table`. | `476fb64` |
| **F11 — Polish** | Métricas do dashboard diferenciadas por token (primary/accent/warning/success); `Button` ganha `focus-visible:ring-offset-2`; âncora de contexto mobile no topbar (`<span>`, não `<h1>`); PageHeader responsivo; grids de conteúdo com breakpoints; `uppercase` removido (ALL CAPS); checkboxes decorativos de cargos removidos. | `8c73e9c` |
| **Fase B — Title Case → sentence case** | Passe completo de copy de UI para sentence case (§3.2): abas, títulos de seção/card/dialog, botões, labels, opções de Select, TableHead, StatsCard/PageHeader, nav. Sibling tabs corrigidas juntas (pessoas/[id], nova, editar). Toasts de exportação em relatórios incluídos. Dados/enums/nomes próprios preservados ("Dashboard", "Orgzilla", "Google", "Português (Brasil)", "Laranja Kaiju", "Engenharia de Software", presets de cor, mocks). Chave de filtro `'Com Pessoas'` trocada label+comparação. Ambíguas deixadas: assunto mailto (unauthorized), "Configurações > Usuários". | `2967a55` |
| **Fase A — SearchInput + StatsCard** | `SearchInput` em 7 telas (pessoas, times, projetos, configuracoes/{cargos,tags,trilhas,usuarios}); estendido com `onKeyDown` (preserva Enter→aplicar de pessoas), `className` (larguras/`hidden sm:block`) e `onClear` (botão X nas 6 client-side). `StatsCard` em dashboard, projetos e configuracoes/{cargos,niveis,tags,usuarios}; estendido com `iconWrapperClassName` (diferenciação por token, preserva F11), `href` (Link real, §7) e valor em `font-heading` (§3.2). Limpa cores não-token (orange-100/cyan-100/blue-*/green-*/error→tokens) e remove subtext fabricado "70% do time" (tags). **FilterPanel ADIADO** (ver §4); **trilhas stats** ficam inline (valores hardcoded — mock). | `f00172a`, `c9acb60` |

> Outros commits no histórico (ex.: `604e34a` memória de agente, `09066d6` gitignore,
> `fe16ecf`/`b15fbe6` edições do próprio DESIGN_SYSTEM.md) **não** são fases desta migração.

**Limitação de ambiente recorrente:** o agente **não consegue testar o caminho autenticado**
(o app redireciona para `/login` sem sessão/credenciais). Toda validação visual de telas de
dashboard ficou por inspeção de código + `build`/`tsc`/`lint`/`test`. Telas que dependem de
render autenticado precisam de **teste manual do mantenedor**.

---

## 3. Fases PENDENTES (em ordem; cuidados embutidos)

### Fase A — Adoção dos componentes compartilhados — ✅ CONCLUÍDA (ver §2)
`SearchInput` e `StatsCard` adotados (commits `f00172a`, `c9acb60`). **`FilterPanel` foi
ADIADO** por decisão consciente: na inspeção real, todas as telas de filtro têm toggle próprio
(`showFilters`/`filtersExpanded`) + sentinela `todos`/`all`, e o `FilterPanel` é autossuficiente
(header colapsável + contador `filter(Boolean)`). Adotá-lo sem estender causaria toggle duplo e
contador sempre-ativo. Registrado como débito em §4. `trilhas` manteve as stats inline porque
seus números (`6/42/127`) são hardcoded (mock) — componentizar daria aparência oficial a dado
falso; ver §4.

### Fase B — Passe de copy (Title Case → sentence case) — ✅ CONCLUÍDA (ver §2, `2967a55`)
Passe completo aplicado por sweep sistemático (3 padrões: 2 maiúsculas adjacentes; conector
minúsculo + Capitalizada; texto JSX em linha própria) antes de qualquer edição. Sibling tabs
corrigidas juntas. Dado/enum/nome próprio preservado. Decisão de regra: **palavras de entidade
PT** (pessoas, times, cargos, níveis, trilhas, tags) viram minúsculas em rótulos/prosa mesmo
quando nomeiam uma seção (ex.: "Ir para Pessoas"→"Ir para pessoas"), porque são substantivos
comuns; **"Dashboard"** permanece maiúsculo (nome de UI em inglês, raiz do breadcrumb).
Ambíguas deixadas como estão: assunto de email `mailto` (`app/unauthorized/page.tsx`) e
"Configurações > Usuários" (caminho de navegação nomeado, `configuracoes-client.tsx`).
Nota: stats hardcoded de `trilhas` (mock, §4) tiveram só a copy ajustada, não os números.

### Fase C — Overflow das abas no mobile — ✅ ENCERRADA COMO DÉBITO (não virou código)
Avaliado: trocar `grid-cols-5` por scroll horizontal **não é trivial** (muda a distribuição em
todos os breakpoints, exige classes responsivas convivendo com o estilo base do shadcn +
scroll-into-view da aba ativa) e é **mudança de UX de navegação** em telas **autenticadas**,
não validáveis no viewport real (auth wall). Decisão consciente de não fazer às cegas.
Registrado em `STATUS.md` §3.7 com o problema descrito e os locais
(`pessoas/[id]`:353, `pessoas/nova`:277, `pessoas/[id]/editar`:325). Requer implementação +
teste manual no mobile pelo mantenedor.

### Fase F12 — Remover mock + religar menus inertes
**Escopo:**
- Remover o mock `TIMELINE_DATA` (`app/(dashboard)/pessoas/[id]/page.tsx`) — hoje exibe uma
  timeline fictícia ("João") na aba de histórico de QUALQUER pessoa (dado falso renderizado
  como verdadeiro).
- Menus com `onClick={() => console.log(...)}` inertes em `pessoas/[id]` (Mover para time,
  Adicionar a projeto, Alterar status, Ver histórico) e `times/[id]` (Ver organograma,
  Adicionar pessoa, Alterar status) → ligar à **ação real** ou **remover** o item.

**Cuidados:**
- **ISTO TOCA DADOS/FLUXO**, não só visual. **Acione `revisor-camadas`.** Se conectar a
  timeline a dados reais, passe por Action → Service (nunca `supabase.from()` na UI).
- Não validável no ambiente do agente (auth wall) — **sinalize claramente o que ficou sem
  validação de browser** para o mantenedor testar manualmente.

### Fase F13 — currentUser mock → dado real de sessão
**Escopo:** substituir o `currentUser` mock "João Silva" por dado real da sessão em
`app/(dashboard)/configuracoes/configuracoes-client.tsx` (linha ~38) e `app/unauthorized/page.tsx`.

**Cuidados:**
- Toca **SESSÃO/USUÁRIO.** **Acione `revisor-camadas`** (usuário sempre do contexto de auth;
  nunca hardcode UUID — regra do CLAUDE.md).
- Se o `currentUser` real puxar qualquer dado de perfil que inclua **informação sensível**
  (remuneração/permissão), **acione TAMBÉM `guardiao-rls-lgpd`** e pare para confirmação.
- Não validável no ambiente do agente (auth wall) — depende de teste manual do mantenedor.

### Fase final — Extensão do ConfirmDialog + dialogs guardados
**Escopo:** estender `components/shared/confirm-dialog.tsx` com:
- `confirmDisabled?: boolean` (desabilitar o botão de confirmar por condição externa),
- `description` aceitando `ReactNode` (hoje é `string`),
- estado de `loading` no botão de confirmar (sem auto-fechar enquanto a ação async roda).

Então migrar os **3 dialogs de exclusão guardados** das config pages para o ConfirmDialog:
`configuracoes/usuarios` ("Excluir Usuário?"), `configuracoes/cargos` ("Excluir Cargo?" — bloqueia
quando há pessoas no cargo, botão disabled, descrição com markup), `configuracoes/niveis`
("Excluir Nível?" — com `isSubmitting`/loading). Hoje são `Dialog` cru porque o ConfirmDialog
atual não modela bloqueio condicional/disabled/loading.

**Cuidado:** é **design de API de componente**, não migração mecânica. Fazer **por último**,
quando nada mais vai mexer em confirmação, para não retrabalhar.

---

## 4. Débitos registrados (não são fases; anotar/decidir)

- **FilterPanel não adotado (adiado na Fase A).** O componente
  `components/shared/filter-panel.tsx` segue com ~0 uso. Para ser adotável sem regressão, precisa
  de: (a) **estado de abertura externo** (`open`/`onToggle` controlados) — hoje ele gerencia o
  próprio colapso, conflitando com o toggle que cada tela já tem; (b) **contador ciente de
  sentinela** — hoje conta `Object.values(values).filter(Boolean)`, e os valores `todos`/`all`
  (truthy) inflam o badge e nunca desabilitam o "Limpar"; (c) decidir o **item "Todos" por
  select** vs. valor vazio. Telas candidatas quando estendido: `pessoas` (filtro server-side via
  URL — passar por `applyFilters`/`clearFilters`), `times`, `cargos`, `usuarios`. `tags` (chips) e
  `trilhas` (botões) usam outra UX e podem nunca encaixar. Sem essa extensão, **não force** (era a
  opção "estender e aplicar amplo", não escolhida nesta rodada).
- **Stats de `configuracoes/trilhas` são hardcoded (mock).** Os 3 cards exibem `6` (trilhas),
  `42` (cargos) e `127` (pessoas) fixos no JSX, além de subtexts fabricados ("5 ativas, 1 inativa"
  etc.). Por isso ficaram **fora** da migração ao `StatsCard` na Fase A — componentizar daria
  aparência oficial a dado falso (§9 / CLAUDE.md "não adicione mocks"). Pendência: ligar a números
  reais (via Action/Service da trilha) **antes** de adotar o `StatsCard` ali. Próximo de F12.

- **Gradiente `#0F1419` do login** (`app/login/page.tsx`): hex cru numa superfície escura
  (não é data-viz). **Atenção:** já existe `--color-surface-dark` no `globals.css`, mas ele
  vale **`#ffffff`** (branco) — provável erro de nome herdado do scaffold; NÃO serve para o
  gradiente escuro. Decidir entre (a) corrigir o `--color-surface-dark` existente para a cor
  escura real e usá-lo, ou (b) criar um token novo com nome inequívoco (ex.: `--color-night`)
  e deixar/renomear o `surface-dark` branco. Não criar um `--surface-dark` "do zero" sem antes
  resolver o que já existe — colidiria. (Deferido desde a F3.)
- **Tokens-fantasma** (classes que NÃO resolvem para nenhum token e renderizam sem efeito):
  fazer um sweep. Confirmados como ainda ausentes do `@theme`: `text-primary-foreground`
  (usado por primitivos shadcn), `bg-destructive`/`text-destructive-foreground` (já corrigido
  no `Button` na F7, mas pode haver outros usos), `ring-destructive`. Cada um: definir o token
  no `globals.css` ou trocar pela classe correta — **não** silenciar com hex.
  *(Nota: `bg-input`/`border-input`/`border-border` NÃO são fantasmas — `--color-input` e
  `--color-border` estão definidos no `@theme inline` (#d1d5db). Não incluir no sweep.)*
- **`bg-gray-*` / `border-gray-*` / `hover:bg-gray-*`** ainda espalhados: a F3 tokenizou
  `text-gray-*` e hex de className, mas não os fundos/bordas cinza da paleta Tailwind padrão.
  Avaliar migração para `bg-muted`/`border-border` (muda o tom; conferir visual).
- **Cores de categoria ad hoc** em `cargos` (`trackColors`: `bg-blue-100`, `bg-green-100`…)
  e dots `bg-green-500`/`bg-gray-400` (ex.: radios de status em `times/novo`): decorativas/
  categóricas, não status semântico — decidir se padroniza ou deixa.
- **Foco — verificação leve (não débito de correção):** o `globals.css` tem a utility
  `.orgzilla-focus` com `ring-offset-2`, e a F11 adicionou `focus-visible:ring-offset-2` ao
  `Button`. O `--color-ring` segue `#ff7a00` (laranja), mas o `ring-offset` resolve o contraste
  (anel branco separa). Conferir apenas que não há **dois mecanismos de foco concorrentes**
  (utility + classe do Button) gerando offset duplicado em algum lugar.
- **Gate de CI** fixando **Node 24** (engine do projeto) rodando `tsc`+`lint`+`test`+`build`
  com `pnpm --frozen-lockfile`. (Já existe `.github/workflows/ci.yml` — confirmar que usa Node 24.)
- **Checkboxes decorativos / botão morto de cargos:** RESOLVIDOS (F11 removeu checkboxes de
  seleção de linha; F6 follow-up removeu "Criar Primeiro Cargo"). Só conferir que não voltaram.

---

## 5. Restrições globais (valem para TODAS as fases)

- **Sem `any`, sem `eslint-disable`, sem afrouxar config** (tsconfig/eslint), sem deps/actions
  com `"latest"`. Se a tipagem honesta não der, **pare e leve ao mantenedor** — não silencie.
- **Cor só via token** — nunca hex cru novo no JSX. Estrutura de tokens no `app/globals.css`
  (um único arquivo — não criar segundo):
  - **Marca e semânticos para uso via CLASSE** vivem no `@theme inline`: `--color-primary`,
    `--color-primary-strong`, `--color-secondary`, `--color-accent`, `--color-success`,
    `--color-warning`, `--color-danger`, `--color-info` (+ `-light`/`-hover`), etc. Geram
    utilitários `bg-*`/`text-*`/`border-*`.
  - **Data-viz para uso via PROP** vive em `:root` (FORA do `@theme inline`, senão o Tailwind
    não emite a var): `--chart-1..8`, `--chart-grid`, `--chart-axis`, e o ESPELHO semântico
    `--success`/`--warning`/`--danger`/`--info` (mesma cor dos `--color-*`, nome sem `--color-`,
    porque Recharts/xyflow consomem via `fill`/`stroke` onde `var()` é a única opção).
- **Nomenclatura:** arquivos de componente em **kebab-case SEM exceção** (inclui
  `components/shared/`; `components/ui/` segue o lowercase do shadcn, compatível); identificador
  do componente em **PascalCase**.
- **Gate por fase:** `npx tsc --noEmit` → 0 · `pnpm lint` → 0 · `pnpm build` → passa ·
  `pnpm test` → passa (106 testes) · **1 commit** (ou sub-commits revisáveis) · **PAUSA + resumo**
  aguardando ok.
- **Node 24** é o engine do projeto. O ambiente pode derivar para uma versão errada (já
  aconteceu o shell cair para Node v10, quebrando `tsc`/`pnpm`). Se acontecer, valide com:
  `export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"` antes de rodar os comandos.
- **Padrão de tipagem do Supabase query builder** (do CLAUDE.md): usar a interface
  `SelectQueryBuilder` (de `lib/repositories/base.repository.ts`) e forçar a conversão na
  criação da query com `as unknown as SelectQueryBuilder` — filtros condicionais reatribuem
  sem perder tipos. **Nunca** `let query: any` nem `eslint-disable`.
- **Segurança/LGPD:** salário vive em `pessoa_remuneracao` (1:1, RLS só gestor); admin e
  visualizador NÃO veem salário. Qualquer toque em remuneração/`pessoa_remuneracao`/
  `PermissaoService`/RLS/exposição de salário → **pare e confirme com o mantenedor**; acione
  `guardiao-rls-lgpd`. Proteção em profundidade: RLS no banco **e** filtragem no app, nunca só uma.
- **Ao final do conjunto de fases:** acionar `sincronizador-docs` e **atualizar o `STATUS.md`**
  (aderência ao DESIGN_SYSTEM.md, fases concluídas, débitos pendentes com motivo).

---

## 6. Decisões já tomadas nesta migração (não reabrir sem motivo)

- **desligado → `danger`** (era cinza) no StatusBadge.
- **Header próprio** (não PageHeader) é aceito em telas de identidade/canvas: detalhe de
  pessoa/time/projeto, perfil, organograma, dashboard (banner de boas-vindas) — cada uma com
  **exatamente um `<h1>`** + Breadcrumb compartilhado.
- **Texto escuro (`text-secondary`/foreground) sobre tinta semântica** em badges e botões de
  confirmação — porque os tokens semânticos são mid-shade e reprovariam AA com texto branco.
- **Chart tokens** = paleta categórica `--chart-1..8` (decisão de design já materializada).
- **Tokens semânticos existem em DOIS lugares, por design** (não é erro, não unificar):
  `--color-success`/`--color-warning`/`--color-danger`/`--color-info` no `@theme inline`
  (para classes `bg-*`/`text-*`) **e** `--success`/`--warning`/`--danger`/`--info` em `:root`
  (para consumo via prop `fill`/`stroke` em gráficos). Mesma cor, nomes distintos, intencional.