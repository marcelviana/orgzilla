# 📌 STATUS — Orgzilla

> **Fonte única de verdade sobre o estado real do projeto.**
> Em caso de conflito entre este arquivo e `CLAUDE.md`, READMEs de camadas ou qualquer outra doc, **este arquivo prevalece** até ser revisado.

**Última atualização:** 1 de junho de 2026 (migração mock → real: pessoas/[id] detalhe — projetos, tags e anotações agora reais via AnotacaoService)
**Resumo de uma linha:** Banco recriado do zero (schema + seed já aplicados, RLS ativo); falta conectar o app ao novo banco (env/OAuth/usuários), validar o RLS por teste e terminar a migração mock → real (restam: busca, relatórios, configuracoes, perfil).

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

Sequência completa de retomada: recriar projeto no Supabase → atualizar `.env.local` **e env vars na Vercel** (URL + chaves mudam) → rodar `orgzilla_schema.sql` → rodar `orgzilla_seed.sql` → criar os 3 usuários no painel e vincular → reconfigurar Google OAuth (novo redirect URI) → `npm run build`.

---

## 2. O que está construído (código)

> Distinção importante: os itens abaixo descrevem o que o **código** espera/faz. O que está **ativo e verificado no banco** depende de o `orgzilla_schema.sql` ter sido rodado e testado — ver §4.

- **Tipos** (`lib/types/database.ts`): 17 tabelas tipadas. Salário **fora de `pessoa`**, na tabela 1:1 `pessoa_remuneracao` (`salario_atual`, `data_ultimo_reajuste`, `motivo_ultimo_reajuste`), marcada `// SENSITIVE - LGPD`.
- **Separação de remuneração (código concluído):** `pessoa_remuneracao` acessada via `PessoaRemuneracaoRepository` → `PessoaService` (`buscarRemuneracao`/`salvarRemuneracao`), com a decisão de ver/editar centralizada em `PermissaoService` (`podeVerSalario`/`podeEditarSalario`, gestor da hierarquia). Admin e visualizador nunca recebem nem gravam remuneração; a UI só mostra salário para gestor.
  > ✅ Verificado contra o código: os nomes acima existem como descritos. Nenhuma query lê `salario_atual`/`data_ultimo_reajuste`/`motivo_ultimo_reajuste` da tabela `pessoa` (sem referências órfãs — grep limpo); o salário só é buscado de `pessoa_remuneracao` via `PessoaService`.
- **Repositories** (`lib/repositories/`): `base.repository.ts` (CRUD genérico, soft delete, contagens, existência) + repositories por entidade.
- **Services** (`lib/services/`): `AuthService`, `PermissaoService`, `AuditoriaService`, `HistoricoService`, `PessoaService`, `TimeService`, `VagaService`, `PessoaRemuneracaoRepository`, factory `createServices()`.
- **Server Actions**: auth, cargos, dashboard, níveis, pessoas, projetos, tags, times, trilhas, usuários.
- **Dashboard** (`dashboard.actions.ts`): métricas, distribuições por nível/time, filtragem por hierarquia de gestor.
- **Autenticação**: email/senha + Google OAuth, middleware de rotas, auto-criação de usuário no 1º login.

---

## 3. O que está incompleto, quebrado ou inconsistente

### 3.1 Migração mock → real está pela metade (irregular)

| Página | Estado |
|---|---|
| `busca` | ❌ Mock puro (`mockPeople`, `mockTeams`, `mockProjects`, `mockPositions`) |
| `relatorios` | ❌ Mock puro + `console.log('[v0]')` em export/filtro de data |
| `configuracoes/page.tsx` (landing) | ❌ Mock puro (`mockLevels`, `mockTrilhas`, `mockTags`, `mockLoginActivity`) |
| `configuracoes/tags` | ❌ Mock (`mockPeople`) + `console.log('[v0]')` em merge/import/export |
| `perfil` (troca de senha) | ❌ Falsa: `console.log("[v0]")` + `setTimeout` + toast de sucesso sem chamar API |
| `configuracoes/cargos` | ⚠️ Cargos via `cargos.actions` (real), mas painel de pessoas-no-cargo usa `mockPeople` hardcoded |
| `configuracoes/trilhas` | ⚠️ Trilhas via `trilhas.actions` (real), mas seções de posições/pessoas usam `mockPositions`/`mockPeople` hardcoded |
| `pessoas/nova` | ✅ Dados reais (projetos e tags via `getProjetosParaFiltro`/`getTagsParaFiltro`) |
| `pessoas/[id]` (detalhe) | ✅ Dados reais (projetos, tags e anotações via `AnotacaoService`) |
| `pessoas/[id]/editar` | ✅ Dados reais (projetos e tags via `getProjetosParaFiltro`/`getTagsParaFiltro`) |
| `configuracoes/usuarios` | ✅ Usa actions reais; `mockUsers` removido |
| Dashboard | ✅ Dados reais |
| `pessoas` (lista) | ✅ Dados reais |
| `times` | ✅ Dados reais |

