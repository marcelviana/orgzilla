# Roteiro de teste manual — Migração do Design System

> **Para o mantenedor executar no browser autenticado.** O agente não consegue passar do auth wall
> (`/login` sem sessão), então esta validação é manual. O roteiro nasce do que os commits
> `f77894a` → `f7e0132` mudaram de fato e do que o seed (`db/orgzilla_seed.sql`) plantou.
>
> Marque cada item: **✅ passou** / **❌ falhou** (anote o que viu).

---

## 🚨 SINAIS DE ALARME — se vir QUALQUER um destes, PARE e trate como bug sério

| # | Sintoma | Por quê é grave |
|---|---|---|
| **A1** | **Qualquer valor de salário / remuneração / reajuste aparecendo na aba "Histórico profissional"** (linha do tempo) de uma pessoa | A timeline (F12) é montada só de `historico_cargo` + `historico_time`. Salário ali = vazamento LGPD. |
| **A2** | **Admin (`admin@`) OU visualizador (`view@`) vendo salário** em qualquer tela (lista de pessoas, detalhe, aba "Histórico salarial", relatórios) | Regra: só **gestor** vê salário, e só da sua hierarquia. Admin é admin de sistema, não de RH. |
| **A3** | **Visualizador (`view@`) vendo seções de admin** em Configurações (Usuários, Níveis, Trilhas, Cargos, Tags, Times) | É exatamente o vazamento de UI que a F13 consertou (mock admin-fixo mascarava). |
| **A4** | Dialog de exclusão **fechando por ESC / clique-fora enquanto o spinner roda** (durante o delete) | A fase final travou o fechamento durante o loading. Reabrir no meio do delete = bug. |
| **A5** | Botão "Excluir" **ativo** num cargo que tem pessoas, ou num nível que tem pessoas/cargos | O `confirmDisabled` deve bloquear. Excluir mesmo assim quebra integridade. |

Se nenhum alarme disparar, siga a ordem abaixo (por risco, não por fase).

---

## 1. PREPARAÇÃO

### Subir a app
```bash
npm run dev        # http://localhost:3000
```
Confirme que o seed (`db/orgzilla_seed.sql`) já rodou e que os 3 usuários de login existem
(passo manual descrito no fim do seed).

### Os 3 logins (de `db/orgzilla_seed.sql`)
| Login | Perfil | O que deve ver |
|---|---|---|
| `admin@orgzilla.com` | **admin** | Tudo de admin em Configurações, **MAS NUNCA salário**. |
| `gestor@orgzilla.com` | **gestor** | Salário **só da sua hierarquia**; vinculado a uma pessoa de um time **com subtimes**. |
| `view@orgzilla.com` | **visualizador** | Lê pessoas/times (sem salário); **nenhuma** seção de admin em Configurações. |

> O seed vincula o `gestor@` a uma pessoa cujo time tem subtimes (bloco `UPDATE usuario SET pessoa_id…`),
> justamente para exercitar o recorte recursivo de hierarquia.

### Dados de referência que o seed plantou (gabarito do "espere ver X")
- **140 pessoas**, **~86% ativas** → ~14% em status não-ativo (férias / licença / afastamento / **desligado**).
- **Desligados NÃO têm `pessoa_remuneracao`** (seed só insere remuneração para quem não está desligado).
  → ~120 pessoas têm salário; desligados aparecem como "Não informado" mesmo para gestor.
- **~60 reajustes** (`historico_reajuste`, ~50% de quem tem remuneração) — use uma dessas pessoas para o teste A1/2.1.
- **16 níveis** (L1–L16), **5 trilhas**, **~40 cargos** (cada trilha em L1–L8), **~34 times** (hierarquia de 3 níveis: diretoria → área → squad), **12 projetos**, **~15 vagas**, **8 tags**.
- Cada time com pessoa ativa recebe um **gestor** (`gestor_id`).

> **Como achar uma pessoa COM reajuste** (para o teste crítico A1): no SQL editor do Supabase,
> `SELECT p.id, p.nome FROM pessoa p JOIN historico_reajuste h ON h.pessoa_id = p.id LIMIT 5;`
> Guarde um `id` — você vai abrir `/pessoas/<id>`.

