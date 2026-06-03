---
name: project-toast-migracao
description: Migração de toasts concluída — todos os arquivos em app/ usam handleError + toast-config; item D do roadmap encerrado
metadata:
  type: project
---

Item D do roadmap (§3.6) concluído em 2026-06-02. 11 arquivos migrados de `useToast`/`sonner` para `handleError` + `lib/ui/toast-config`: `times/novo`, `times/[id]/editar`, `times/[id]`, `times/page`, `projetos/novo`, `projetos/[id]`, `projetos/[id]/editar`, `configuracoes/usuarios`, `pessoas/nova`, `pessoas/[id]`, `pessoas/[id]/editar`.

**Why:** convenção do projeto exige `handleError(error, tipo)` de `lib/errors/error-handler.ts` e helpers de `lib/ui/toast-config`; uso direto de `useToast`/`sonner` era resíduo do v0.dev.

**How to apply:** ao auditar qualquer página, checar ausência de `import.*useToast` e `import.*sonner` direto. §3.6 agora descreve a convenção apenas para código novo — não há mais lista de pendências.
