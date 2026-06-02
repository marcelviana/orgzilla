/**
 * BLOCO 4 — PessoaService.enriquecerListaComRemuneracao
 *
 * Garante que:
 * 1. Admin e visualizador nunca recebem dados de remuneração na lista
 * 2. Gestor com hierarquiaIds vazio retorna lista sem modificação
 * 3. Lista vazia retorna sem chamar o repositório
 * 4. Gestor recebe remuneração apenas para pessoas cujo time está em hierarquiaIds
 * 5. Pessoas sem remuneração no banco retornam sem o campo
 * 6. Pessoas fora da hierarquia não recebem remuneração mesmo sendo gestor
 * 7. Múltiplas pessoas com mix de hierarquia/fora enriquecem apenas as elegíveis
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Usuario, PessoaRemuneracao } from '@/lib/types'

// ---------------------------------------------------------------------------
// Mocks de repositórios e services dependentes
// ---------------------------------------------------------------------------

const mockTimeRepo = {
  findByGestorId: vi.fn(),
  findByTimePaiId: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  findWithFilters: vi.fn(),
}

const mockPessoaRepo = {
  findById: vi.fn(),
  findByTimeId: vi.fn(),
  findByTimeIds: vi.fn(),
  findByCargoIdWithTime: vi.fn(),
  findByTrilhaId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

const mockRemuneracaoRepo = {
  findByPessoaId: vi.fn(),
  findByPessoaIds: vi.fn(),
  findComCargoETimes: vi.fn(),
  upsert: vi.fn(),
}

vi.mock('@/lib/repositories', () => {
  function TimeRepository() { return mockTimeRepo }
  function PessoaRepository() { return mockPessoaRepo }
  function PessoaRemuneracaoRepository() { return mockRemuneracaoRepo }
  return { TimeRepository, PessoaRepository, PessoaRemuneracaoRepository }
})

vi.mock('@/lib/services/auditoria.service', () => {
  function AuditoriaService() {
    return {
      registrarCriacao: vi.fn().mockResolvedValue(undefined),
      registrarEdicao: vi.fn().mockResolvedValue(undefined),
      registrarMudancas: vi.fn().mockResolvedValue(undefined),
    }
  }
  return { AuditoriaService }
})

vi.mock('@/lib/services/historico.service', () => {
  function HistoricoService() {
    return {
      criarHistoricoCargo: vi.fn().mockResolvedValue(undefined),
      criarHistoricoTime: vi.fn().mockResolvedValue(undefined),
      processarMudancaSalario: vi.fn().mockResolvedValue(undefined),
      processarMudancaCargo: vi.fn().mockResolvedValue(undefined),
      processarMudancaTime: vi.fn().mockResolvedValue(undefined),
      finalizarHistoricoCargoAtual: vi.fn().mockResolvedValue(undefined),
      finalizarHistoricoTimeAtual: vi.fn().mockResolvedValue(undefined),
    }
  }
  return { HistoricoService }
})

const fakeSupabase = {} as never

beforeEach(() => {
  vi.clearAllMocks()
})

async function getPessoaService() {
  const { PessoaService } = await import('@/lib/services/pessoa.service')
  return new PessoaService(fakeSupabase)
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 'user-001',
    email: 'teste@orgzilla.com',
    nome: 'Usuário Teste',
    tipo_perfil: 'gestor',
    ativo: true,
    pessoa_id: 'pessoa-001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const usuarioAdmin = makeUsuario({ tipo_perfil: 'admin' })
const usuarioVisualizador = makeUsuario({ tipo_perfil: 'visualizador' })
const usuarioGestor = makeUsuario({ tipo_perfil: 'gestor' })

function makePessoa(id: string, timeId: string | null = 'time-A') {
  return {
    id,
    nome: `Pessoa ${id}`,
    time: timeId ? { id: timeId } : null,
    remuneracao: null,
  }
}

// ===========================================================================
// BLOCO 4 — enriquecerListaComRemuneracao
// ===========================================================================

describe('PessoaService — enriquecerListaComRemuneracao (LGPD)', () => {
  // -------------------------------------------------------------------------
  // Bloqueio por perfil
  // -------------------------------------------------------------------------
  describe('bloqueio por perfil (defesa em profundidade)', () => {
    it('admin recebe lista original sem modificação e sem chamar o repositório', async () => {
      const service = await getPessoaService()
      const pessoas = [makePessoa('p-1'), makePessoa('p-2')]
      const hierarquiaIds = ['time-A']

      const resultado = await service.enriquecerListaComRemuneracao(pessoas, hierarquiaIds, usuarioAdmin)

      expect(resultado).toStrictEqual(pessoas)
      expect(mockRemuneracaoRepo.findByPessoaIds).not.toHaveBeenCalled()
    })

    it('visualizador recebe lista original sem modificação e sem chamar o repositório', async () => {
      const service = await getPessoaService()
      const pessoas = [makePessoa('p-1')]
      const hierarquiaIds = ['time-A']

      const resultado = await service.enriquecerListaComRemuneracao(pessoas, hierarquiaIds, usuarioVisualizador)

      expect(resultado).toStrictEqual(pessoas)
      expect(mockRemuneracaoRepo.findByPessoaIds).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Casos de lista/hierarquia vazia
  // -------------------------------------------------------------------------
  describe('casos de borda com listas vazias', () => {
    it('lista de pessoas vazia retorna imediatamente sem chamar o repositório', async () => {
      const service = await getPessoaService()

      const resultado = await service.enriquecerListaComRemuneracao([], ['time-A'], usuarioGestor)

      expect(resultado).toStrictEqual([])
      expect(mockRemuneracaoRepo.findByPessoaIds).not.toHaveBeenCalled()
    })

    it('hierarquiaIds vazio retorna lista original sem chamar o repositório', async () => {
      const service = await getPessoaService()
      const pessoas = [makePessoa('p-1')]

      const resultado = await service.enriquecerListaComRemuneracao(pessoas, [], usuarioGestor)

      expect(resultado).toStrictEqual(pessoas)
      expect(mockRemuneracaoRepo.findByPessoaIds).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Gestor com hierarquia válida
  // -------------------------------------------------------------------------
  describe('gestor dentro da hierarquia', () => {
    it('enriquece pessoa com remuneração quando time está na hierarquia', async () => {
      const service = await getPessoaService()
      const pessoas = [makePessoa('p-1', 'time-A')]
      mockRemuneracaoRepo.findByPessoaIds.mockResolvedValue([
        { pessoa_id: 'p-1', salario_atual: 8000, data_ultimo_reajuste: '2024-01-01', motivo_ultimo_reajuste: null },
      ])

      const resultado = await service.enriquecerListaComRemuneracao(pessoas, ['time-A'], usuarioGestor)

      expect(resultado).toHaveLength(1)
      expect(resultado[0].remuneracao).toEqual({
        salario_atual: 8000,
        data_ultimo_reajuste: '2024-01-01',
      })
      expect(mockRemuneracaoRepo.findByPessoaIds).toHaveBeenCalledWith(['p-1'])
    })

    it('pessoa sem remuneração no banco retorna sem o campo preenchido', async () => {
      const service = await getPessoaService()
      const pessoas = [makePessoa('p-1', 'time-A')]
      mockRemuneracaoRepo.findByPessoaIds.mockResolvedValue([])

      const resultado = await service.enriquecerListaComRemuneracao(pessoas, ['time-A'], usuarioGestor)

      expect(resultado).toHaveLength(1)
      // Campo remuneracao permanece null (valor original do fixture)
      expect(resultado[0].remuneracao).toBeNull()
    })

    it('pessoa fora da hierarquia não recebe remuneração mesmo sendo gestor', async () => {
      const service = await getPessoaService()
      const pessoaFora = makePessoa('p-fora', 'time-B')
      mockRemuneracaoRepo.findByPessoaIds.mockResolvedValue([])

      const resultado = await service.enriquecerListaComRemuneracao([pessoaFora], ['time-A'], usuarioGestor)

      // time-B não está em hierarquiaIds (['time-A']), portanto nenhuma pessoa é elegível
      expect(resultado).toHaveLength(1)
      expect(resultado[0].remuneracao).toBeNull()
      // findByPessoaIds não deve ser chamado pois idsComSalario ficará vazio
      expect(mockRemuneracaoRepo.findByPessoaIds).not.toHaveBeenCalled()
    })

    it('pessoa sem time atribuído não recebe remuneração', async () => {
      const service = await getPessoaService()
      const pessoaSemTime = makePessoa('p-sem-time', null)

      const resultado = await service.enriquecerListaComRemuneracao([pessoaSemTime], ['time-A'], usuarioGestor)

      expect(resultado[0].remuneracao).toBeNull()
      expect(mockRemuneracaoRepo.findByPessoaIds).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Mix: lista com pessoas dentro e fora da hierarquia
  // -------------------------------------------------------------------------
  describe('lista mista (dentro e fora da hierarquia)', () => {
    it('enriquece apenas as pessoas cujo time está na hierarquia', async () => {
      const service = await getPessoaService()
      const pessoaDentro = makePessoa('p-dentro', 'time-A')
      const pessoaFora = makePessoa('p-fora', 'time-B')
      const pessoas = [pessoaDentro, pessoaFora]

      mockRemuneracaoRepo.findByPessoaIds.mockResolvedValue([
        { pessoa_id: 'p-dentro', salario_atual: 10000, data_ultimo_reajuste: '2024-06-01', motivo_ultimo_reajuste: null },
      ])

      const resultado = await service.enriquecerListaComRemuneracao(pessoas, ['time-A'], usuarioGestor)

      expect(resultado).toHaveLength(2)

      const dentro = resultado.find((p) => p.id === 'p-dentro')
      const fora = resultado.find((p) => p.id === 'p-fora')

      expect(dentro?.remuneracao).toEqual({ salario_atual: 10000, data_ultimo_reajuste: '2024-06-01' })
      // pessoa fora da hierarquia não deve ter remuneração injetada
      expect(fora?.remuneracao).toBeNull()

      // Repositório deve ser chamado apenas com o ID elegível
      expect(mockRemuneracaoRepo.findByPessoaIds).toHaveBeenCalledWith(['p-dentro'])
    })

    it('retorna campos extras do objeto original intactos após enriquecimento', async () => {
      const service = await getPessoaService()
      type PessoaComExtras = Omit<ReturnType<typeof makePessoa>, 'remuneracao'> & {
        cargo: { nome: string }
        status: string
        remuneracao: Pick<PessoaRemuneracao, 'salario_atual' | 'data_ultimo_reajuste' | 'motivo_ultimo_reajuste'> | null
      }
      const pessoaComExtras: PessoaComExtras = {
        ...makePessoa('p-1', 'time-A'),
        cargo: { nome: 'Engenheiro' },
        status: 'ativo',
      }
      mockRemuneracaoRepo.findByPessoaIds.mockResolvedValue([
        { pessoa_id: 'p-1', salario_atual: 12000, data_ultimo_reajuste: '2023-12-01', motivo_ultimo_reajuste: null },
      ])

      const [resultado] = await service.enriquecerListaComRemuneracao([pessoaComExtras], ['time-A'], usuarioGestor)

      expect(resultado.cargo).toEqual({ nome: 'Engenheiro' })
      expect(resultado.status).toBe('ativo')
      expect(resultado.remuneracao?.salario_atual).toBe(12000)
    })

    it('salario_atual null é preservado quando banco retorna null', async () => {
      const service = await getPessoaService()
      const pessoas = [makePessoa('p-1', 'time-A')]
      mockRemuneracaoRepo.findByPessoaIds.mockResolvedValue([
        { pessoa_id: 'p-1', salario_atual: null, data_ultimo_reajuste: null, motivo_ultimo_reajuste: null },
      ])

      const [resultado] = await service.enriquecerListaComRemuneracao(pessoas, ['time-A'], usuarioGestor)

      expect(resultado.remuneracao).toEqual({ salario_atual: null, data_ultimo_reajuste: null })
    })
  })
})
