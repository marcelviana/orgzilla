# 🦖 DESIGN_SYSTEM — Orgzilla

> Identidade visual, fundamentos e padrões de interface do Orgzilla.
> Este documento é a **referência durável de design**. Em conflito sobre *o quê* o produto faz e seu estado, vale o `STATUS.md`; sobre *regras de arquitetura e convenções de código*, o `CLAUDE.md`; sobre **como a interface se parece e se comporta**, vale **este arquivo**.
>
> Serve a dois públicos: pessoas construindo telas, e o subagente `revisor-design`, que usa esta rubrica para criticar UI.

---

## 1. O que é o Orgzilla (contexto de design)

Orgzilla é um sistema de gestão de **pessoas, times, cargos e projetos** — uma ferramenta de trabalho usada por times de RH, gestores e lideranças. Quem usa passa tempo nela: lê tabelas densas, navega hierarquias, edita cadastros, interpreta dashboards. Logo, o design serve **clareza e confiança em uso prolongado**, não impacto de primeira impressão.

A marca é um **kaiju corporativo amigável**: esperto, enérgico, confiável; profissional mas acessível. O 🦖 é tempero, não prato principal.

Três perfis usam o produto, e a UI se adapta a eles: **admin** (gestão total), **gestor** (sua hierarquia, incluindo dados sensíveis como remuneração) e **visualizador** (leitura, sem dados sensíveis). Tratar permissão como dimensão de design — não só de backend — é parte do sistema (ver §6.8).

---

## 2. Princípios de design

1. **Clareza acima de charme.** A tela é ferramenta de trabalho. Quando personalidade e legibilidade brigam, legibilidade vence. O 🦖 nunca atrapalha a leitura de um dado.
2. **Consistência é a feature.** Um padrão repetido bem é melhor que três variações geniais. Antes de criar, reutilize o componente compartilhado.
3. **O sistema fala português, com calor.** Toda copy é PT-BR, em sentence case, com tom humano. Erro técnico cru nunca chega ao usuário.
4. **Restrição é design.** Espaço em branco, uma cor de destaque por contexto, um emoji onde rende — não em tudo. Densidade sem ruído.
5. **Permissão molda a interface.** O que cada perfil vê, e como, é decisão de design. Dado sensível some para quem não pode ver — não aparece desabilitado provocando curiosidade.

---

## 3. Fundamentos

### 3.1 Cor

**Paleta de marca**

| Token | Hex | Papel |
|---|---|---|
| `primary` | `#FF7A00` | Laranja Orgzilla. Identidade, destaque, acento. **Ver regra de contraste abaixo.** |
| `secondary` | `#1A2734` | Azul-noite. Superfícies escuras (sidebar), texto de alta ênfase, contraste. |
| `accent` | `#00C8FF` | Ciano. Destaque secundário, links, realces pontuais. |
| `surface` | `#F4F5F7` | Cinza de fundo. Áreas de respiro, fundo de conteúdo. |

**Cores semânticas** (estado, não marca)

| Token | Hex sugerido | Uso |
|---|---|---|
| `success` | `#1FA971` | Confirmações, status positivo (ativo). |
| `warning` | `#E8A317` | Atenção, status intermediário (licença/afastamento). |
| `danger` | `#FF5A5F` | Erro, ação destrutiva, status crítico (desligado). |
| `info` | `#00C8FF` | Informativo (reusa o accent). |

> Hoje o projeto aplica cores de status ad hoc (`bg-green-100`, `bg-red-100`…) direto nas telas. **Padronize por estas semânticas**, expressas como tokens/classes do tema — não hex cru espalhado.

**Regra de contraste do laranja (importante — corrige um furo de acessibilidade)**

O laranja `#FF7A00` com **texto branco** rende ~2.9:1 — **reprova no WCAG AA** (mínimo 4.5:1 para texto normal, 3:1 para texto grande). Isso afeta hoje botões primários, badges e o item ativo da sidebar.

Regras:
- **Não use texto branco sobre `#FF7A00`** em texto pequeno. Para rótulo de botão/badge sobre laranja, use o azul-noite `#1A2734` como cor de texto (contraste alto e on-brand), **ou** use uma variante mais escura do laranja como preenchimento.
- Defina e use **`primary-strong` (`#C85F00`)** como cor de preenchimento de elementos interativos que precisam carregar **texto branco** (botão primário, item ativo de menu). Com branco, `#C85F00` passa AA.
- Reserve `#FF7A00` puro para **acentos que não carregam texto pequeno**: ícones, bordas, indicadores, gráficos, realces, fundos com texto escuro.
- Em superfície escura (`secondary`), o laranja puro funciona como acento de texto/ícone — ali o contraste é alto.

