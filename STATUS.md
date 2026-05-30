# 📌 STATUS — Orgzilla

> **Fonte única de verdade sobre o estado real do projeto.**
> Em caso de conflito entre este arquivo e `CLAUDE.md`, READMEs de camadas ou qualquer outra doc, **este arquivo prevalece** até ser revisado.

**Última atualização:** 30 de maio de 2026
**Resumo de uma linha:** Banco recriado do zero (schema + seed já aplicados, RLS ativo); falta conectar o app ao novo banco (env/OAuth/usuários), validar o RLS por teste e terminar a migração mock → real.

---

## 0. Aviso sobre a documentação antiga

Parte da documentação **não reflete o código/estado atual**:

- ✅ `CLAUDE.md` foi reescrito e reconciliado — pode ser tratado como atual.
- ❌ `lib/repositories/README.md` e `lib/supabase/README.md` ainda dizem "⏳ Services: próxima camada a ser criada" — **já criada**. Tratar como histórico.
- 🔴 `CONFIGURAR-SUPABASE.md` contém um script de setup **sem RLS** — está **substituído** por `orgzilla_schema.sql` (ver §7). Não usar o script antigo; ele recria o furo de segurança.
- ⚠️ `AUTENTICACAO.md` afirma falsamente que "o Supabase protege automaticamente com RLS". Corrigir.

---

## 1. Estado do banco de dados (LEIA PRIMEIRO)

🔴 **O projeto Supabase original foi perdido** (pausado +90 dias no free tier, sem reativação; restauração de backup falhou). O banco foi **recriado do zero** com os scripts abaixo.

Scripts de recriação (rodados nesta ordem):
1. `orgzilla_schema.sql` — recria as 17 tabelas, índices, helper de perfil e **RLS habilitado em todas as tabelas** com policies por perfil. **✅ Aplicado.**
2. `orgzilla_seed.sql` — popula dados de teste (~140 pessoas, hierarquia de times, projetos, tags, históricos, remuneração). **✅ Aplicado.**

Checklist de retomada do ambiente:
- [x] `orgzilla_schema.sql` rodado (RLS ativo em todas as tabelas)
- [x] `orgzilla_seed.sql` rodado (dados de teste carregados)
- [ ] `.env.local` atualizado com URL + chaves do novo projeto
- [ ] Mesmas variáveis configuradas na **Vercel**
- [ ] Google OAuth reconfigurado (novo redirect URI do projeto)
- [ ] Usuários admin/gestor/visualizador criados no painel e vinculados em `usuario`
- [ ] Teste de fumaça de RLS executado (§6)

⚠️ **Todos os dados atuais são de teste** (gerados pelo seed). Não há dado real/produção. Os usuários de login (admin/gestor/visualizador) são criados manualmente no painel de Authentication e vinculados na tabela `usuario` (instruções no fim do seed).

Sequência completa de retomada: recriar projeto no Supabase → atualizar `.env.local` **e env vars na Vercel** (URL + chaves mudam) → rodar `orgzilla_schema.sql` → rodar `orgzilla_seed.sql` → criar os 3 usuários no painel e vincular → reconfigurar Google OAuth (novo redirect URI) → `npm run build`.

---

## 2. O que está construído (código)

> Distinção importante: os itens abaixo descrevem o que o **código** espera/faz. O que está **ativo e verificado no banco** depende de o `orgzilla_schema.sql` ter sido rodado e testado — ver §4.

- **Tipos** (`lib/types/database.ts`): 17 tabelas tipadas. Salário **fora de `pessoa`**, na tabela 1:1 `pessoa_remuneracao` (`salario_atual`, `data_ultimo_reajuste`, `motivo_ultimo_reajuste`), marcada `// SENSITIVE - LGPD`.
- **Separação de remuneração (código concluído):** `pessoa_remuneracao` acessada via `PessoaRemuneracaoRepository` → `PessoaService` (`buscarRemuneracao`/`salvarRemuneracao`), com a decisão de ver/editar centralizada em `PermissaoService` (`podeVerSalario`/`podeEditarSalario`, gestor da hierarquia). Admin e visualizador nunca recebem nem gravam remuneração; a UI só mostra salário para gestor.
  > ☐ A verificar contra o código: confirmar que os nomes acima existem como descritos (o doc e o código foram gerados na mesma rodada pelo Claude Code).
- **Repositories** (`lib/repositories/`): `base.repository.ts` (CRUD genérico, soft delete, contagens, existência) + repositories por entidade.
- **Services** (`lib/services/`): `AuthService`, `PermissaoService`, `AuditoriaService`, `HistoricoService`, `PessoaService`, `TimeService`, `VagaService`, `PessoaRemuneracaoRepository`, factory `createServices()`.
- **Server Actions**: pessoas, times, projetos, usuários, níveis, dashboard.
- **Dashboard** (`dashboard.actions.ts`): métricas, distribuições por nível/time, filtragem por hierarquia de gestor.
- **Autenticação**: email/senha + Google OAuth, middleware de rotas, auto-criação de usuário no 1º login.

---

## 3. O que está incompleto, quebrado ou inconsistente

### 3.1 Migração mock → real está pela metade (irregular)

