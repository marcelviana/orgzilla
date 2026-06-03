# CLAUDE.md — Orgzilla

> Instruções persistentes para o Claude Code neste projeto. Mantenha **curto e estável**.
> O **estado atual** do projeto (o que está pronto, mock, quebrado, roadmap) vive no `STATUS.md`, não aqui.
> Em caso de conflito com docs antigas (READMEs de camada, versões anteriores deste arquivo), **o `STATUS.md` descreve a realidade**.

---

## Contexto

Orgzilla é um sistema de gestão de pessoas, times, cargos e projetos para organizações com dezenas de times e 100+ pessoas. Gerencia hierarquia de times, progressão de carreira, salários (com restrição LGPD), alocação em projetos e auditoria.

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Supabase (PostgreSQL, Auth, Storage) · Tailwind + Radix/shadcn · Lucide · Recharts · React Hook Form + Zod.
- **Hospedagem:** Vercel.
- **Idioma:** comunicação e mensagens de UI em **português (Brasil)**.

Antes de qualquer trabalho não-trivial, leia o `STATUS.md` — a documentação antiga pode estar desatualizada.

---

## Manutenção do STATUS.md

O `STATUS.md` é a fonte única de verdade sobre o estado do projeto.

Ao concluir trabalho que mude o estado descrito nele — migrar página de mock para real, completar/remover uma camada, alterar dependências, mexer em RLS/segurança, ou concluir item do roadmap:

1. Atualize a seção relevante do `STATUS.md`.
2. Atualize a data "Última atualização" no topo.
3. Inclua a alteração do `STATUS.md` no **mesmo commit** da mudança de código.

Não atualize por mudanças triviais. Não duplique o conteúdo do `STATUS.md` aqui.

---

## Arquitetura-alvo

Camadas, com fluxo em uma direção:

```
UI (componentes/páginas)
   ↓
Server Actions (app/actions/*)        ← orquestram, retornam ActionResult<T>
   ↓
Services (lib/services/*)             ← TODA a lógica de negócio, permissões, auditoria, cálculos
   ↓
Repositories (lib/repositories/*)     ← APENAS acesso a dados (CRUD, queries, filtros)
   ↓
Supabase / PostgreSQL
```

Princípio: a **lógica de negócio fica na aplicação** (Services), não no banco — sem triggers/funções/views de regra de negócio. O banco guarda dados e aplica **controle de acesso** (RLS — ver Segurança).

Regras:
- Não coloque lógica de negócio, permissão ou auditoria em Repository — isso é Service.
- Não chame `supabase.from(...)` direto numa Action quando já existe Repository/Service para a entidade. Use a camada.
- Não acesse o banco direto de componentes — sempre via Action → Service.
- Ao tocar em código que fura a camada (qualquer `supabase.from()` cru em Action ou lógica de negócio em Repository), **migre para o padrão acima** em vez de replicar o atalho. Ver `STATUS.md` §3.3.
- A recursão de hierarquia de times deve viver num **único lugar** (`TimeService`), com proteção contra ciclos. Não crie novas cópias.
- Sempre obtenha o usuário atual do contexto de auth; nunca hardcode UUIDs.

---

## Segurança e dados sensíveis (LGPD) — não negociável

Campos sensíveis: `pessoa_remuneracao.salario_atual`, `pessoa_remuneracao.data_ultimo_reajuste`, `pessoa_remuneracao.motivo_ultimo_reajuste` e todos os registros de `historico_reajuste`. O salário **não vive em `pessoa`**: foi isolado na tabela 1:1 `pessoa_remuneracao` justamente porque RLS é por linha, não por coluna (ver `STATUS.md` §3.1).

Regra de acesso a salário (intencional):
- **Gestor:** vê salários da sua hierarquia.
- **Admin:** **não** vê salários (é admin de sistema, não de RH).
- **Visualizador:** não vê salários.

