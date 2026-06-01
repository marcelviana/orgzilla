import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PermissaoService } from '@/lib/services/permissao.service'
import type { Usuario } from '@/lib/types'

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

const usuarioAdmin = makeUsuario({ tipo_perfil: 'admin', pessoa_id: 'pessoa-admin' })
const usuarioVisualizador = makeUsuario({ tipo_perfil: 'visualizador', pessoa_id: 'pessoa-vis' })
const usuarioGestor = makeUsuario({ tipo_perfil: 'gestor', pessoa_id: 'pessoa-gestor' })

// ---------------------------------------------------------------------------
// Mock da camada de dados (TimeRepository + PessoaRepository)
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
}

// Mock das classes de Repository que o Service instancia internamente
vi.mock('@/lib/repositories', () => {
  function TimeRepository() { return mockTimeRepo }
  function PessoaRepository() { return mockPessoaRepo }
  return { TimeRepository, PessoaRepository }
})

// O Supabase client nunca será invocado (tudo resolvido via mocks dos repos)
const fakeSupabase = {} as never

// ---------------------------------------------------------------------------
// Helper: instancia o service e reseta todos os mocks entre testes
// ---------------------------------------------------------------------------

function makeService() {
  return new PermissaoService(fakeSupabase)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ===========================================================================
// BLOCO 1 — PermissaoService
// ===========================================================================

describe('PermissaoService', () => {
  // -------------------------------------------------------------------------
  // podeVerSalario — regras por perfil
  // -------------------------------------------------------------------------
  describe('podeVerSalario', () => {
    it('admin NUNCA pode ver salário', async () => {
      const service = makeService()
      const resultado = await service.podeVerSalario(usuarioAdmin, 'pessoa-qualquer')
      expect(resultado).toBe(false)
    })

    it('visualizador NUNCA pode ver salário', async () => {
      const service = makeService()
      const resultado = await service.podeVerSalario(usuarioVisualizador, 'pessoa-qualquer')
      expect(resultado).toBe(false)
    })

    it('gestor pode ver salário de pessoa na sua hierarquia', async () => {
      // Hierarquia: gestor gerencia time-A, pessoa-alvo está em time-A
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([]) // sem subtimes
      mockPessoaRepo.findById.mockResolvedValue({ id: 'pessoa-alvo', time_id: 'time-A' })

      const service = makeService()
      const resultado = await service.podeVerSalario(usuarioGestor, 'pessoa-alvo')
      expect(resultado).toBe(true)
    })

    it('gestor NÃO pode ver salário de pessoa fora da sua hierarquia', async () => {
      // Gestor gerencia time-A; pessoa-alvo está em time-B (fora)
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])
      mockPessoaRepo.findById.mockResolvedValue({ id: 'pessoa-alvo', time_id: 'time-B' })

      const service = makeService()
      const resultado = await service.podeVerSalario(usuarioGestor, 'pessoa-alvo')
      expect(resultado).toBe(false)
    })

    it('gestor sem pessoa_id associada não pode ver salário', async () => {
      const gestorSemPessoa = makeUsuario({ tipo_perfil: 'gestor', pessoa_id: null })
      const service = makeService()
      const resultado = await service.podeVerSalario(gestorSemPessoa, 'pessoa-alvo')
      expect(resultado).toBe(false)
    })

    it('gestor que não gerencia nenhum time não pode ver salário', async () => {
      mockTimeRepo.findByGestorId.mockResolvedValue([]) // nenhum time gerenciado
      const service = makeService()
      const resultado = await service.podeVerSalario(usuarioGestor, 'pessoa-alvo')
      expect(resultado).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // podeEditarSalario — regras por perfil
  // -------------------------------------------------------------------------
  describe('podeEditarSalario', () => {
    it('admin NUNCA pode editar salário', async () => {
      const service = makeService()
      const resultado = await service.podeEditarSalario(usuarioAdmin, 'pessoa-qualquer')
      expect(resultado).toBe(false)
    })

    it('visualizador NUNCA pode editar salário', async () => {
      const service = makeService()
      const resultado = await service.podeEditarSalario(usuarioVisualizador, 'pessoa-qualquer')
      expect(resultado).toBe(false)
    })

    it('gestor pode editar salário de pessoa na sua hierarquia', async () => {
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])
      mockPessoaRepo.findById.mockResolvedValue({ id: 'pessoa-alvo', time_id: 'time-A' })

      const service = makeService()
      const resultado = await service.podeEditarSalario(usuarioGestor, 'pessoa-alvo')
      expect(resultado).toBe(true)
    })

    it('gestor NÃO pode editar salário de pessoa fora da sua hierarquia', async () => {
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])
      mockPessoaRepo.findById.mockResolvedValue({ id: 'pessoa-alvo', time_id: 'time-B' })

      const service = makeService()
      const resultado = await service.podeEditarSalario(usuarioGestor, 'pessoa-alvo')
      expect(resultado).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // pertenceHierarquia — verificação por tipo de entidade
  // -------------------------------------------------------------------------
  describe('pertenceHierarquia', () => {
    it('retorna false para não-gestor (admin)', async () => {
      const service = makeService()
      const resultado = await service.pertenceHierarquia(usuarioAdmin, 'time', 'time-X')
      expect(resultado).toBe(false)
    })

    it('retorna false para não-gestor (visualizador)', async () => {
      const service = makeService()
      const resultado = await service.pertenceHierarquia(usuarioVisualizador, 'time', 'time-X')
      expect(resultado).toBe(false)
    })

    it('gestor pertence a hierarquia que inclui subtimes', async () => {
      // Hierarquia: time-raiz → time-filho → time-neto (onde está a pessoa)
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-raiz' }])
      mockTimeRepo.findByTimePaiId
        .mockResolvedValueOnce([{ id: 'time-filho' }])  // filhos de time-raiz
        .mockResolvedValueOnce([{ id: 'time-neto' }])   // filhos de time-filho
        .mockResolvedValueOnce([])                       // filhos de time-neto

      const service = makeService()
      const resultado = await service.pertenceHierarquia(usuarioGestor, 'time', 'time-neto')
      expect(resultado).toBe(true)
    })

    it('gestor não pertence a time fora da hierarquia', async () => {
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-raiz' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([]) // sem subtimes

      const service = makeService()
      const resultado = await service.pertenceHierarquia(usuarioGestor, 'time', 'time-outro')
      expect(resultado).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // getTimesHierarquia — retorno de IDs
  // -------------------------------------------------------------------------
  describe('getTimesHierarquia', () => {
    it('retorna lista vazia para não-gestor', async () => {
      const service = makeService()
      const ids = await service.getTimesHierarquia(usuarioAdmin)
      expect(ids).toEqual([])
    })

    it('retorna lista vazia para gestor sem pessoa_id', async () => {
      const gestorSemPessoa = makeUsuario({ tipo_perfil: 'gestor', pessoa_id: null })
      const service = makeService()
      const ids = await service.getTimesHierarquia(gestorSemPessoa)
      expect(ids).toEqual([])
    })

    it('retorna hierarquia completa incluindo subtimes', async () => {
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId
        .mockResolvedValueOnce([{ id: 'time-B' }]) // filhos de A
        .mockResolvedValueOnce([])                  // filhos de B

      const service = makeService()
      const ids = await service.getTimesHierarquia(usuarioGestor)
      expect(ids).toContain('time-A')
      expect(ids).toContain('time-B')
      expect(ids.length).toBe(2)
    })
  })

  // -------------------------------------------------------------------------
  // podeCriar / podeGerenciarUsuarios / podeExportar
  // -------------------------------------------------------------------------
  describe('permissões gerais por perfil', () => {
    it('visualizador não pode criar entidades', () => {
      const service = makeService()
      expect(service.podeCriar(usuarioVisualizador, 'pessoa')).toBe(false)
    })

    it('admin pode criar entidades', () => {
      const service = makeService()
      expect(service.podeCriar(usuarioAdmin, 'pessoa')).toBe(true)
    })

    it('gestor pode criar entidades', () => {
      const service = makeService()
      expect(service.podeCriar(usuarioGestor, 'pessoa')).toBe(true)
    })

    it('apenas admin pode gerenciar usuários', () => {
      const service = makeService()
      expect(service.podeGerenciarUsuarios(usuarioAdmin)).toBe(true)
      expect(service.podeGerenciarUsuarios(usuarioGestor)).toBe(false)
      expect(service.podeGerenciarUsuarios(usuarioVisualizador)).toBe(false)
    })

    it('apenas admin pode gerenciar configurações', () => {
      const service = makeService()
      expect(service.podeGerenciarConfiguracoes(usuarioAdmin)).toBe(true)
      expect(service.podeGerenciarConfiguracoes(usuarioGestor)).toBe(false)
      expect(service.podeGerenciarConfiguracoes(usuarioVisualizador)).toBe(false)
    })
  })
})