> Rastros `console.log('[v0]...')` confirmam origem v0.dev. Ao migrar seções com mock de projetos/tags, passar obrigatoriamente pelas actions correspondentes — nunca `supabase.from()` direto na UI.

> ⚠️ **Atenção LGPD ao migrar:** qualquer seção que exiba dados de pessoa deve garantir que salário passe pelo `PessoaService`/`PermissaoService` — nunca `supabase.from('pessoa_remuneracao')` direto na Action ou UI.

### 3.2 Testes
**Cobertura zero.** Sem script de teste no `package.json`, sem framework instalado, sem arquivos de teste.

### 3.3 Débito arquitetural — padrões de acesso a dados misturados
A arquitetura-alvo (Repository → Service → Action → UI) ainda está **parcialmente aplicada**:

1. ✅ A lógica de **salário** foi extraída para `PessoaService`/`PermissaoService` (o antigo `selectFields` por perfil saiu). Sem referências órfãs a `pessoa.salario_atual` (verificado por grep).
2. ✅ **Hierarquia do gestor unificada (fonte única).** Removidas as cópias `getTimeHierarchyIds` (`pessoas.actions.ts` + `dashboard.actions.ts`) e `getTimeHierarchyIdsRecursive` (`times.actions.ts`). Todas as actions usam agora `PermissaoService.getTimesHierarquia` (regra correta: times que o gestor **gerencia** via `gestor_id` + descendentes). A recursão vive num só lugar — `PermissaoService.coletarSubarvore` (privado, **com proteção contra ciclos** por conjunto de visitados) — reutilizada por `getHierarquiaCompleta`, `TimeService.buscarDescendentes` e a checagem de ciclo de `times.actions`.
3. ⚠️ O **restante** das queries de `pessoas.actions.ts` (linhas 148, 238, 273, 316) e `dashboard.actions.ts` (linhas 78, 91, 103, 116, 127, 140, 199, 284) ainda usa `supabase.from(...)` cru (leitura com filtros) — migração para Services pendente (não-bloqueante). `projetos.actions.ts` (`getProjetosParaFiltro`) e `tags.actions.ts` (`getTagsParaFiltro`) já foram migrados para `ProjetoProdutoRepository.findAll()` e `TagRepository` respectivamente — ✅ concluído.
4. `times.actions.ts` usa `TimeRepository` direto (pula `TimeService`).

**Consequências (resolvidas):**
- ✅ Recursão de hierarquia não está mais duplicada nem desprotegida: era ilimitada (loop infinito em ciclo de `time_pai_id`); agora há uma única implementação com `Set` de visitados.
- ✅ **Auto-criação de usuário unificada**: ocorre em **1 lugar** (`lib/middleware/auth.middleware.ts:73` via `usuarioRepo.create`). O layout e o `auth.service.ts` não criam usuários — apenas consultam.

### 3.4 Dependências — builds não reprodutíveis
- **Lockfile:** apenas `pnpm-lock.yaml` (o `package-lock.json` foi removido). Use **pnpm** como gerenciador único.
- **Pins `"latest"`** em várias deps (`@radix-ui/*`, `recharts`, `sonner`, `date-fns`, `next-themes`, `react-day-picker`). `vaul` já usa `"^0.9.9"` (OK).
- Stack bleeding edge (Next 16 + React 19.2) + pins `"latest"` = risco de quebras silenciosas.

### 3.5 Erros de TypeScript mascarados no build
- `next.config.mjs` tem **`typescript.ignoreBuildErrors: true`**. Por isso `npm run build` passa **sem checagem de tipos** — "build ok" não significa "tipos ok".
- Rodando `tsc --noEmit` (precisa de Node ≥ 14; o Node ativo no ambiente era 10): **~94 erros de tipo em ~15 arquivos** (actions de pessoas/times/projetos/tags/usuários/cargos/trilhas, `lib/repositories/*`, `lib/services/auditoria.service.ts`, `lib/types/index.ts`, páginas de `configuracoes/*` e `organograma`).
- Confirmados entre eles os reportados antes: `updatePessoa` (`pessoas.actions.ts:572`) e `softDeletePessoa` (`pessoas.actions.ts:663`) declaram `Promise<ActionResult>` **sem o argumento de tipo** (`TS2314: Generic type 'ActionResult' requires 1 type argument`). O terceiro item então relatado (`timeRepo.findAll({...})` em `getTimesParaFiltro`) **não se reproduz mais**: a função hoje usa `supabase.from('time')` direto.
- ⚠️ **Validado por `tsc`/build, não verificado contra o app rodando.** Não corrigidos nesta passada — registro de débito para não se perderem. Ao mexer nesses arquivos, ajuste os tipos em vez de confiar no `ignoreBuildErrors`.

