# 📌 STATUS — Orgzilla

> **Fonte única de verdade sobre o estado real do projeto.**
> Em caso de conflito entre este arquivo e `CLAUDE.md`, READMEs de camadas ou qualquer outra doc, **este arquivo prevalece** até ser revisado.

**Última atualização:** 30 de maio de 2026
**Resumo de uma linha:** Fundação de backend construída e sólida; projeto paralisado no meio da migração mock → dados reais; documentação antiga descreve um estágio anterior ao código.

---

## 0. Aviso sobre a documentação antiga

A documentação existente **não reflete o código atual** e é contraditória entre si:

- `CLAUDE.md` (marcado "Last Updated: November 16, 2025") afirma **"Phase 2: Backend Integration (NOT STARTED)"** e lista os services como não-feitos — **todos existem e funcionam**.
- `lib/repositories/README.md` e `lib/supabase/README.md` dizem "⏳ Services: próxima camada a ser criada" — **já criada**.
- `DASHBOARD.md`, `USUARIO-LOGADO.md` e `AUTENTICACAO.md` descrevem corretamente partes já prontas.

➡️ Tratar `CLAUDE.md` e os READMEs de camada como **histórico**, não como estado atual.

---

## 1. O que está construído e funcional

- **Tipos** (`lib/types/database.ts`): 17 tabelas tipadas. Os campos sensíveis de salário **saíram de `pessoa`** e vivem numa tabela 1:1 `pessoa_remuneracao` (`salario_atual`, `data_ultimo_reajuste`, `motivo_ultimo_reajuste`), marcada `// SENSITIVE - LGPD`.
- **Separação de remuneração (concluída):** `pessoa_remuneracao` é acessada via `PessoaRemuneracaoRepository` → `PessoaService` (`buscarRemuneracao`/`salvarRemuneracao`), que centraliza a decisão de quem pode ver/editar salário reutilizando `PermissaoService` (gestor da hierarquia). Admin e visualizador nunca recebem nem gravam remuneração. UI de detalhe/criação/edição só mostra o salário para gestor.
- **Repositories** (`lib/repositories/`): `base.repository.ts` com CRUD genérico, soft delete, contagens e existência; repositories por entidade.
- **Services** (`lib/services/`): `AuthService`, `PermissaoService`, `AuditoriaService`, `HistoricoService`, `PessoaService`, `TimeService`, `VagaService`, com factory `createServices()`.
- **Server Actions** reais: pessoas, times, projetos, usuários, níveis, dashboard — conectadas ao Supabase.
- **Dashboard** (`dashboard.actions.ts`): métricas, distribuições por nível/time e filtragem por hierarquia de gestor.
- **Autenticação**: email/senha + Google OAuth, middleware de proteção de rotas, auto-criação de usuário no 1º login.

---

## 2. O que está incompleto, quebrado ou inconsistente

### 2.1 Migração mock → real está pela metade (irregular)

| Página | Estado |
|---|---|
| `configuracoes/cargos` | ❌ Mock puro (`mockCargos` hardcoded) |
| `configuracoes/trilhas` | ❌ Mock puro (`mockTracks` hardcoded) |
| `relatorios` | ❌ Mock puro |
| `configuracoes/usuarios` | ⚠️ Usa actions reais, **mas ainda mantém `mockUsers` no arquivo** |
| `perfil` (troca de senha) | ❌ Falsa: `console.log("[v0]")` + `setTimeout(1500)` + toast de sucesso, sem chamar API |
| Dashboard / Pessoas / Times | ✅ Dados reais |

> Rastros `console.log('[v0]...')` confirmam origem v0.dev. UI gerada lá, backend costurado por cima, sem ter terminado.

### 2.2 Testes
**Cobertura zero.** Sem script de teste no `package.json`, sem framework instalado, sem arquivos de teste.

### 2.3 Débito arquitetural — três padrões de acesso a dados convivendo

A arquitetura limpa documentada (Repository → Service → Action → UI) está **parcialmente órfã**:

1. `times.actions.ts` → usa `TimeRepository` direto (pula o `TimeService`).
2. `dashboard.actions.ts` e `pessoas.actions.ts` → `supabase.from(...)` cru, com permissão e hierarquia inline.
3. `PessoaService`/`TimeService` existem, mas as actions praticamente não os usam. `getPessoasComFiltros` reimplementa o que o `PessoaService` deveria centralizar.

**Consequências concretas:**
- Lógica de hierarquia duplicada: `getTimeHierarchyIds` (dashboard) vs. `getTimeHierarchyIdsRecursive` (times) — mesma lógica, duas cópias. Recursão **não-limitada** → loop infinito se houver ciclo em `time_pai_id`.
- Auto-criação de usuário em **3 lugares**: `app/(dashboard)/layout.tsx`, `auth.middleware.ts`, `auth.service.ts` — mais uma 4ª versão proposta como trigger SQL no `CONFIGURAR-SUPABASE.md`.

