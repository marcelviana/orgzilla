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