### 3.6 Padronização de toast/erros incompleta
- A convenção (CLAUDE.md) é usar `handleError` + `lib/ui/toast-config`, **não** `useToast`/`sonner` direto. Várias páginas existentes ainda importam `useToast`/`sonner` (ex.: `configuracoes/*`, `times/*`, `projetos/*`, `perfil`, `pessoas/*`). Migração pendente (não-bloqueante); seguir a convenção em código novo.

---

## 4. Segurança

### 4.1 RLS — ativo no banco; comportamento ainda a verificar por teste
O `orgzilla_schema.sql` foi **aplicado** (✅), então o **RLS está habilitado nas 17 tabelas** com policies por perfil, incluindo as duas sensíveis:
- `pessoa_remuneracao`: acesso total (select/insert/update/delete) **apenas para `gestor`**.
- `historico_reajuste`: leitura/escrita **apenas para `gestor`**.

Não há "RLS pendente em outras tabelas" — está tudo ativo no mesmo script. O que **falta** é a verificação de comportamento de ponta a ponta (depende de conectar o app ao banco):

- [x] `orgzilla_schema.sql` rodado → RLS ativo
- [x] Testado: `visualizador` e `admin` **não** conseguem ler `pessoa_remuneracao` nem `historico_reajuste` direto via Supabase (teste de fumaça §6)

Enquanto o teste não for feito, a proteção está **ativa mas não verificada na prática**.

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

### 🟥 Agora — voltar a um estado sólido
1. **Conectar o app ao banco recriado**: ✅ schema + seed já aplicados. Falta atualizar env vars (local + Vercel), reconfigurar OAuth e criar/vincular os usuários de teste — ver checklist da §1.
2. **Validar a cadeia**: app sobe, login funciona, dashboard renderiza, e rodar o teste de fumaça de RLS (§6).
3. **Resolver lockfiles e pins `"latest"`**: escolher npm *ou* pnpm, apagar o outro lockfile, fixar versões, install limpo, `build` ok.
4. **Limpar mocks residuais** (§3.1): troca de senha falsa em `perfil` (ligar `AuthService.atualizarSenha`); arrays mortos em `configuracoes/cargos` e `configuracoes/trilhas`. (`pessoas/nova`, `pessoas/[id]/editar` e `pessoas/[id]` detalhe já migrados — ✅ concluído.)
5. ✅ **Corrigir docs**: feito — os retratos de momento desatualizados (incl. `CONFIGURAR-SUPABASE.md` sem RLS e o claim falso de RLS em `AUTENTICACAO.md`) foram removidos; a doc ficou nos canônicos + `DESIGN_SYSTEM.md`/`PADROES-ERRO.md` (ver §0).

### 🟨 Em seguida — consolidar a arquitetura
6. **Terminar a migração para Services** em `pessoas`/`dashboard` (a parte de salário já foi; falta o resto das queries sair do `supabase.from()` cru — `pessoas.actions.ts` linhas 148/238/273/316 e `dashboard.actions.ts` linhas 78/91/103/116/127/140/199/284).
7. ✅ **Recursão de hierarquia unificada** (`PermissaoService.coletarSubarvore`, com proteção contra ciclos). Eliminadas as cópias anteriores.
8. ✅ **Auto-criação de usuário unificada** em `lib/middleware/auth.middleware.ts`.
9. **Introduzir testes** para lógica crítica: hierarquia, permissões por perfil, separação de salário (Vitest).

### 🟩 Mais adiante
10. Completar Phase 3 (busca avançada, exportação, viewer de auditoria, upload de avatar).
11. Otimizar queries N+1: `findAllWithPessoaCount`, `getTimesComEstatisticas`.
12. Endurecimento para produção: rate limiting, restrição de domínio no OAuth, revalidação de cache.

---

## 6. Teste de fumaça de segurança (rodar após recriar o banco)
Logado como **visualizador** (e depois como **admin**), tentar via client Supabase:
```
supabase.from('pessoa_remuneracao').select('*')
supabase.from('historico_reajuste').select('*')
```
Ambos devem retornar **vazio / negado**. Só o **gestor** deve obter dados. Se visualizador ou admin obtiverem linhas, o RLS não está ativo — rodar/conferir o `orgzilla_schema.sql`.

---

## 7. Artefatos de recriação (fora do repo, gerados nesta retomada)
- `orgzilla_schema.sql` — schema + RLS (recria as 17 tabelas com RLS por perfil).
- `orgzilla_seed.sql` — dados de teste.
- `PROMPT-claude-code.md` — prompt que aplicou a separação de remuneração no código.

> Considere versionar estes arquivos no repo (ex.: pasta `db/`) para a recriação ser reproduzível.

---

## 8. Convenções deste arquivo
- ✅ funcional / ❌ ausente ou falso / ⚠️ parcial ou a revisar / ☐ a verificar / 🔴 risco de segurança
- 🟥 agora / 🟨 em seguida / 🟩 mais adiante
- Distinga **código pronto** (verificável lendo o repo) de **banco ativo/verificado** (depende de rodar SQL e testar).
- Atualize a data do topo e marque itens concluídos sempre que mexer no projeto.