---
name: project-migracao-projetos-tags
description: Estado da migração de projetos e tags para repositories em pessoas/nova e pessoas/[id]/editar
metadata:
  type: project
---

`getProjetosParaFiltro` em `projetos.actions.ts` foi migrado de `supabase.from()` cru para `ProjetoProdutoRepository.findAll()`.

`getTagsParaFiltro` foi adicionado em `tags.actions.ts` usando `TagRepository` (nunca usou supabase.from() cru).

`pessoas/nova` e `pessoas/[id]/editar` removeram `MOCK_PROJECTS` e `MOCK_TAGS` e agora chamam essas actions para preencher os seletores de projetos e tags.

**Why:** eram os únicos dois formulários de pessoa com mocks vivos em seletores de entidades auxiliares. A migração fecha o §3.1 para essas duas rotas.

**How to apply:** ao auditar §3.1, `pessoas/nova` e `pessoas/[id]/editar` devem aparecer como ✅ — não como ⚠️. O único pendente de pessoa é `pessoas/[id]` detalhe (`PERSON_DATA_MOCK`, `MOCK_NOTES`).