**Hierarquia de texto** (sobre fundo claro)

| Papel | Cor |
|---|---|
| Texto primário | `#1A2734` (secondary) |
| Texto secundário | `~#5B6672` (cinza médio) |
| Texto terciário / placeholder | `~#8A93A0` |
| Texto sobre superfície escura | `#FFFFFF` / branco translúcido para secundário |

**Regra dura:** cores vêm sempre de **tokens** (variáveis CSS do `app/globals.css` / classes do tema Tailwind). **Nenhum hex cru no JSX** (`text-[#FF7A00]`, `bg-[#1A2734]`). Hex hardcoded é achado de revisão.

### 3.2 Tipografia

| Família | Uso |
|---|---|
| **Outfit** | Headings (h1–h4), números de destaque (métricas), rótulos de marca. |
| **Inter** | Corpo, tabelas, formulários, descrições, UI em geral. |

**Escala** (base 16px / 1rem)

| Nível | Tamanho | Peso | Uso |
|---|---|---|---|
| Display | 30px (1.875rem) | 700 | Título de página principal (h1) |
| H2 | 24px (1.5rem) | 600 | Seções |
| H3 | 20px (1.25rem) | 600 | Subseções, títulos de card |
| H4 | 16px (1rem) | 600 | Rótulos de bloco |
| Body | 14px (0.875rem) | 400 | Padrão de UI e tabelas |
| Small | 12px (0.75rem) | 400 | Metadados, legendas, breadcrumb |

- **Sentence case sempre** em títulos e botões ("Adicionar pessoa", não "ADICIONAR PESSOA" nem "Adicionar Pessoa"). ALL CAPS é achado.
- Altura de linha confortável para leitura de tabela (~1.4–1.5 no corpo).
- Não use mais de dois pesos por bloco. Hierarquia por tamanho/peso, não por cor isolada.

### 3.3 Espaçamento

Escala base **4px**, alinhada ao Tailwind: `1=4 · 2=8 · 3=12 · 4=16 · 6=24 · 8=32 · 12=48`.

- Respiro entre seções de página: `space-y-6` (24px).
- Padding interno de card: `p-6` (24px).
- Gap em grupos de controle: `gap-2`/`gap-3`.
- Densidade de tabela: linhas com altura confortável; não comprima abaixo do legível para caber mais.

### 3.4 Raio, elevação e bordas

- **Raio:** `rounded-lg` (~8px) para cards/inputs/botões; `rounded-full` para avatares, pills e o campo de busca; `rounded-xl` para superfícies maiores.
- **Borda:** fina e discreta (`border` em cinza claro). Borda separa; sombra eleva — não use as duas com força ao mesmo tempo.
- **Elevação:** sutil. `shadow-sm` para cards, sombra um pouco maior para overlays (dialog, dropdown, popover). Nada de sombra pesada — o Orgzilla é plano e limpo, não skeumórfico.

### 3.5 Movimento

- Transições rápidas e funcionais: **150–200ms**, easing padrão.
- Anime o que comunica estado: hover, abertura de overlay, entrada de toast, pulse de skeleton.
- **Não** anime de forma que atrase a leitura de dado. Respeite `prefers-reduced-motion`.

### 3.6 Ícones

- Biblioteca única: **Lucide** (`lucide-react`). Não misture com outra fonte de ícones.
- Tamanho padrão `h-4 w-4` (inline) ou `h-5 w-5` (ações de header). Consistente dentro do mesmo contexto.
- Ícone sozinho como botão **exige `aria-label`** (ver §7).
- Ícone reforça, não substitui rótulo, em ações primárias.

---

## 4. Voz, tom e personalidade 🦖

O Orgzilla é amigável e competente. Pense num colega esperto e bem-humorado — não num mascote que interrompe o trabalho.

**Onde o 🦖 aparece (com parcimônia):**
- Sucessos: `toast.successDino("Pessoa salva com sucesso!")` — 🦖 marca a vitória.
- Empty states: tom acolhedor que orienta o próximo passo ("Nenhuma pessoa por aqui ainda. Que tal adicionar a primeira?").
- Erros amigáveis: "Ops! Orgzilla tropeçou. Tente de novo." — nunca o stack trace ou código cru.