---

## 2. TESTES POR PRIORIDADE DE RISCO

### 🔴 a. CRÍTICO — dado sensível (F12: timeline profissional)

> Objetivo: provar que a timeline real NÃO vaza salário, e que o gate de "Histórico salarial" continua gestor-only.
> Use a pessoa COM reajuste que você anotou na Preparação (não uma sem reajuste — o teste só vale se houver dado salarial no banco para ela).

| # | Login | Rota / passo | Resultado esperado | ✅/❌ |
|---|---|---|---|---|
| 2.1 | **gestor@** | `/pessoas/<id-com-reajuste>` → aba **"Histórico profissional"** | Linha do tempo com eventos de **cargo e time** (título + data + detalhe). **NENHUM** valor em R$, "salário", "reajuste" ou "%". Se a pessoa não tiver histórico, EmptyState "Sem histórico profissional ainda". | |
| 2.2 | **gestor@** | mesma pessoa → aba **"Histórico salarial"** | Card "Salário atual" com valor em **R$** (pessoa da hierarquia do gestor). Seção "Histórico de reajustes" aparece (texto "será implementado em breve" é esperado — não é bug). | |
| 2.3 | **admin@** | mesma pessoa → aba **"Histórico salarial"** | Cadeado 🔒 **"Informações restritas"** — "disponíveis apenas para gestores da hierarquia". **Sem nenhum valor de salário.** (Alarme A2 se aparecer R$.) | |
| 2.4 | **view@** | mesma pessoa → aba **"Histórico salarial"** | Mesmo cadeado 🔒 que o admin. Sem salário. | |
| 2.5 | **admin@** e **view@** | mesma pessoa → aba **"Histórico profissional"** | Timeline normal de cargo/time, **sem salário** (a action `getHistoricoProfissional` nunca toca `pessoa_remuneracao`). | |
| 2.6 | **gestor@** | `/pessoas/<id de pessoa FORA da hierarquia do gestor>` → "Histórico salarial" | Cadeado 🔒 (gestor só vê salário da própria hierarquia). | |

---

### 🔴 b. CRÍTICO — permissão / gating em Configurações (F13)

> Objetivo: cada perfil vê **exatamente** as seções certas. O vazamento consertado na F13: visualizador NÃO pode ver seções de admin.
>
> Em `/configuracoes`, as seções do grupo **"Sistema"** são `adminOnly`: **Usuários · Níveis · Trilhas de carreira · Cargos · Tags · Times**.
> Os grupos **"Conta"** (Meu perfil · Segurança · Notificações), **"Preferências"** (Aparência · Idioma) e **"Sobre"** (Sobre o sistema · Ajuda) são visíveis a todos.

| # | Login | Rota / passo | Resultado esperado | ✅/❌ |
|---|---|---|---|---|
| 2.7 | **admin@** | `/configuracoes` | Vê **todas** as seções, incluindo o grupo "Sistema" completo (Usuários, Níveis, Trilhas, Cargos, Tags, Times). Badge de perfil = "Administrador". | |
| 2.8 | **view@** | `/configuracoes` | **NÃO** vê nenhuma seção de "Sistema". Vê só Conta / Preferências / Sobre. Badge = "Visualizador". (Alarme A3 se aparecer Usuários/Níveis/etc.) | |
| 2.9 | **gestor@** | `/configuracoes` | Igual ao visualizador no menu lateral (seções de "Sistema" são `adminOnly`, e gestor ≠ admin). Badge = "Gestor". Na seção **Segurança** há um bloco extra visível a gestor+admin. | |
| 2.10 | **view@** | tentar abrir direto `/configuracoes/usuarios`, `/configuracoes/niveis`, `/configuracoes/cargos` | Deve ser **barrado** (sem permissão / toast "Você não tem permissão…" / redirecionado). NÃO deve carregar a tela de gestão. | |
| 2.11 | **view@** | `/configuracoes` → grupo "Sistema" não deve ter aba "Sistema" no topo | A `TabsTrigger value="usuarios"` ("Sistema") só renderiza para admin. Visualizador não vê. | |

