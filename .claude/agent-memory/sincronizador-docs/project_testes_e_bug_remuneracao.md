---
name: project_testes_e_bug_remuneracao
description: Infraestrutura Vitest criada (45 testes passando); bug LGPD em relatorios.actions corrigido — padrão de como registrar bug detectado por teste e sua resolução no STATUS.md
metadata:
  type: project
---

Vitest 4.1.8 instalado (commit c3ac8a2 precedente ao fix). 3 arquivos em `__tests__/`: `permissao.service.test.ts` (22), `time.service.test.ts` (11), `remuneracao.separacao.test.ts` (12). Todos os 45 passando após commit 672c47e.

**Why:** Um dos testes de `remuneracao.separacao` fazia grep nos arquivos de `app/` e `lib/` para garantir que `supabase.from('pessoa_remuneracao')` não aparecesse fora de `lib/repositories`. Isso detectou a violação em `relatorios.actions.ts:448` que acessava diretamente, pulando o `PessoaService`.

**Correção aplicada:** `relatorios.actions.ts` migrado para `pessoaService.buscarAgregadosSalariais(usuario, timeIds)`. Dois métodos novos criados: `PessoaService.buscarAgregadosSalariais` (guarda de perfil + filtro hierarquia) e `PessoaRemuneracaoRepository.findComCargoETimes` (join cargo/nível, tipo `RemuneracaoComCargo`).

**Padrão para o STATUS.md ao corrigir bug detectado por teste:**
- Em §3.2, mudar o estado do arquivo de `11 ✅ / 1 ❌ bug confirmado` para `✅ passando`.
- Substituir o bloco `BUG DETECTADO` por `Bug resolvido` com descrição da correção e métodos introduzidos.
- No §5 roadmap, marcar o item de testes como ✅.
- Não deixar rastro de "bug pendente" quando já resolvido.
