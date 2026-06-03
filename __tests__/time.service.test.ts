import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PermissaoService } from '@/lib/services/permissao.service'
import type { Usuario } from '@/lib/types'

// ---------------------------------------------------------------------------
// Mocks de repositórios compartilhados pelos dois Services
// ---------------------------------------------------------------------------

const mockTimeRepo = {
  findByGestorId: vi.fn(),
  findByTimePaiId: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  findWithFilters: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
}

const mockPessoaRepo = {
  findById: vi.fn(),
  findByTimeId: vi.fn(),
  findByTimeIds: vi.fn(),
  findByCargoIdWithTime: vi.fn(),
}

vi.mock('@/lib/repositories', () => {
  function TimeRepository() { return mockTimeRepo }
  function PessoaRepository() { return mockPessoaRepo }
  return { TimeRepository, PessoaRepository }
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

const fakeSupabase = {} as never

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Importação lazy para garantir que os mocks já estão registrados
// ---------------------------------------------------------------------------
async function getTimeService() {
  const { TimeService } = await import('@/lib/services/time.service')
  return new TimeService(fakeSupabase)
}

// ---------------------------------------------------------------------------
// Fixtures de Usuário
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

const usuarioAdmin = makeUsuario({ tipo_perfil: 'admin', pessoa_id: 'pessoa-admin' })
const usuarioGestor = makeUsuario({ tipo_perfil: 'gestor', pessoa_id: 'pessoa-gestor' })

// ===========================================================================
// BLOCO 2 — TimeService: hierarquia e ciclos
// ===========================================================================

describe('TimeService', () => {
  // -------------------------------------------------------------------------
  // validarCiclos
  // -------------------------------------------------------------------------
  describe('validarCiclos', () => {
    it('retorna false (sem ciclo) ao criar novo time (timeFilhoId = null)', async () => {
      const service = await getTimeService()
      const temCiclo = await service.validarCiclos('time-pai', null)
      expect(temCiclo).toBe(false)
    })

    it('detecta ciclo direto: time sendo pai de si mesmo', async () => {
      // time-A ← time-A: ciclo direto
      mockTimeRepo.findById.mockResolvedValue({ id: 'time-A', time_pai_id: null })

      const service = await getTimeService()
      const temCiclo = await service.validarCiclos('time-A', 'time-A')
      expect(temCiclo).toBe(true)
    })

    it('detecta ciclo indireto: A → B → C → A', async () => {
      // Cenário: queremos atualizar time-A para ter time-C como pai,
      // mas time-C já tem time-A como ancestral (A é pai de B que é pai de C)
      // ancestrais de time-C: time-B → time-A
      mockTimeRepo.findById
        .mockImplementation((id: string) => {
          const tree: Record<string, { id: string; time_pai_id: string | null }> = {
            'time-C': { id: 'time-C', time_pai_id: 'time-B' },
            'time-B': { id: 'time-B', time_pai_id: 'time-A' },
            'time-A': { id: 'time-A', time_pai_id: null },
          }
          return tree[id] ?? null
        })

      const service = await getTimeService()
      // Tentativa: time-C como pai de time-A → ciclo
      const temCiclo = await service.validarCiclos('time-C', 'time-A')
      expect(temCiclo).toBe(true)
    })

    it('não detecta ciclo quando a hierarquia é linear e sem volta', async () => {
      // time-A → time-B (time-A é pai de time-B); agora queremos time-C como pai de time-B
      // ancestrais de time-C: nenhum (time-C é raiz)
      mockTimeRepo.findById
        .mockImplementation((id: string) => {
          if (id === 'time-C') return { id: 'time-C', time_pai_id: null }
          return null
        })

      const service = await getTimeService()
      const temCiclo = await service.validarCiclos('time-C', 'time-B')
      expect(temCiclo).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // getHierarquiaCompleta (via PermissaoService) — proteção contra ciclos
  // -------------------------------------------------------------------------
  describe('PermissaoService.getHierarquiaCompleta — proteção contra ciclos', () => {
    it('não entra em loop infinito em ciclo direto de time_pai_id', async () => {
      // time-A e time-B apontam um para o outro
      mockTimeRepo.findByTimePaiId
        .mockImplementation((id: string) => {
          if (id === 'time-A') return [{ id: 'time-B' }]
          if (id === 'time-B') return [{ id: 'time-A' }]
          return []
        })

      const permissaoService = new PermissaoService(fakeSupabase)
      const ids = await permissaoService.getHierarquiaCompleta('time-A')
      // Deve ter exatamente os dois IDs sem repetição e sem travar
      expect(ids).toContain('time-A')
      expect(ids).toContain('time-B')
      expect(ids.length).toBe(2)
    })

    it('não entra em loop em ciclo indireto: A → B → C → A', async () => {
      mockTimeRepo.findByTimePaiId
        .mockImplementation((id: string) => {
          if (id === 'time-A') return [{ id: 'time-B' }]
          if (id === 'time-B') return [{ id: 'time-C' }]
          if (id === 'time-C') return [{ id: 'time-A' }] // fecha o ciclo
          return []
        })

      const permissaoService = new PermissaoService(fakeSupabase)
      const ids = await permissaoService.getHierarquiaCompleta('time-A')
      expect(ids.length).toBe(3)
      expect(new Set(ids).size).toBe(3) // sem duplicatas
    })

    it('retorna todos os nós de hierarquia profunda sem ciclo', async () => {
      // A → B → C → D (linearmente)
      mockTimeRepo.findByTimePaiId
        .mockImplementation((id: string) => {
          const children: Record<string, { id: string }[]> = {
            'time-A': [{ id: 'time-B' }],
            'time-B': [{ id: 'time-C' }],
            'time-C': [{ id: 'time-D' }],
            'time-D': [],
          }
          return children[id] ?? []
        })

      const permissaoService = new PermissaoService(fakeSupabase)
      const ids = await permissaoService.getHierarquiaCompleta('time-A')
      expect(ids).toContain('time-A')
      expect(ids).toContain('time-D')
      expect(ids.length).toBe(4)
    })
  })

  // -------------------------------------------------------------------------
  // buscarDescendentes — exclui o próprio time raiz
  // -------------------------------------------------------------------------
  describe('buscarDescendentes', () => {
    it('retorna descendentes sem incluir o time raiz', async () => {
      mockTimeRepo.findByTimePaiId
        .mockImplementation((id: string) => {
          if (id === 'time-raiz') return [{ id: 'time-filho' }]
          return []
        })

      const service = await getTimeService()
      const descendentes = await service.buscarDescendentes('time-raiz')
      expect(descendentes).not.toContain('time-raiz')
      expect(descendentes).toContain('time-filho')
    })

    it('retorna lista vazia para time sem filhos', async () => {
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])

      const service = await getTimeService()
      const descendentes = await service.buscarDescendentes('time-folha')
      expect(descendentes).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // buscarComPermissao — respeita perfil do usuário
  // -------------------------------------------------------------------------
  describe('buscarComPermissao', () => {
    it('admin vê todos os times', async () => {
      mockTimeRepo.findWithFilters.mockResolvedValue([{ id: 'time-1' }, { id: 'time-2' }])

      const service = await getTimeService()
      const times = await service.buscarComPermissao(usuarioAdmin)
      expect(times.length).toBe(2)
      expect(mockTimeRepo.findWithFilters).toHaveBeenCalled()
    })

    it('gestor vê apenas times da sua hierarquia', async () => {
      // Gestor gerencia time-A; time-B está fora
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])
      mockTimeRepo.findAll.mockResolvedValue([{ id: 'time-A' }, { id: 'time-B' }])

      const service = await getTimeService()
      const times = await service.buscarComPermissao(usuarioGestor)
      expect(times.map((t: { id: string }) => t.id)).toEqual(['time-A'])
    })
  })
})