### 2.4 Dependências — builds não reprodutíveis
- **Lockfiles conflitantes**: `package-lock.json` **e** `pnpm-lock.yaml` no repo, com versões divergentes (`package.json` pede `next 16.0.10`; `pnpm-lock` tem `16.0.10`; `package-lock` registra `16.0.3`). O `.gitignore` tem comentário "keep only one" — ignorado.
- **Pins `"latest"`** em várias deps: vários `@radix-ui/*`, `recharts`, `sonner`, `date-fns`, `next-themes`, `react-day-picker`, `vaul`. Quebra reprodutibilidade.
- Stack bleeding edge (Next 16 + React 19.2) combinado com pins `"latest"` aumenta risco de quebras silenciosas.

---

## 3. Riscos de segurança a confirmar/corrigir

### 3.1 ✅ Salário isolado em `pessoa_remuneracao` com RLS (gestor) — resolvido para salário
O salário **não está mais na tabela `pessoa`**. Foi movido para `pessoa_remuneracao` (1:1, `ON DELETE CASCADE`), protegida por **RLS no banco que só permite acesso ao perfil `gestor`** (select/insert/update/delete). Isso resolve o problema de RLS por linha vs. por coluna: como `pessoa` continua legível por qualquer autenticado, era impossível esconder só a coluna de salário; com a tabela separada, o banco barra a leitura.

Proteção em profundidade:
- **Banco:** RLS em `pessoa_remuneracao` (apenas gestor).
- **Aplicação:** `PessoaService` só busca/grava remuneração quando `PermissaoService.podeVerSalario/podeEditarSalario` autoriza (gestor da hierarquia). Admin e visualizador nunca recebem a chave `remuneracao` nem gravam salário.

⚠️ **Pendente (outras tabelas):** confirmar/ligar RLS nas demais tabelas e na `historico_reajuste` (também sensível). Corrigir a afirmação falsa "o Supabase protege automaticamente com RLS" no `AUTENTICACAO.md`.

### 3.2 Regra de salário — agora centralizada
Admin **não** vê salários; Gestor vê (só da sua hierarquia); Visualizador não vê. A regra está centralizada em `PermissaoService` (`podeVerSalario`/`podeEditarSalario`) e aplicada pelo `PessoaService`, não mais em comentários + `selectFields` espalhados.

### 3.3 Auto-criação + OAuth sem restrição de domínio
Se o login Google não estiver restrito a um domínio, qualquer conta Google se autentica e vira `visualizador` com leitura de todas as pessoas (exceto salário).

---

## 4. Roadmap priorizado

### 🟥 Agora — voltar a um estado sólido e confiável
1. **Reconciliar a documentação** (este `STATUS.md` é o primeiro passo). Arquivar/atualizar `CLAUDE.md` e READMEs.
2. **Resolver lockfiles e pins `"latest"`**: escolher npm *ou* pnpm, apagar o outro lockfile, fixar versões exatas, `install` limpo, confirmar `build`.
3. **Verificar e ligar RLS** no banco real. ✅ Salário já isolado em `pessoa_remuneracao` com RLS (gestor) — ver §3.1. Falta: RLS nas demais tabelas e em `historico_reajuste`; corrigir a afirmação falsa no `AUTENTICACAO.md`.
4. **Inventário mock vs. real** (tabela da seção 2.1) e remover mocks já substituídos — começar por `mockUsers` órfão e troca de senha falsa em `perfil`.

### 🟨 Em seguida — consolidar a arquitetura
5. **Escolher um padrão de acesso a dados** e aplicá-lo. Recomendado: actions passam por Services (já existem). Migrar `pessoas`/`dashboard`.
6. **Extrair a recursão de hierarquia** para um único lugar (`TimeService`), com proteção contra ciclos. Eliminar as cópias.
7. **Unificar auto-criação de usuário** num único ponto (app *ou* trigger SQL, não ambos).
8. **Introduzir testes** para a lógica crítica: hierarquia, permissões por perfil, separação de salário. Começar com Vitest e poucos testes de alto valor.

### 🟩 Mais adiante — melhorias
9. Completar Phase 3 do roadmap original (busca avançada, exportação, viewer de auditoria, upload de avatar).
10. Otimizar queries N+1: `findAllWithPessoaCount` e `getTimesComEstatisticas` fazem um `count` por item dentro de `Promise.all`.
11. Endurecimento para produção: rate limiting, restrição de domínio no OAuth, revalidação de cache.

---

## 5. Primeira ação recomendada para quem retomar
Antes de qualquer feature: **rodar o app contra o banco real e checar manualmente se um `visualizador` consegue ler `salario_atual` direto via Supabase** (ver 3.1). Responde de imediato à pergunta de segurança mais cara. Em paralelo, manter este `STATUS.md` atualizado a cada sessão de trabalho.

---

## 6. Convenções deste arquivo
- ✅ funcional / ❌ ausente ou falso / ⚠️ parcial ou a revisar
- 🟥 agora / 🟨 em seguida / 🟩 mais adiante / 🔴 risco de segurança
- Atualize a data do topo e marque itens concluídos sempre que mexer no projeto.