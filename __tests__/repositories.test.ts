import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PessoaRepository } from '@/lib/repositories/pessoa.repository'
import { TimeRepository } from '@/lib/repositories/time.repository'
import { VagaTimeRepository } from '@/lib/repositories/vaga-time.repository'

// ---------------------------------------------------------------------------
// Fábrica de mock do cliente Supabase
// Os métodos retornam `this` para permitir encadeamento, exceto os terminais
// que retornam uma Promise com { data, error, count }.
// ---------------------------------------------------------------------------

function makeQueryBuilder(result: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const defaults = { data: null, error: null, count: null, ...result }
  const builder: Record<string, unknown> = {}

  const chainable = [
    'select', 'eq', 'neq', 'in', 'ilike', 'or', 'is', 'gte', 'lt',
    'order', 'range', 'single', 'maybeSingle',
  ]

  for (const method of chainable) {
    builder[method] = vi.fn().mockReturnValue(builder)
  }

  // Métodos terminais que devolvem resultado
  ;(builder as Record<string, unknown>).then = undefined // não é thenable por default
  Object.assign(builder, {
    // Torna o builder awaitable
    then: (resolve: (v: unknown) => unknown) => resolve(defaults),
  })

  return builder
}

function makeSupabase(queryResult: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const builder = makeQueryBuilder(queryResult)
  return {
    from: vi.fn().mockReturnValue(builder),
    _builder: builder,
  } as unknown as ReturnType<typeof makeQueryBuilder> & { from: ReturnType<typeof vi.fn>; _builder: typeof builder }
}

// ---------------------------------------------------------------------------
// BLOCO 1 — PessoaRepository
// ---------------------------------------------------------------------------

