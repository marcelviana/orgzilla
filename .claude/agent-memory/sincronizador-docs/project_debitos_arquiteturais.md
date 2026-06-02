---
name: debitos-arquiteturais-pendentes
description: Padrão de como registrar débitos 🟡 em §3.3 e marcar como ✅ quando resolvidos; histórico dos débitos do commit c6b4e97 e correções TS G2/G3 de 2026-06-01
metadata:
  type: project
---

Débitos identificados pelo revisor-camadas no commit c6b4e97 e **resolvidos em 2026-06-01**:

1. `pessoas.actions.ts`: `anexarRemuneracaoLista` — extraída para `PessoaService.enriquecerListaComRemuneracao`. ✅
2. `dashboard.actions.ts`: `console.error` → `handleError`. ✅
3. `times.actions.ts`: `buildTimeHierarchy` → `TimeService.buscarHierarquiaComEstatisticas` (com proteção a ciclos via Set). ✅

**Why:** o revisor-camadas detecta débitos mas não corrige código; o sincronizador-docs os registra em §3.3 com símbolo 🟡 e referência de arquivo:linha. Quando corrigidos, os itens 🟡 viram ✅ com breve descrição do que foi feito — nunca removidos silenciosamente.

**How to apply:** débitos novos entram como 🟡 na subseção "Débitos pendentes" de §3.3. Quando resolvidos, reescrever o item como ✅ descrevendo a solução. Não apagar — manter o histórico visível na seção.

Novos tipos exportados pela resolução de débitos: `TimeComEstatisticas` e `TimeHierarquico` em `lib/services/time.service.ts`, re-exportados via `lib/services/index.ts`.

---

## Grupos de correção de TypeScript (§3.5)

- **G1:** tipos de enum não importados (`lib/types/index.ts`) + generics do BaseRepository. ✅
- **G2/G3:** shapes de JOIN Supabase (pessoa.repository, time.repository) + cast Json/mapeamento snake_case em auditoria.service. ✅
- **G4:** `findAll()` com argumentos inválidos → `findMany()` em 4 actions (cargos, tags, times, trilhas). ✅
- **G5:** componentes shadcn ausentes criados (`tooltip.tsx`, `skeleton.tsx`); cast de tipo em `FilterPanel.tsx:92`. ✅
- **G6:** `nome`→`name` e `percent??0` em `dashboard-content.tsx:168`; `percent??0` (3x) e tipos explícitos em formatters (2x) em `relatorios-client.tsx`. ✅
- **G7:** Switch/null guards em `configuracoes/*`, narrowing `ActionResult` em `usuarios`. ✅
- **G8:** `useNodesState`/`useEdgesState` tipados explicitamente em `organograma`; narrowing `ActionResult` em `pessoas/[id]` e `projetos`. ✅
- **G9:** prop `title` Lucide → `aria-label` em `times/novo`; fixture de teste tipada em `pessoa.service.enriquecer.test.ts`. ✅
- **G10 (erro final):** método `select` adicionado a `SelectQueryBuilder`; `update` com cast `as unknown as SelectQueryBuilder` em `base.repository.ts:191`. ✅
- **Estado atual: 0 erros TS. `ignoreBuildErrors` removido de `next.config.mjs`. Build passa com checagem de tipos ativa.**

**How to apply:** ao registrar novo grupo de correção TS no STATUS.md, manter a lista de grupos G1/G2/G3/G4... e atualizar a contagem de erros restantes com resultado real de `tsc --noEmit | grep "error TS" | wc -l`.

---

## Padrão de shape de JOIN Supabase (identificado em 2026-06-01, erros G2/G3)

JOINs do Supabase SDK retornam shapes aninhados que **não batem** com os tipos TypeScript da aplicação:

- **JOIN N:M com tabela pivot** (ex.: `pessoa_tag → tag`): retorna `{ tag: Tag }[]`, não `Tag[]`. Desembrulhar antes do cast: `.map(pt => pt.tag)`.
- **AUTO-REFERÊNCIA** (ex.: `times_filhos` em `time`): retorna `object | null`, não `array`. Normalizar: `Array.isArray(raw) ? raw : []`.
- **Campos `Json | null`** do tipo Supabase (ex.: `valor_anterior`/`valor_novo` em `historico_mudanca`): cast explícito necessário se o código espera tipo mais estreito.
- **Filtros camelCase vs. snake_case**: ao mapear parâmetros de filtro de método TypeScript para colunas do banco, garantir conversão explícita (ex.: `tipoEntidade` → `tipo_entidade`).

Esses erros ficam invisíveis no build enquanto `typescript.ignoreBuildErrors: true` (ver §3.5 do STATUS.md). Só aparecem em `tsc --noEmit`.