**Onde o 🦖 NÃO aparece:**
- Tabelas, formulários, labels, dados. Trabalho sério, tom neutro.
- Mais de um emoji por tela em geral. Repetição mata o charme.

**Copy:**
- PT-BR, sentence case, frases curtas e diretas.
- Fale com a pessoa ("você"), não sobre o sistema.
- Erro sempre diz o que aconteceu e o que fazer, em linguagem humana. A taxonomia vive no `PADROES-ERRO.md`.

---

## 5. Biblioteca de componentes

Dois níveis: **`components/ui/`** (primitivos shadcn/Radix — button, input, dialog, table, badge, skeleton…) e **`components/shared/`** (componentes de produto, padrão de fato do Orgzilla). Arquivos em **kebab-case**.

**Regra de ouro:** antes de escrever header, breadcrumb, empty state, skeleton ou modal de confirmação à mão, **use o componente compartilhado**. Reinventar o que já existe é achado de revisão.

| Componente | Quando usar |
|---|---|
| `page-header` | Cabeçalho de toda página: título, breadcrumb, badge de contexto, ações. Fonte única de breadcrumb. |
| `breadcrumb` | Trilha de navegação. Primeiro item sempre "Dashboard" → `/`. Separador `ChevronRight`. Usado pelo `page-header` e por telas de detalhe com header próprio. |
| `empty-state` | Toda lista/tabela vazia. Com tom 🦖 e, quando fizer sentido, um CTA. |
| `loading-state` (`TableSkeleton`, `CardSkeleton`, `DetailsSkeleton`, `ChartSkeleton`) | Carregamento de página. Escolha a variante que espelha o conteúdo. |
| `confirm-dialog` | Toda ação destrutiva (excluir, desativar). Variantes danger/warning/info. |
| `stats-card` | Métricas de dashboard. |
| `status-badge` | Status padronizado (pessoa, projeto…). |
| `search-input` | Campo de busca consistente. |
| `filter-panel` | Filtros de lista. |
| `avatar-stack` | Grupos de pessoas (membros de time/projeto). |
| `error-page` | Erros de página inteira (404, falha de carregamento). |

**Estados que todo componente interativo deve cobrir:** default, hover, focus (visível — ver §7), active, disabled, e quando aplicável loading/empty/error. Estado de foco invisível é achado.

---

## 6. Padrões de UX

### 6.1 Estrutura de página
Toda página usa `page-header` no topo (título + breadcrumb + ações). Evite **título duplicado**: se o shell já exibe o nome da rota, o `page-header` é o título de página — não repita um `<h1>` igual logo abaixo.

### 6.2 Carregamento
- **Carregamento de página/dados iniciais → skeleton** que espelha a estrutura final (tabela → `TableSkeleton`; detalhe → `DetailsSkeleton`; dashboard → `ChartSkeleton`/`CardSkeleton`). Mantenha o shell visível; só a área de conteúdo vira skeleton.
- **Ação pontual (submit de botão/modal) → spinner inline** no próprio controle.
- **Nunca** spinner de tela cheia no carregamento inicial. É achado.

### 6.3 Empty states
Lista vazia nunca é um `<p>` cru ("Nenhum dado encontrado."). Use `empty-state`: ilustração/emoji, mensagem com tom, e CTA quando houver ação óbvia ("Adicionar a primeira pessoa"). Diferencie "vazio porque não há dados" de "vazio porque o filtro não achou nada" — a copy muda.

### 6.4 Formulários e validação
- Use os primitivos do tema (`RadioGroup`, `Checkbox`, `Select`, `Switch`) — **não** `<input type="radio">`/`<input type="checkbox">` nativos sem estilo.
- Valide antes de enviar. Destaque o campo com erro; mensagem clara e específica.
- Reseta loading no `finally`. Limpa erro ao digitar. (Detalhes no `PADROES-ERRO.md`.)

### 6.5 Feedback (toasts)
Sistema único: **`handleError` + `toast-config`** (Sonner). Nunca `useToast`/`sonner` cru fora do padrão. Erro → `toast.error` com `AppError` tratado; sucesso → `toast.successDino`. Toast é confirmação, não substitui validação inline.

### 6.6 Ações destrutivas
Excluir/desativar **sempre** passam por `confirm-dialog`, com texto que diz a consequência ("8 pessoas serão desalocadas"). Para ações de alto impacto, exija confirmação digitada. Ação irreversível sem confirmação é achado crítico.

