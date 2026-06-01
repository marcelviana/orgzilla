# Prompt — Sincronizar a documentação do Orgzilla com o repositório

## Objetivo

Auditar o repositório e **deixar a documentação coerente com o código real**. A fonte de verdade é o `STATUS.md`; ele está parcialmente desatualizado. Sua tarefa é verificar cada afirmação dos docs contra o repo e corrigir o que divergir.

**Você só edita documentação** (`STATUS.md`, `CLAUDE.md`, `README.md` e, se necessário, os subagentes em `.claude/agents/`). **Não** altere lógica de negócio, Services, Repositories, Actions, componentes, SQL ou RLS. Se a auditoria revelar um bug ou um risco de segurança no código, **relate** no resumo final — não corrija por conta própria.

## Antes de começar

Leia, nesta ordem: `STATUS.md`, depois `CLAUDE.md`, depois `README.md`. Eles definem as regras (arquitetura em camadas UI → Action → Service → Repository → Supabase; LGPD/salário em `pessoa_remuneracao` via `PermissaoService`; convenções de erro via `handleError` + `toast-config`; sem `mock` em código novo; sem deps `"latest"`).

## Passo 1 — Levantamento (verifique, não presuma)

Rode buscas no repo e anote o estado **real** de cada item. Sugestões de verificação (ajuste conforme a estrutura atual):

1. **Migração mock → real.** Para cada página em `app/(dashboard)/`, determine se consome Server Actions reais ou dados hardcoded:
   - `grep -rn "mock" app/` e `grep -rn "\[v0\]" app/` — liste arquivo:linha de cada resíduo.
   - Confirme quais páginas importam de `app/actions/*` e quais ainda definem arrays `mock*` ou `*_MOCK`.
   - Pontos de atenção conhecidos a confirmar: detalhe da pessoa (`pessoas/[id]`), `relatorios`, `busca`, landing de `configuracoes`, `organograma`, e a **troca de senha** em `perfil` (verifique se `handleChangePassword` chama `AuthService.atualizarSenha` ou se ainda é `setTimeout` + toast fake).
   - Para cada página com `mock*`: classifique como **(a) mock residual morto** (a página já usa dados reais e o array não é mais referenciado) ou **(b) mock vivo** (a página ainda depende dele). Use referência cruzada, não só a presença da string.

2. **Server Actions existentes.** `ls app/actions/` — a lista no `STATUS.md` §2 bate? (confirme inclusão de `cargos`, `trilhas`, `auth`, etc.)

3. **Testes.** Existe script `test` no `package.json`? Algum framework (Vitest) instalado? Algum arquivo `*.test.ts`/`*.spec.ts`? Confirme o §3.2.

4. **Débito arquitetural.** Confira o §3.3:
   - `grep -rn "supabase.from(" app/actions/` — quais Actions ainda acessam o banco cru?
   - Quais Actions usam Repository direto sem passar por Service (ex.: `cargos.actions`, `trilhas.actions`, `times.actions`)?
   - A recursão de hierarquia está num único lugar (`PermissaoService`) com proteção contra ciclos? Há cópias?
   - Auto-criação de usuário: em quantos arquivos aparece?

5. **Lockfiles e dependências (§3.4).** Existem `package-lock.json` **e** `pnpm-lock.yaml`? Liste os pins `"latest"` ainda presentes no `package.json`.

6. **Convenção de erros.** `grep -rn "useToast\|from 'sonner'\|from \"sonner\"" app/ components/` — quais arquivos usam toast fora do padrão `handleError` + `lib/ui/toast-config`?

7. **Coerência entre docs.** Verifique as referências cruzadas: o `CLAUDE.md` aponta seções do `STATUS.md` que existem com esses números? (há suspeita de `§2.3`/`§2.4` que deveriam ser `§3.3`/`§3.4`). O `README.md` aponta seções corretas? Os subagentes citam números de seção válidos?

## Passo 2 — Reconciliar o `STATUS.md`

Com base no levantamento, atualize o `STATUS.md` para refletir o estado real:

- Corrija a tabela do §3.1 (estados ✅/⚠️/❌/☐ por página), **separando lista de detalhe** quando o estado divergir (ex.: `pessoas` lista vs. `pessoas/[id]`).
- Atualize o §2 (inventário de Services/Actions).
- Atualize §3.2, §3.3, §3.4 conforme o que encontrou.
- No §4 (Segurança), garanta que qualquer tela de salário ainda mockada tenha um aviso para, ao migrar, passar **obrigatoriamente** por `PessoaService`/`PermissaoService` (nunca `supabase.from('pessoa_remuneracao')` direto na Action/UI).
- Reordene o §5 (roadmap) pela realidade atual.
- Atualize a data "Última atualização" no topo e o "Resumo de uma linha".
- Mantenha a legenda do §8. Use **☐ a verificar** para qualquer item que você não conseguiu confirmar com certeza — não escreva afirmação não verificada como fato.

## Passo 3 — Coerência entre os docs canônicos

- Corrija no `CLAUDE.md` as referências de seção quebradas para o `STATUS.md` (aponte para os números corretos).
- Ajuste no `README.md` qualquer referência de seção ou descrição de estado que tenha ficado defasada.
- Confira que os subagentes em `.claude/agents/` citam números de seção válidos; corrija se preciso.
- Não duplique conteúdo do `STATUS.md` nos outros docs — eles apontam para ele.

## Regras e limites

- **Escopo de edição:** apenas docs (`STATUS.md`, `CLAUDE.md`, `README.md`, `.claude/agents/*`). Nada de código, SQL ou RLS.
- **Sem inventar:** toda mudança de estado tem que ter respaldo numa verificação do repo. O que não deu para confirmar entra como **☐ a verificar**.
- **Disciplina de commit (CLAUDE.md):** as mudanças de documentação vão num commit dedicado. Sugira uma mensagem de commit clara (ex.: `docs: sincroniza STATUS.md e refs com o estado atual do repo`).
- **Segurança:** se encontrar exposição de salário, RLS enfraquecido ou qualquer regra LGPD furada, **pare e relate** em destaque — não silencie no doc.

## Saída esperada (em PT-BR)

1. Um **resumo da auditoria**: para cada afirmação relevante dos docs, "confere" ou "diverge", com arquivo:linha de evidência.
2. Os **diffs** aplicados em cada doc.
3. Uma lista de **itens ☐ a verificar** que precisam de confirmação humana.
4. Uma seção **"achados de código" (não corrigidos)**: bugs/riscos/débito que a auditoria revelou e que exigem decisão sua antes de mexer no código.
5. A **mensagem de commit** sugerida.