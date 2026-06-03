---
name: project-ci-e-tipagem-supabase
description: Gate de CI adicionado (2026-06-03) e padrão SelectQueryBuilder para tipagem do query builder Supabase documentado no CLAUDE.md
metadata:
  type: project
---

**Gate de CI** adicionado em `.github/workflows/ci.yml` (2026-06-03): dispara em PR e push para `main`; roda sequencialmente `tsc --noEmit`, `pnpm lint`, `pnpm test` e `pnpm build` com Node 24 + pnpm frozen-lockfile.

**Why:** garantir que lint zerado, 0 erros TS, 106 testes e build passando se mantenham em toda PR — antes não havia gate automatizado.

**Padrão SelectQueryBuilder** documentado na seção "Padrões de tipagem — Supabase query builder" do `CLAUDE.md`:
- Usar `SelectQueryBuilder` exportado de `lib/repositories/base.repository.ts`
- Cast `as unknown as SelectQueryBuilder` na criação da query (não no final)
- Todos os métodos de filtro retornam `SelectQueryBuilder` — reatribuição sem perda de tipo
- **Proibido** `any` ou `// eslint-disable` como saída para tipagem de query builder

**How to apply:** ao tocar em qualquer repository com filtros condicionais, seguir este padrão. Ao auditar o CLAUDE.md, verificar que a seção de tipagem existe e referencia `lib/repositories/base.repository.ts` corretamente.