### 6.7 Exibição de dados
- **Tabela** para dados densos e comparáveis; **card** para entidades com identidade visual (pessoa, time); **stats-card** para números-chave.
- Diferencie métricas por cor/ícone quando ajudar o escaneamento — quatro cards monocromáticos idênticos dificultam achar o que se procura.
- Gráficos (Recharts) sempre em `ResponsiveContainer`; cores dos tokens semânticos, não aleatórias.

### 6.8 Interface ciente de permissão
- **admin / gestor / visualizador** veem interfaces diferentes. Esconda o que o perfil não pode usar — não mostre desabilitado sem explicação.
- **Dado sensível (remuneração)**: visível só a gestor da hierarquia, sempre via `PermissaoService`. Para admin e visualizador, **não renderize o dado** — não basta ocultar visualmente. Tabs/campos de salário não aparecem para quem não pode ver. (Risco de LGPD → escalar ao `guardiao-rls-lgpd`.)

### 6.9 Status
Use `status-badge` com a paleta semântica: ativo → `success`; férias → `info`; licença/afastamento → `warning`; desligado → `danger`. Mesma cor para o mesmo significado em todo o produto.

---

## 7. Acessibilidade (não-negociável)

- **Contraste:** texto normal ≥ 4.5:1, texto grande ≥ 3:1. Atenção ao laranja (§3.1) — a maior fonte de reprovação hoje.
- **Foco visível:** todo elemento interativo tem estado de foco claro. Nunca remova outline sem substituir por algo visível.
- **Botão só-ícone:** exige `aria-label` descritivo (ex.: sino → "Notificações"; logout → "Sair").
- **HTML semântico:** `<button>` para ação, `<a>`/`Link` para navegação, `<nav>` para breadcrumb. `<div onClick>` não é botão.
- **Teclado:** tudo operável por teclado; ordem de tab lógica; overlays prendem foco e fecham no Esc.
- **Rótulos:** todo input tem label (visível ou `aria-label`); placeholder não é label.

---

## 8. Responsividade

- **Mobile-first com breakpoints explícitos.** Grids declaram colunas por breakpoint: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — nunca `grid-cols-4` fixo.
- O shell já trata sidebar via `Sheet` no mobile; o **conteúdo** das páginas também precisa adaptar (cards, tabelas, ações).
- Tabela larga no mobile: scroll horizontal contido ou colapso para cartões — não deixe a página inteira rolar lateralmente.
- Alvos de toque confortáveis (mín. ~40px) em mobile.

---

## 9. Anti-padrões (não faça)

- ❌ Hex cru no JSX (`text-[#FF7A00]`). → Use tokens.
- ❌ Texto branco sobre laranja `#FF7A00` puro. → `primary-strong` ou texto azul-noite.
- ❌ Spinner de tela cheia no carregamento de página. → Skeleton.
- ❌ `<p>Nenhum dado encontrado.</p>`. → `empty-state`.
- ❌ Header/breadcrumb/modal de confirmação reinventados. → Componente compartilhado.
- ❌ Inputs nativos de radio/checkbox sem estilo. → Primitivos do tema.
- ❌ Ação destrutiva sem `confirm-dialog`.
- ❌ Erro técnico/`console.log`/código de erro exposto ao usuário.
- ❌ ALL CAPS; Title Case Em Tudo. → Sentence case.
- ❌ Badge/contador falso (número hardcoded sem fonte real). → Dado real ou nada.
- ❌ Emoji em excesso. → Um 🦖 onde rende.
- ❌ Dado sensível renderizado e só ocultado no CSS. → Não renderizar para quem não pode ver.
- ❌ `grid-cols-N` fixo sem breakpoints.
- ❌ Botão só-ícone sem `aria-label`.

---

## 10. Implementação

- **Tokens** vivem em `app/globals.css` (variáveis CSS) e são expostos via classes do tema Tailwind. Há **um único** arquivo de tokens — não recrie um segundo `globals.css`.
- **Fontes** Outfit/Inter carregadas no layout; o tema mapeia `font-heading`/`font-sans`.
- **Componentes** em kebab-case; identificador do componente em PascalCase.
- Ao introduzir um token novo (ex.: `primary-strong`, semânticos), **defina no `globals.css`** e use a classe — não espalhe o hex.
- Este documento e o código devem andar juntos. Divergência entre o que está aqui e o que a tela faz é débito — registre no `STATUS.md` e corrija.

---

*🦖 Orgzilla — clareza com personalidade.*