| Página | Estado |
|---|---|
| `configuracoes/cargos` | ❌ Mock puro (`mockCargos` hardcoded) |
| `configuracoes/trilhas` | ❌ Mock puro (`mockTracks` hardcoded) |
| `relatorios` | ❌ Mock puro |
| `configuracoes/usuarios` | ⚠️ Usa actions reais, **mas ainda mantém `mockUsers` no arquivo** |
| `perfil` (troca de senha) | ❌ Falsa: `console.log("[v0]")` + `setTimeout(1500)` + toast de sucesso, sem chamar API |
| Dashboard / Pessoas / Times | ✅ Dados reais |

> Rastros `console.log('[v0]...')` confirmam origem v0.dev.

### 3.2 Testes
**Cobertura zero.** Sem script de teste no `package.json`, sem framework instalado, sem arquivos de teste.

### 3.3 Débito arquitetural — padrões de acesso a dados misturados
A arquitetura-alvo (Repository → Service → Action → UI) ainda está **parcialmente aplicada**:

1. ✅ A lógica de **salário** foi extraída para `PessoaService`/`PermissaoService` (o antigo `selectFields` por perfil saiu).
2. ⚠️ O **restante** de `pessoas.actions.ts` (e `dashboard.actions.ts`) provavelmente ainda faz `supabase.from(...)` cru com hierarquia inline — só a parte de salário foi migrada. Confirmar e migrar o resto.
3. `times.actions.ts` usa `TimeRepository` direto (pula `TimeService`).

**Consequências:**
- Lógica de hierarquia possivelmente duplicada: `getTimeHierarchyIds` (dashboard) vs. `getTimeHierarchyIdsRecursive` (times). Recursão **não-limitada** → loop infinito se houver ciclo em `time_pai_id`. (A nova busca de remuneração deve reusar o filtro de hierarquia, não criar uma 3ª cópia — verificar.)
- Auto-criação de usuário em **3 lugares**: `app/(dashboard)/layout.tsx`, `auth.middleware.ts`, `auth.service.ts`.

### 3.4 Dependências — builds não reprodutíveis
- **Lockfiles conflitantes**: `package-lock.json` **e** `pnpm-lock.yaml` (versões divergentes: `package.json` pede `next 16.0.10`; `pnpm-lock` tem `16.0.10`; `package-lock` registra `16.0.3`).
- **Pins `"latest"`** em várias deps (`@radix-ui/*`, `recharts`, `sonner`, `date-fns`, `next-themes`, `react-day-picker`, `vaul`).
- Stack bleeding edge (Next 16 + React 19.2) + pins `"latest"` = risco de quebras silenciosas.

---

## 4. Segurança

### 4.1 RLS — ativo no banco; comportamento ainda a verificar por teste
O `orgzilla_schema.sql` foi **aplicado** (✅), então o **RLS está habilitado nas 17 tabelas** com policies por perfil, incluindo as duas sensíveis:
- `pessoa_remuneracao`: acesso total (select/insert/update/delete) **apenas para `gestor`**.
- `historico_reajuste`: leitura/escrita **apenas para `gestor`**.

Não há "RLS pendente em outras tabelas" — está tudo ativo no mesmo script. O que **falta** é a verificação de comportamento de ponta a ponta (depende de conectar o app ao banco):

- [x] `orgzilla_schema.sql` rodado → RLS ativo
- [ ] Testado: `visualizador` e `admin` **não** conseguem ler `pessoa_remuneracao` nem `historico_reajuste` direto via Supabase (teste de fumaça §6)

Enquanto o teste não for feito, a proteção está **ativa mas não verificada na prática**.

### 4.2 Defesa em profundidade do salário
- **Banco:** RLS gestor-only em `pessoa_remuneracao` e `historico_reajuste`.
- **Aplicação:** `PessoaService` só busca/grava remuneração quando `PermissaoService` autoriza (gestor da hierarquia). O recorte **por hierarquia** é responsabilidade do código — o RLS garante só "é gestor", não "é gestor *daquela* pessoa". Verificar que a busca de remuneração aplica o filtro de hierarquia.

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
4. **Inventário mock vs. real** (§3.1) e remover mocks já substituídos — começar por `mockUsers` órfão e troca de senha falsa em `perfil`.
5. **Corrigir docs**: marcar `CONFIGURAR-SUPABASE.md` como substituído; corrigir a afirmação falsa de RLS em `AUTENTICACAO.md`; atualizar os READMEs de camada.

### 🟨 Em seguida — consolidar a arquitetura
6. **Terminar a migração para Services** em `pessoas`/`dashboard` (a parte de salário já foi; falta o resto da query sair do `supabase.from()` cru).
7. **Extrair a recursão de hierarquia** para um único lugar (`TimeService`), com proteção contra ciclos. Eliminar cópias.
8. **Unificar auto-criação de usuário** num único ponto.
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
- `orgzilla_schema.sql` — schema + RLS (substitui o script de `CONFIGURAR-SUPABASE.md`).
- `orgzilla_seed.sql` — dados de teste.
- `PROMPT-claude-code.md` — prompt que aplicou a separação de remuneração no código.

> Considere versionar estes arquivos no repo (ex.: pasta `db/`) para a recriação ser reproduzível.

---

## 8. Convenções deste arquivo
- ✅ funcional / ❌ ausente ou falso / ⚠️ parcial ou a revisar / ☐ a verificar / 🔴 risco de segurança
- 🟥 agora / 🟨 em seguida / 🟩 mais adiante
- Distinga **código pronto** (verificável lendo o repo) de **banco ativo/verificado** (depende de rodar SQL e testar).
- Atualize a data do topo e marque itens concluídos sempre que mexer no projeto.