---

### 🟠 c. ALTO — comportamento dos 3 dialogs de exclusão (fase final)

> Objetivo: loading interno trava o fechamento; gates bloqueiam exclusão indevida; toggle de time é coerente.
> Use **admin@** (perfil que gerencia essas telas).

#### Nível — `/configuracoes/niveis`
| # | Passo | Resultado esperado | ✅/❌ |
|---|---|---|---|
| 2.12 | Tentar **excluir um nível que tem pessoas ou cargos** (L1–L8 têm cargos; níveis com gente alocada) | Dialog "**Excluir nível?**" abre com aviso ⚠️ em **vermelho** (`text-danger`) e o botão **"Excluir nível" DESABILITADO** (`confirmDisabled` quando pessoas>0 ou cargos>0). Alarme A5 se estiver clicável. | |
| 2.13 | Excluir um nível **sem pessoas e sem cargos** (ex.: um L alto sem alocação, como L13–L16) | Botão "Excluir nível" habilitado; ao confirmar, spinner no botão, dialog fecha sozinho ao concluir, toast 🦖 de sucesso. | |
| 2.14 | Durante o delete do 2.13, apertar **ESC** e **clicar fora** enquanto o spinner roda | Dialog **NÃO fecha** até a operação terminar. (Alarme A4.) | |

#### Cargo — `/configuracoes/cargos`
| # | Passo | Resultado esperado | ✅/❌ |
|---|---|---|---|
| 2.15 | Menu (⋮) de um cargo **com pessoas** → "Excluir" | Dialog "**Excluir cargo?**" com texto vermelho "**Não é possível excluir. N pessoa(s) possui(em) este cargo. Mova-as primeiro.**" e botão **"Excluir" DESABILITADO**. Pluralização correta (1 pessoa "possui" / N "possuem"). | |
| 2.16 | "Excluir" num cargo **sem pessoas** | Descrição "Esta ação não pode ser desfeita.", botão habilitado; confirma → spinner → fecha → toast sucesso. | |

#### Usuário — `/configuracoes/usuarios`
| # | Passo | Resultado esperado | ✅/❌ |
|---|---|---|---|
| 2.17 | Menu (⋮) de um usuário → "Excluir" | Dialog "**Excluir usuário?**" com checkbox **"Entendo as consequências"** no corpo. Botão "Excluir" **DESABILITADO** até marcar a caixa (`confirmDisabled = !deleteConfirmed`). | |
| 2.18 | Marcar o checkbox, confirmar; abrir o dialog de novo depois | Marca habilita o botão; ao concluir fecha + toast. Reabrir → checkbox **resetado** (desmarcado). | |

#### Toggle de status de time — `/times/<id>`
| # | Passo | Resultado esperado | ✅/❌ |
|---|---|---|---|
| 2.19 | Time **ativo** → menu (⋮) → "**Desativar time**" | Dialog "**Desativar este time?**" (variante danger, botão "Desativar"). Confirma → badge muda para **"Inativo"**, toast "Time desativado com sucesso!". | |
| 2.20 | Mesmo time agora **inativo** → menu → "**Reativar time**" | Dialog "**Reativar este time?**" (variante info, botão "Reativar"). Confirma → badge volta a **"Ativo"**, toast "Time reativado com sucesso!". | |

---

### 🟡 d. MÉDIO — fluxos religados (F12: menus de pessoas/[id] e times/[id])

> Objetivo: menus antes inertes agora navegam; itens removidos NÃO voltaram.

#### `/pessoas/<id>` — menu (⋮) ao lado de "Editar"
| # | Passo | Resultado esperado | ✅/❌ |
|---|---|---|---|
| 2.21 | "**Mover para outro time**" | Navega para `/pessoas/<id>/editar`. | |
| 2.22 | "**Alterar status**" | Navega para `/pessoas/<id>/editar`. | |
| 2.23 | "**Ver histórico completo**" | Muda para a aba **"Histórico profissional"** na mesma página (não navega). | |
| 2.24 | Conferir o menu inteiro | **NÃO** existe item "**Adicionar a projeto**" (removido na F12). | |