describe('PessoaRepository', () => {
  // -------------------------------------------------------------------------
  // findComFiltrosPaginados
  // -------------------------------------------------------------------------
  describe('findComFiltrosPaginados', () => {
    it('retorna dados e count quando não há filtros nem hierarquia', async () => {
      const supabase = makeSupabase({ data: [{ id: 'p-1', nome: 'Ana' }], count: 1 })
      const repo = new PessoaRepository(supabase as never)

      const result = await repo.findComFiltrosPaginados({
        filters: {},
        pagination: { page: 1, itemsPerPage: 20 },
      })

      expect(supabase.from).toHaveBeenCalledWith('pessoa')
      expect(result.count).toBe(1)
      expect(result.data).toHaveLength(1)
    })

    it('aplica filtro de hierarquia (timeIdsHierarquia) quando fornecido', async () => {
      const supabase = makeSupabase({ data: [], count: 0 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findComFiltrosPaginados({
        filters: {},
        timeIdsHierarquia: ['time-A', 'time-B'],
        pagination: { page: 1, itemsPerPage: 20 },
      })

      expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('time_id', ['time-A', 'time-B'])
    })

    it('NÃO aplica filtro .in quando timeIdsHierarquia é undefined', async () => {
      const supabase = makeSupabase({ data: [], count: 0 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findComFiltrosPaginados({
        filters: {},
        pagination: { page: 1, itemsPerPage: 20 },
      })

      // .in não deve ter sido chamado com time_id
      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      const timeIdCall = inCalls.find((c: unknown[]) => c[0] === 'time_id')
      expect(timeIdCall).toBeUndefined()
    })

    it('NÃO aplica filtro .in quando timeIdsHierarquia é array vazio', async () => {
      const supabase = makeSupabase({ data: [], count: 0 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findComFiltrosPaginados({
        filters: {},
        timeIdsHierarquia: [],
        pagination: { page: 1, itemsPerPage: 20 },
      })

      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      const timeIdCall = inCalls.find((c: unknown[]) => c[0] === 'time_id')
      expect(timeIdCall).toBeUndefined()
    })

    it('aplica filtro de busca textual (search)', async () => {
      const supabase = makeSupabase({ data: [], count: 0 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findComFiltrosPaginados({
        filters: { search: 'maria' },
        pagination: { page: 1, itemsPerPage: 20 },
      })

      const orFn = builder.or as ReturnType<typeof vi.fn>
      expect(orFn).toHaveBeenCalledWith(expect.stringContaining('maria'))
    })

    it('NÃO aplica filtro .eq quando timeId é o sentinela "todos"', async () => {
      const supabase = makeSupabase({ data: [], count: 0 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findComFiltrosPaginados({
        filters: { timeId: 'todos' },
        pagination: { page: 1, itemsPerPage: 20 },
      })

      const eqCalls = (builder.eq as ReturnType<typeof vi.fn>).mock.calls
      const timeIdEq = eqCalls.find((c: unknown[]) => c[0] === 'time_id')
      expect(timeIdEq).toBeUndefined()
    })

    it('aplica filtro timeId quando é um ID real', async () => {
      const supabase = makeSupabase({ data: [], count: 0 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findComFiltrosPaginados({
        filters: { timeId: 'time-X' },
        pagination: { page: 1, itemsPerPage: 20 },
      })

      const eqCalls = (builder.eq as ReturnType<typeof vi.fn>).mock.calls
      const timeIdEq = eqCalls.find((c: unknown[]) => c[0] === 'time_id')
      expect(timeIdEq).toBeDefined()
      expect(timeIdEq![1]).toBe('time-X')
    })

    it('aplica paginação correta para página 2 com 10 itens por página', async () => {
      const supabase = makeSupabase({ data: [], count: 0 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findComFiltrosPaginados({
        filters: {},
        pagination: { page: 2, itemsPerPage: 10 },
      })

      const rangeFn = builder.range as ReturnType<typeof vi.fn>
      expect(rangeFn).toHaveBeenCalledWith(10, 19) // from=10, to=19
    })

    it('lança erro quando supabase retorna error', async () => {
      const supabase = makeSupabase({ error: { message: 'db error', code: '500' } })
      const repo = new PessoaRepository(supabase as never)

      await expect(
        repo.findComFiltrosPaginados({
          filters: {},
          pagination: { page: 1, itemsPerPage: 20 },
        })
      ).rejects.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // findParaSelecao
  // -------------------------------------------------------------------------
  describe('findParaSelecao', () => {
    it('retorna pessoas ativas sem filtro quando timeIdsHierarquia não fornecido', async () => {
      const pessoas = [{ id: 'p-1', nome: 'Ana' }]
      const supabase = makeSupabase({ data: pessoas })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      const result = await repo.findParaSelecao()

      expect(result).toEqual(pessoas)
      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      expect(inCalls.find((c: unknown[]) => c[0] === 'time_id')).toBeUndefined()
    })

    it('aplica filtro de time quando timeIdsHierarquia é fornecido', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findParaSelecao(['time-1', 'time-2'])

      expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('time_id', ['time-1', 'time-2'])
    })

    it('NÃO aplica filtro quando timeIdsHierarquia é array vazio', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findParaSelecao([])

      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      expect(inCalls.find((c: unknown[]) => c[0] === 'time_id')).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // countAtivasComStatus
  // -------------------------------------------------------------------------
  describe('countAtivasComStatus', () => {
    it('retorna o count sem filtro de time quando timeIds não fornecido', async () => {
      const supabase = makeSupabase({ count: 42 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      const result = await repo.countAtivasComStatus()

      expect(result).toBe(42)
      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      expect(inCalls.find((c: unknown[]) => c[0] === 'time_id')).toBeUndefined()
    })

    it('aplica filtro por times quando timeIds é fornecido', async () => {
      const supabase = makeSupabase({ count: 5 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      const result = await repo.countAtivasComStatus(['time-1'])

      expect(result).toBe(5)
      expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('time_id', ['time-1'])
    })

    it('retorna 0 quando count é null', async () => {
      const supabase = makeSupabase({ count: null })
      const repo = new PessoaRepository(supabase as never)

      const result = await repo.countAtivasComStatus()

      expect(result).toBe(0)
    })

    it('aplica filtros ativo=true e status=ativo', async () => {
      const supabase = makeSupabase({ count: 10 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.countAtivasComStatus()

      const eqCalls = (builder.eq as ReturnType<typeof vi.fn>).mock.calls
      expect(eqCalls).toEqual(expect.arrayContaining([['ativo', true], ['status', 'ativo']]))
    })
  })

  // -------------------------------------------------------------------------
  // countCriadasNoPeriodo
  // -------------------------------------------------------------------------
  describe('countCriadasNoPeriodo', () => {
    it('aplica gte com dataInicio', async () => {
      const supabase = makeSupabase({ count: 3 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.countCriadasNoPeriodo('2024-01-01')

      expect((builder.gte as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('created_at', '2024-01-01')
    })

    it('aplica lt com dataFim quando fornecido', async () => {
      const supabase = makeSupabase({ count: 2 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.countCriadasNoPeriodo('2024-01-01', '2024-02-01')

      expect((builder.lt as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('created_at', '2024-02-01')
    })

    it('NÃO aplica lt quando dataFim é undefined', async () => {
      const supabase = makeSupabase({ count: 1 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.countCriadasNoPeriodo('2024-01-01')

      expect((builder.lt as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled()
    })

    it('aplica filtro de times quando timeIds fornecido', async () => {
      const supabase = makeSupabase({ count: 1 })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.countCriadasNoPeriodo('2024-01-01', undefined, ['time-A'])

      expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('time_id', ['time-A'])
    })

    it('retorna 0 quando count é null', async () => {
      const supabase = makeSupabase({ count: null })
      const repo = new PessoaRepository(supabase as never)

      expect(await repo.countCriadasNoPeriodo('2024-01-01')).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // findParaNivelDistribuicao
  // -------------------------------------------------------------------------
  describe('findParaNivelDistribuicao', () => {
    it('retorna dados sem filtro quando timeIds não fornecido', async () => {
      const dados = [{ id: 'p-1', cargo: { nivel: { nome: 'L3' } } }]
      const supabase = makeSupabase({ data: dados })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      const result = await repo.findParaNivelDistribuicao()

      expect(result).toEqual(dados)
      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      expect(inCalls.find((c: unknown[]) => c[0] === 'time_id')).toBeUndefined()
    })

    it('aplica filtro por times quando fornecido', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findParaNivelDistribuicao(['time-X'])

      expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('time_id', ['time-X'])
    })

    it('filtra ativo=true e status=ativo', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findParaNivelDistribuicao()

      const eqCalls = (builder.eq as ReturnType<typeof vi.fn>).mock.calls
      expect(eqCalls).toEqual(expect.arrayContaining([['ativo', true], ['status', 'ativo']]))
    })
  })

  // -------------------------------------------------------------------------
  // findParaTimeDistribuicao
  // -------------------------------------------------------------------------
  describe('findParaTimeDistribuicao', () => {
    it('retorna dados sem filtro quando timeIds não fornecido', async () => {
      const dados = [{ id: 'p-1', time: { nome: 'Engenharia' } }]
      const supabase = makeSupabase({ data: dados })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      const result = await repo.findParaTimeDistribuicao()

      expect(result).toEqual(dados)
      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      expect(inCalls.find((c: unknown[]) => c[0] === 'time_id')).toBeUndefined()
    })

    it('aplica filtro por times quando fornecido', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findParaTimeDistribuicao(['time-Y'])

      expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('time_id', ['time-Y'])
    })

    it('filtra ativo=true e status=ativo', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new PessoaRepository(supabase as never)

      await repo.findParaTimeDistribuicao()

      const eqCalls = (builder.eq as ReturnType<typeof vi.fn>).mock.calls
      expect(eqCalls).toEqual(expect.arrayContaining([['ativo', true], ['status', 'ativo']]))
    })
  })
})

// ---------------------------------------------------------------------------
// BLOCO 2 — TimeRepository
// ---------------------------------------------------------------------------

describe('TimeRepository', () => {
  // -------------------------------------------------------------------------
  // findAtivosParaFiltro
  // -------------------------------------------------------------------------
  describe('findAtivosParaFiltro', () => {
    it('retorna times ativos sem restrição quando timeIds não fornecido', async () => {
      const times = [{ id: 't-1', nome: 'Engenharia' }]
      const supabase = makeSupabase({ data: times })
      const builder = supabase._builder
      const repo = new TimeRepository(supabase as never)

      const result = await repo.findAtivosParaFiltro()

      expect(result).toEqual(times)
      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      expect(inCalls.find((c: unknown[]) => c[0] === 'id')).toBeUndefined()
    })

    it('aplica filtro .in quando timeIds é fornecido', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new TimeRepository(supabase as never)

      await repo.findAtivosParaFiltro(['t-1', 't-2'])

      expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('id', ['t-1', 't-2'])
    })

    it('NÃO aplica filtro .in quando timeIds é array vazio', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new TimeRepository(supabase as never)

      await repo.findAtivosParaFiltro([])

      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      expect(inCalls.find((c: unknown[]) => c[0] === 'id')).toBeUndefined()
    })

    it('aplica filtro ativo=true', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new TimeRepository(supabase as never)

      await repo.findAtivosParaFiltro()

      expect((builder.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('ativo', true)
    })
  })

  // -------------------------------------------------------------------------
  // countAtivos
  // -------------------------------------------------------------------------
  describe('countAtivos', () => {
    it('retorna count total sem filtro quando timeIds não fornecido', async () => {
      const supabase = makeSupabase({ count: 8 })
      const builder = supabase._builder
      const repo = new TimeRepository(supabase as never)

      const result = await repo.countAtivos()

      expect(result).toBe(8)
      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      expect(inCalls.find((c: unknown[]) => c[0] === 'id')).toBeUndefined()
    })

    it('aplica filtro por IDs quando timeIds fornecido', async () => {
      const supabase = makeSupabase({ count: 2 })
      const builder = supabase._builder
      const repo = new TimeRepository(supabase as never)

      const result = await repo.countAtivos(['t-A', 't-B'])

      expect(result).toBe(2)
      expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('id', ['t-A', 't-B'])
    })

    it('retorna 0 quando count é null', async () => {
      const supabase = makeSupabase({ count: null })
      const repo = new TimeRepository(supabase as never)

      expect(await repo.countAtivos()).toBe(0)
    })

    it('aplica filtro ativo=true', async () => {
      const supabase = makeSupabase({ count: 0 })
      const builder = supabase._builder
      const repo = new TimeRepository(supabase as never)

      await repo.countAtivos()

      expect((builder.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('ativo', true)
    })
  })
})

// ---------------------------------------------------------------------------
// BLOCO 3 — VagaTimeRepository
// ---------------------------------------------------------------------------

describe('VagaTimeRepository', () => {
  // -------------------------------------------------------------------------
  // sumQuantidadeAtivasEmTimes
  // -------------------------------------------------------------------------
  describe('sumQuantidadeAtivasEmTimes', () => {
    it('soma todas as vagas ativas quando timeIds não fornecido', async () => {
      const vagas = [{ quantidade: 3 }, { quantidade: 2 }]
      const supabase = makeSupabase({ data: vagas })
      const builder = supabase._builder
      const repo = new VagaTimeRepository(supabase as never)

      const result = await repo.sumQuantidadeAtivasEmTimes()

      expect(result).toBe(5)
      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      expect(inCalls.find((c: unknown[]) => c[0] === 'time_id')).toBeUndefined()
    })

    it('soma vagas apenas dos times fornecidos', async () => {
      const vagas = [{ quantidade: 4 }]
      const supabase = makeSupabase({ data: vagas })
      const builder = supabase._builder
      const repo = new VagaTimeRepository(supabase as never)

      const result = await repo.sumQuantidadeAtivasEmTimes(['time-1'])

      expect(result).toBe(4)
      expect((builder.in as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('time_id', ['time-1'])
    })

    it('NÃO aplica filtro .in quando timeIds é array vazio', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new VagaTimeRepository(supabase as never)

      await repo.sumQuantidadeAtivasEmTimes([])

      const inCalls = (builder.in as ReturnType<typeof vi.fn>).mock.calls
      expect(inCalls.find((c: unknown[]) => c[0] === 'time_id')).toBeUndefined()
    })

    it('retorna 0 quando não há vagas', async () => {
      const supabase = makeSupabase({ data: [] })
      const repo = new VagaTimeRepository(supabase as never)

      expect(await repo.sumQuantidadeAtivasEmTimes()).toBe(0)
    })

    it('aplica filtro ativo=true', async () => {
      const supabase = makeSupabase({ data: [] })
      const builder = supabase._builder
      const repo = new VagaTimeRepository(supabase as never)

      await repo.sumQuantidadeAtivasEmTimes()

      expect((builder.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('ativo', true)
    })

    it('lida com quantidade nula somando como zero', async () => {
      // quantidade pode ser 0 ou null em dados inconsistentes
      const vagas = [{ quantidade: 5 }, { quantidade: 0 }]
      const supabase = makeSupabase({ data: vagas })
      const repo = new VagaTimeRepository(supabase as never)

      const result = await repo.sumQuantidadeAtivasEmTimes()

      expect(result).toBe(5)
    })

    it('lança erro quando supabase retorna error', async () => {
      const supabase = makeSupabase({ error: { message: 'falha', code: '500' } })
      const repo = new VagaTimeRepository(supabase as never)

      await expect(repo.sumQuantidadeAtivasEmTimes()).rejects.toThrow()
    })
  })
})
