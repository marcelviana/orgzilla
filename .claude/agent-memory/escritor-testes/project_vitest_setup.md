---
name: vitest-setup
description: Configuração do Vitest no Orgzilla — versão instalada, padrões de mock e armadilhas conhecidas
metadata:
  type: project
---

Vitest 4.1.8 + @vitest/coverage-v8 4.1.8 instalados como devDependencies fixadas (sem `^`/`~`) via pnpm.
Config: `vitest.config.ts` na raiz, alias `@/*` → `./`, environment node.
Scripts: `test` = `vitest run`, `test:watch` = `vitest`.
Testes vivem em `__tests__/` na raiz do projeto.

**Why:** pnpm é o gerenciador oficial (só `pnpm-lock.yaml` no repo). Node ativo no ambiente é v10 por default — é preciso `nvm use 23` antes de rodar `pnpm` (v10 não suporta a sintaxe do pnpm atual).

**How to apply:** Ao adicionar testes, usar `pnpm test` com Node 23. Não criar `package-lock.json`.

## Armadilha: mock de classes com vi.mock

`vi.fn().mockImplementation(() => objetoMock)` NÃO funciona como constructor (Vitest 4.x lança "not a constructor").

Padrão que funciona:
```ts
vi.mock('@/lib/repositories', () => {
  function TimeRepository() { return mockTimeRepo }
  function PessoaRepository() { return mockPessoaRepo }
  return { TimeRepository, PessoaRepository }
})
```

## Padrão de mock dos Services que têm dependências encadeadas

Services como `PessoaService` e `TimeService` instanciam internamente `AuditoriaService`, `HistoricoService`, etc. Mocká-los todos no `vi.mock` usando o padrão acima (function como constructor). Importar o Service via `import()` dinâmico dentro do teste (`async function getService()`) para garantir que os mocks já estão registrados antes da importação.

## Padrão de mock para Repositories (Supabase direto)

Repositories chamam `this.supabase.from(tabela).select(...).eq(...) ...` em cadeia. O mock precisa de um query builder onde todos os métodos intermediários retornam `this` (o mesmo objeto) e o objeto é awaitable com resultado configurable:

```ts
function makeQueryBuilder(result = {}) {
  const defaults = { data: null, error: null, count: null, ...result }
  const builder: Record<string, unknown> = {}
  const chainable = ['select','eq','neq','in','ilike','or','is','gte','lt','order','range','single','maybeSingle']
  for (const method of chainable) {
    builder[method] = vi.fn().mockReturnValue(builder)
  }
  Object.assign(builder, {
    then: (resolve) => resolve(defaults),
  })
  return builder
}
function makeSupabase(queryResult = {}) {
  const builder = makeQueryBuilder(queryResult)
  return { from: vi.fn().mockReturnValue(builder), _builder: builder }
}
```

Não use `vi.mock('@/lib/repositories', ...)` para testar repositories — instancie diretamente com `new PessoaRepository(supabase as never)`.

## Mock de findByPessoaIds (PessoaRemuneracaoRepository)

O método `enriquecerListaComRemuneracao` usa `findByPessoaIds` (plural), que não existia no mock de `remuneracao.separacao.test.ts`. Ao criar testes para esse método, o `mockRemuneracaoRepo` deve incluir `findByPessoaIds: vi.fn()` e `findComCargoETimes: vi.fn()` além dos já existentes.

## Armadilha: builder compartilhado entre chamadas encadeadas

Todos os métodos retornam o mesmo `builder`. Quando o código faz `query = query.eq(...)` e depois outro `.eq(...)`, ambas as chamadas vão para o mesmo `vi.fn()`. Ao verificar chamadas específicas, use `.mock.calls.find(c => c[0] === 'campo')` em vez de `toHaveBeenCalledWith` direto (que pode colidir com chamadas de outros filtros da mesma cadeia).