#### `/times/<id>` — menu (⋮) ao lado de "Editar"
| # | Passo | Resultado esperado | ✅/❌ |
|---|---|---|---|
| 2.25 | "**Ver organograma**" | Navega para `/organograma` (geral — focado por time é débito conhecido, não bug). | |
| 2.26 | "Desativar/Reativar time" | Abre o ConfirmDialog (ver 2.19/2.20). | |
| 2.27 | Conferir o menu inteiro | **NÃO** existe "**Adicionar pessoa ao time**" (removido na F12). | |

---

### 🔵 e. VISUAL — varredura de aparência

> Olho clínico nas mudanças de design system. Pode rodar logado como qualquer perfil (salvo onde indicado).

| # | Fase | Onde | O que conferir | ✅/❌ |
|---|---|---|---|---|
| 2.28 | **F2** | Qualquer botão primário + item ativo da sidebar | Texto branco sobre laranja **mais escuro** (`primary-strong #C85F00`), legível (contraste AA). Não o laranja claro original. | |
| 2.29 | **F11** | `/` (Dashboard) — 4 cards de métrica | Ícones diferenciados por cor: **Total de pessoas = laranja** (primary), **Times ativos = ciano** (accent), **Vagas abertas = âmbar** (warning), **Projetos ativos = verde** (success). Valores em fonte de heading. | |
| 2.30 | **F4** | `/pessoas` (lista) e detalhes | StatusBadge semântico: **ativo = verde**, **férias = ciano/azul (info)**, **licença/afastamento = âmbar (warning)**, **desligado = vermelho (danger)**. Com ~14% não-ativos no seed, você deve ver variedade. Texto escuro sobre a tinta (legível). | |
| 2.31 | **F6** | `/pessoas` com busca que não retorna nada (ex.: "zzzzz") | EmptyState **diferenciando busca vazia** de lista vazia (mensagem de "nenhum resultado para o filtro", não "adicione o primeiro"). | |
| 2.32 | **F6** | abrir um `/pessoas/<id inexistente>` ou `/times/<id inexistente>` | EmptyState de erro com ação "**Voltar para a lista**" (ilustração de erro, não tela em branco). | |
| 2.33 | **F5** | Topo de `/pessoas`, `/times`, `/projetos`, `/configuracoes` | **Um único** título por tela + Breadcrumb começando em "Dashboard" → ChevronRight (›). Sem `>` literal, sem ícone Home, sem título duplicado vindo do shell. | |
| 2.34 | **B** | Abas, títulos de card, botões, rótulos de Select em geral | **Sentence case** (só a 1ª maiúscula): "Histórico profissional", "Excluir nível", etc. Nomes próprios preservados ("Dashboard", "Orgzilla", "Engenharia de Software"). Sem ALL CAPS. | |
| 2.35 | **F11/F6** | Recarregar qualquer lista (`/pessoas`, `/times`, `/configuracoes/cargos`) | Loading usa **skeletons** (TableSkeleton/CardSkeleton), **não** spinner de tela cheia. | |
| 2.36 | **F3.5/F4** | `/relatorios` e `/organograma` | Gráficos/canvas com paleta de tokens (cores categóricas dos charts; estados em verde/âmbar/vermelho/ciano), não cores cruas aleatórias. | |

---

## 3. Observações conhecidas (NÃO são bugs)

- "Histórico de reajustes será implementado em breve" na aba salarial (gestor) — placeholder esperado.
- "Ver organograma" leva ao organograma **geral**, não focado no time (débito §5-N do STATUS).
- Stats de `/configuracoes/trilhas` (6 / 42 / 127) são **hardcoded/mock** (débito §4) — não confie nesses números.
- Overflow das 5 abas em tela ~375px (mobile) é débito de design conhecido (§3.7) — apertado, mas não é regressão.

---

### Resumo de execução
- [ ] Seção a (sensível) — 6 itens
- [ ] Seção b (gating) — 5 itens
- [ ] Seção c (dialogs) — 9 itens
- [ ] Seção d (menus) — 7 itens
- [ ] Seção e (visual) — 9 itens

**Qualquer alarme A1–A5 → pare e reporte antes de continuar.**
