---
name: project-migracao-projetos-tags
description: Estado da migração mock → real para todas as rotas de pessoa (nova, editar, detalhe)
metadata:
  type: project
---

`getProjetosParaFiltro` em `projetos.actions.ts` migrado para `ProjetoProdutoRepository.findAll()`. `getTagsParaFiltro` usa `TagRepository`. `pessoas/nova` e `pessoas/[id]/editar` removeram `MOCK_PROJECTS`/`MOCK_TAGS`.

`pessoas/[id]` detalhe: `PERSON_DATA_MOCK` e `MOCK_NOTES` removidos. Projetos e tags vêm de `pessoa.projetos`/`pessoa.tags` retornados por `getPessoaById`; anotações via nova action `getAnotacoesDaPessoa` + `criarAnotacaoDaPessoa` (em `anotacoes.actions.ts`), com lógica em `AnotacaoService` (verificação de hierarquia via `PermissaoService`).

**Why:** todas as rotas de pessoa estavam parcialmente ou totalmente dependentes de mocks. A migração completa de `pessoas/[id]` fecha o §3.1 para toda a área de pessoa.

**How to apply:** ao auditar §3.1, `pessoas/nova`, `pessoas/[id]/editar`, `pessoas/[id]` detalhe e `perfil` (troca de senha) devem aparecer como ✅. `perfil` migrado via `atualizarSenhaAction` → `AuthService.atualizarSenha` (2026-06-01). Pendentes restantes de mock: `busca`, `relatorios`, `configuracoes/cargos`, `configuracoes/trilhas`.
