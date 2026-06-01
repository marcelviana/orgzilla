# Prompt — Plano de migração mock → real

> Cole este prompt no Claude Code, na raiz do projeto. Ele só lê e planeja — não altera nenhum arquivo.

## Objetivo

Inspecionar o repositório e produzir um **plano de execução ordenado** para substituir todos os dados mockados por dados reais. O plano será validado pelo mantenedor antes de qualquer código ser tocado.

Você **não altera nenhum arquivo** nesta etapa. Apenas lê, analisa e planeja.

---

## Passo 1 — Leia o contexto do projeto

Leia nesta ordem:
1. `STATUS.md` — estado atual, o que já está migrado (§3.1), débito arquitetural (§3.3), regras de salário/LGPD (§4)
2. `CLAUDE.md` — arquitetura em camadas, convenções, regras de segurança

Não releia após este passo — use como referência durante a análise.

---

## Passo 2 — Inventário completo de mocks vivos

Para cada arquivo em `app/(dashboard)/`, determine se há mock vivo (array ou objeto hardcoded que a página **usa na renderização**). Ignore mocks mortos (declarados mas não referenciados).

```bash
# Ponto de partida — ajuste os padrões conforme o que encontrar
grep -rn "const mock\|= \[.*{" app/ --include="*.tsx" -l
grep -rn "_MOCK\b\|MOCK_\|mockData\|\[v0\]" app/ --include="*.tsx" -l
grep -rn "setTimeout.*toast\|console\.log.*v0" app/ --include="*.tsx" -l
```

Para cada ocorrência, confirme por referência cruzada no arquivo se o mock é **vivo** (página depende dele) ou **morto** (resíduo não usado). Não classifique pela presença da string — rastreie o uso.

Monte uma tabela com:

| Página | Mock(s) vivo(s) | O que a UI precisa mostrar |
|---|---|---|
| `perfil` (troca de senha) | `setTimeout` fake | Chamar API de troca de senha com reautenticação |
| ... | ... | ... |

---

## Passo 3 — Mapeamento de dependências

Para cada página com mock vivo, identifique o que ela precisa para usar dados reais:

**A) Já existe no backend?**
- Verifique `app/actions/` — existe uma Action que retorna esses dados?
- Verifique `lib/services/` — existe um Service com essa lógica?
- Verifique `lib/repositories/` — existe um Repository com essa query?

**B) O que falta criar?**
- Nova Action (só orquestra Repository/Service existente)
- Nova query no Repository existente (novo método)
- Novo Service (lógica de negócio nova)
- Decisão de produto pendente (ex.: notas/timeline em `pessoas/[id]` — Phase 3 ou agora?)

**C) Há dependência entre páginas?**
- Ex.: `pessoas/nova` e `pessoas/[id]/editar` provavelmente compartilham o mesmo seletor de projetos/tags — migrar junto.
- Ex.: painel de pessoas-em-cargo (`configuracoes/cargos`) e pessoas-em-trilha (`configuracoes/trilhas`) podem compartilhar a mesma query base.

**D) Há risco de LGPD/segurança?**
- Qualquer seção que exiba dados de pessoa deve passar por `PessoaService`/`PermissaoService` — nunca `supabase.from('pessoa_remuneracao')` direto.
- Marque explicitamente as páginas onde isso se aplica.

---

## Passo 4 — Monte o plano de execução

Ordene as migrações em grupos, respeitando:
1. **Dependências**: o que uma página precisa que outra ainda não criou
2. **Custo x valor**: prefira começar pelo que tem maior impacto com menor risco (ex.: conectar uma Action existente vs. criar Service novo)
3. **Decisões pendentes**: itens que exigem validação do mantenedor antes de codar ficam em grupo separado

Para cada item do plano, use este formato:

---

### [Grupo N] `caminho/da/pagina`

**Mock(s) a remover:** `nomeDOMock`, `OUTRO_MOCK`
**O que a UI precisa:** descrição do dado em linguagem de produto
**O que já existe:** `NomeAction` em `app/actions/arquivo.ts`, `NomeRepository.metodo()`
**O que criar:** `getNomeDaQuery()` no `NomeRepository` (ou "nada — só conectar")
**Camada nova:** Action / query de Repository / Service / nenhuma
**Risco LGPD:** sim/não — motivo se sim
**Dependência de:** outro grupo ou "nenhuma"
**Estimativa de complexidade:** baixa / média / alta
**Decisão pendente:** se houver — descreva a dúvida para o mantenedor

---

## Passo 5 — Checklist de execução por item

Para cada grupo do plano, gere um checklist que será usado como prompt de execução em uma **sessão nova e isolada** do Claude Code — sem acesso ao contexto desta sessão de planejamento. Por isso:

- **Resolva todas as condicionais aqui.** Não deixe itens com "se criou um Service" para o executor decidir — decida agora e inclua ou omita o item já resolvido.
- **Inclua a justificativa** em itens não-óbvios, para que o executor entenda o porquê sem precisar consultar este prompt.

Formato base — adapte os itens para o que cada migração requer:

```
## Checklist — [Grupo N] `caminho/da/pagina`

**Contexto:** [1-2 linhas descrevendo o que este grupo faz e por quê esta ordem]

- [ ] Ler STATUS.md §3.1 e CLAUDE.md §Arquitetura antes de começar
- [ ] Criar `nomeDoMetodo()` em `lib/repositories/nome.repository.ts`
- [ ] Criar Action `getNomeDaAction()` em `app/actions/nome.actions.ts`
- [ ] Substituir `MOCK_X` na página por chamada à Action
- [ ] Remover imports e declarações do mock
- [ ] Verificar: nenhum `supabase.from()` cru na UI ou Action (deve passar por Repository)
- [ ] Rodar `npm run build` — deve passar
- [ ] Acionar subagente `revisor-camadas` — resolver todos os 🔴 antes de commitar
- [ ] Acionar subagente `sincronizador-docs` no mesmo commit
- [ ] Mensagem de commit sugerida: `feat: migra [página] para dados reais`
```

**Regra de testes (resolva aqui, não deixe para o executor):**
- Se o grupo **cria ou modifica um Service** (`lib/services/`): adicione ao checklist os dois itens abaixo, com a justificativa específica do que testar:
  ```
  - [ ] Instalar Vitest com versão exata via pnpm — só se ainda não instalado (verificar package.json antes)
  - [ ] Acionar subagente `escritor-testes`: cobrir [descreva aqui a lógica de negócio específica] — testes passando antes de commitar
  ```
- Se o grupo **só conecta Action a Repository existente** (sem lógica de negócio nova): omita os itens de teste completamente. Não deixe o item como condicional — simplesmente não inclua.

---

## Saída esperada (em PT-BR)

1. **Tabela de inventário** (Passo 2) — todos os mocks vivos com o que a UI precisa
2. **Plano de execução ordenado** (Passo 4) — grupos com o formato acima
3. **Decisões pendentes** — lista separada de itens que precisam de validação antes de codar (ex.: escopo de notas/timeline, estrutura de busca cross-entidade)
4. **Checklist por grupo** (Passo 5) — prontos para virar prompts de execução
5. **Resumo final**: quantas páginas, quantos grupos, qual a estimativa geral de complexidade

Não execute nenhuma migração. Entregue apenas o plano.