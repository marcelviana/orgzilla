---
name: project-migracao-projetos-tags
description: Estado da migração mock → real para todas as rotas de pessoa (nova, editar, detalhe)
metadata:
  type: project
---

`getProjetosParaFiltro` em `projetos.actions.ts` migrado para `ProjetoProdutoRepository.findAll()`. `getTagsParaFiltro` usa `TagRepository`. `pessoas/nova` e `pessoas/[id]/editar` removeram `MOCK_PROJECTS`/`MOCK_TAGS`.

`pessoas/[id]` detalhe: `PERSON_DATA_MOCK` e `MOCK_NOTES` removidos. Projetos e tags vêm de `pessoa.projetos`/`pessoa.tags` retornados por `getPessoaById`; anotações via nova action `getAnotacoesDaPessoa` + `criarAnotacaoDaPessoa` (em `anotacoes.actions.ts`), com lógica em `AnotacaoService`. **F12 (4 jun 2026):** `TIMELINE_DATA` (mock de "João") removido; aba "Histórico profissional" consome `getHistoricoProfissional(id)` → `HistoricoService` (historico_cargo + historico_time, sem remuneração/LGPD). EmptyState quando vazio; guard defensivo para `data` nula na ordenação. Menus inertes religados (`router.push`, `setActiveTab`) ou removidos ("Adicionar a Projeto").

**Why:** todas as rotas de pessoa estavam parcialmente ou totalmente dependentes de mocks. A migração completa de `pessoas/[id]` fecha o §3.1 para toda a área de pessoa.

**How to apply:** ao auditar §3.1, todas as páginas de pessoa (nova, editar, detalhe), `perfil`, `configuracoes/cargos`, `configuracoes/trilhas`, `configuracoes/page.tsx`, `busca`, `relatorios`, `times/[id]` devem aparecer como ✅ ou ⚠️ — não há mais página mock na área de pessoas nem de times. `times/[id]` detalhe: menus inertes ligados/removidos na F12; nenhum mock residual. Débito aberto em `times/[id]`: "organograma focado" (§5 N) e "adicionar pessoa ao time" (§5 O) adiados. Débito arquitetural de `addPessoaAoProjeto` (§3.3) permanece.