Proteção em profundidade — **ambas as camadas**, não só uma:
- **Banco (RLS):** dado sensível deve ser protegido por Row Level Security. A filtragem de campos no app **não basta** — sem RLS, um usuário autenticado pode ler o dado via query direta ao Supabase. `pessoa_remuneracao` já tem RLS que só libera acesso ao perfil `gestor`. Toda tabela com dado sensível precisa de `ENABLE ROW LEVEL SECURITY` + policies. RLS é opt-in por tabela; não é automático.
- **Aplicação:** o `PessoaService` (`buscarRemuneracao`/`salvarRemuneracao`) só lê/grava remuneração quando `PermissaoService` autoriza (gestor da hierarquia); a UI omite o campo para quem não pode ver. Não busque `pessoa_remuneracao` direto numa Action — use o Service.

Não enfraqueça nem remova policies sem registrar o motivo no `STATUS.md`. Em qualquer mudança que toque RLS ou exposição de salário, **pare e confirme com o mantenedor** antes de aplicar.

---

## Convenções de código

- **Migração mock → real:** o objetivo é eliminar dados mock. **Não** adicione novos `mock*`. Ao trabalhar numa página que ainda usa mock, conecte-a às Actions reais.
- **Tratamento de erro:** use `handleError(error, tipo)` de `lib/errors/error-handler.ts` e os toasts de `lib/ui/toast-config.ts` (`toast.error`, `toast.successDino`, etc.). Não use `useToast`/`sonner` direto em código novo.
- **Loading de página:** use os skeletons de `components/shared/LoadingState.tsx` (`TableSkeleton`, `CardSkeleton`, `DetailsSkeleton`, `ChartSkeleton`). Não crie skeletons inline em páginas novas.
- **Validação** antes de enviar ao servidor, com os helpers (`validateRequired`, `validateEmail`, `validatePassword`).
- **Actions** retornam sempre `ActionResult<T>` = `{ success, data?, error? }`.
- **Soft delete** por padrão (`ativo = false`); evite hard delete.
- **Tipos** sempre de `@/lib/types`; não redefina tipos de tabela localmente.
- Remova `console.log('[v0] ...')` remanescentes ao tocar num arquivo (resíduo do v0.dev).
- Sempre cheque permissão antes de consultar/retornar dados; gestor só acessa a própria hierarquia (filtro recursivo).

### Nomenclatura
- **Arquivos de componente:** kebab-case SEM exceção (`pessoa-form.tsx`, `page-header.tsx`). Inclui `components/shared/` — nenhum arquivo PascalCase permitido. `components/ui/` segue o lowercase do shadcn, que já é compatível.
- **Páginas:** `page.tsx`, `[id]/page.tsx`.
- **Services/utils:** camelCase com sufixo (`pessoa.service.ts`, `format.ts`).
- **Identificadores de componente:** PascalCase (`function PessoaForm() {}`).
- **Funções:** camelCase · **Constantes:** UPPER_SNAKE_CASE · **Types/Interfaces:** PascalCase.
- **Banco:** tabelas e colunas em snake_case; FKs com sufixo `_id` (`cargo_id`, `time_pai_id`).

---

## Schema (17 tabelas)

Núcleo:
1. `usuario` — usuários do sistema (login). `tipo_perfil`: admin | gestor | visualizador. `pessoa_id` opcional.
2. `nivel` — níveis L1–L16, encadeados via `nivel_anterior_id`.
3. `trilha_carreira` — trilhas (Engenharia, Produto, Design, Dados…).
4. `cargo` — posição = uma trilha + um nível (`trilha_id`, `nivel_id`).
5. `time` — times hierárquicos (`time_pai_id` auto-referência, `gestor_id`).
6. `pessoa` — colaboradores. `cargo_id`/`time_id` nullable. `status`: ativo|ferias|licenca|afastamento|desligado. **Campos nullable para permitir entrada incremental.** Salário **não** fica aqui (ver `pessoa_remuneracao`).
6a. `pessoa_remuneracao` — dados salariais 1:1 com `pessoa` (PK/FK `pessoa_id`, `ON DELETE CASCADE`): `salario_atual`, `data_ultimo_reajuste`, `motivo_ultimo_reajuste`. **SENSÍVEL — RLS só gestor.** Acesso via `PessoaRemuneracaoRepository` → `PessoaService`.
7. `projeto_produto` — projetos (apenas nome + ativo; não é ferramenta de PM).
8. `pessoa_projeto_produto` — alocação N:N (`data_fim` null = atual).
9. `vaga_time` — vagas abertas (`time_id`, `cargo_id`, `quantidade`).
10. `tag` / 11. `pessoa_tag` — tags N:N.
12. `anotacao` — notas sobre pessoa/time (`tipo_entidade`, `entidade_id`).

