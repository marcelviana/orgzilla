---
name: project-design-patterns
description: Padrões recorrentes de dívida de design observados na revisão geral de jun/2026 — útil para focar revisões futuras
metadata:
  type: project
---

Revisão geral concluída em 3 jun 2026. Achados sistêmicos recorrentes:

**Componentes compartilhados zerados na prática:** PageHeader, EmptyState, StatsCard, SearchInput, FilterPanel, ConfirmDialog — nenhum é usado nas páginas do produto; todas as telas reinventam header, filtros e empty states inline.

**Why:** O scaffold do v0.dev gerou páginas auto-contidas antes de os componentes compartilhados existirem; a migração não acompanhou.

**How to apply:** Em qualquer nova tela ou refactor, checar primeiro o `components/shared/index.ts` antes de escrever qualquer header, breadcrumb, empty state ou filter inline.

---

**Tokens de cor vs hex cru:** configuracoes/niveis/page.tsx é o pior ofensor (20+ ocorrências de `bg-[#FF7A00]`, `text-[#00C8FF]`). projetos/page.tsx usa `bg-orange-500` em vez de `bg-primary`. Padrão disseminado em toda a área de configurações.

**How to apply:** Em revisões de configuracoes/*, priorizar hex hardcoded como achado médio sistemático.

---

**Sonner direto em dois arquivos estruturais:** `dashboard-shell.tsx` e `components/pessoas/pessoas-table.tsx` ainda importam `from 'sonner'` diretamente, violando a convenção de `toast-config`. Esses são componentes de alto tráfego.

---

**window.confirm() em ações destrutivas:** projetos/page.tsx:67, times/novo/page.tsx:148, times/[id]/editar/page.tsx:152. Padrão browser nativo sem `ConfirmDialog`.

---

**console.log() em DropdownMenuItems:** pessoas/[id]/page.tsx e times/[id]/page.tsx têm menus de ação onde cada item apenas dispara `console.log()` — funcionalidades não implementadas expostas como botões funcionais.

---

**Tokens semânticos ausentes no globals.css:** `primary-strong` (#C85F00 para contraste AA com branco) não existe. `success`/`danger`/`info`/`warning` como tokens de classes Tailwind não estão definidos — apenas como variáveis CSS sem mapeamento para classes utilitárias. StatusBadge usa `bg-green-100` etc. em vez de tokens semânticos.

---

**TIMELINE_DATA hardcoded em pessoas/[id]/page.tsx:67** — dados de histórico profissional são estáticos (mock), não vêm do banco. Expõe informação falsa ao usuário.
