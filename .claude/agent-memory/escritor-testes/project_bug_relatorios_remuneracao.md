---
name: bug-relatorios-remuneracao-acesso-direto
description: Bug confirmado por teste — relatorios.actions.ts acessa pessoa_remuneracao diretamente, violando arquitetura
metadata:
  type: project
---

`app/actions/relatorios.actions.ts:448` executa `supabase.from('pessoa_remuneracao')` diretamente, pulando o `PessoaRemuneracaoRepository` e o `PessoaService`.

**Why:** A migração de relatorios para dados reais foi feita com `supabase.from()` cru para buscar agregados salariais (distribuição de folha por nível/time), sem passar pela camada de Service/Repository. A regra arquitetural proíbe isso — dados sensíveis de `pessoa_remuneracao` devem sempre passar pelo `PessoaService.buscarRemuneracao` (que aplica `PermissaoService`).

**How to apply:** O teste `__tests__/remuneracao.separacao.test.ts` → "não há referência a supabase.from("pessoa_remuneracao") fora de lib/repositories" falha intencionalmente até isso ser corrigido. Ao migrar, usar `PessoaRemuneracaoRepository` dentro da action de relatórios, ou criar um método de agregação em `PessoaService` que aplique o filtro de hierarquia e retorne apenas os agregados (sem expor os salários individuais). Não corrigir código de produção sem alinhamento com o mantenedor.