Histórico (gerenciado pela aplicação):
13. `historico_mudanca` — auditoria (`valor_anterior`/`valor_novo` jsonb).
14. `historico_reajuste` — mudanças salariais. **SENSÍVEL — só gestor.**
15. `historico_time` — alocações de time.
16. `historico_cargo` — histórico de cargos.

---

## Dependências

- **Um único lockfile.** Use **pnpm** — apenas `pnpm-lock.yaml` existe no repo (ver `STATUS.md` §3.4). Não crie `package-lock.json`.
- **Sem `"latest"`:** ao adicionar/ajustar dependências, fixe versão exata. Não introduza novos pins `"latest"`.

---

## Padrões de tipagem — Supabase query builder

### A armadilha

Métodos de filtro (`.eq`, `.in`, `.or`, `.gte`, `.lt`) e de transformação (`.order`, `.range`, `.limit`) retornam tipos genéricos distintos que dependem da inferência do esquema da tabela. Reatribuir o resultado numa variável com anotação explícita (`let query: PostgrestFilterBuilder`) quebra quando o tipo inferido não bate exatamente. A saída fácil — `let query: any` — desabilita toda a type-safety da chamada.

### O padrão adotado no projeto

Use a interface `SelectQueryBuilder` definida em [`lib/repositories/base.repository.ts`](lib/repositories/base.repository.ts) e force a conversão na criação da query com `as unknown as SelectQueryBuilder`. Filtros condicionais reatribuem sem perder tipos porque todos os métodos retornam `SelectQueryBuilder`.

```typescript
// lib/repositories/pessoa.repository.ts
let query = this.supabase
  .from('pessoa')
  .select(selectFields, { count: 'exact' })
  .eq('ativo', true) as unknown as SelectQueryBuilder

if (filters.search) {
  query = query.or(`nome.ilike.%${filters.search}%`)
}
if (filters.timeId) {
  query = query.eq('time_id', filters.timeId)
}
const { data, error, count } = await query
```

### Regra dura

**Proibido** usar `any` ou `// eslint-disable` como saída para problema de tipagem em query builder. Se a tipagem honesta não for possível num caso específico, PARE e leve ao mantenedor — não silencie.

---

## Testes

O projeto usa **Vitest** (106 testes em 5 arquivos, rodando em `__tests__/`). Ao adicionar lógica de negócio crítica (permissões, hierarquia, separação de salário), acompanhe com testes. "Sem teste" não é o padrão aceitável para regra de negócio nova.

```bash
pnpm test          # roda todos os testes
pnpm test --watch  # modo watch
```

---

## Comandos

```bash
npm run dev      # desenvolvimento
npm run build    # build (deve passar antes de commitar mudança estrutural)
npm run lint     # lint
```

---

## Marca e personalidade

Orgzilla é um "kaiju corporativo" amigável — esperto, energético, confiável, profissional mas acessível. Não use jargão técnico, códigos de erro crus nem tom robótico nas mensagens ao usuário.

- 🦖 em mensagens de sucesso: `toast.successDino("Pessoa salva com sucesso!")`
- Erros amigáveis: `"Ops! Orgzilla tropeçou. Tente novamente."`
- Empty states úteis: `"Nenhuma pessoa encontrada. Adicione a primeira!"`
- Sentence case em títulos (evite ALL CAPS).

Cores (Tailwind): `primary #FF7A00` (laranja) · `secondary #1A2734` (azul noite) · `accent #00C8FF` (ciano) · `surface #F4F5F7` (cinza) · `error #FF5A5F` (coral).
Fontes: headings Outfit/Poppins; corpo Inter.
Logos: `/logo_fundo_escuro.png` (sidebar), `/logo_fundo_claro.png` (fundo claro).

---

## Ao trabalhar com o Claude Code

- Seja específico: caminho do arquivo, comportamento esperado e comportamento atual.
- Em mudanças de segurança/RLS ou exposição de salário: pare e confirme com o mantenedor.
- Consulte o `STATUS.md` antes de assumir o estado de qualquer parte do sistema.