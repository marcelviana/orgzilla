/**
 * BLOCO 3 — Separação de remuneração
 *
 * Garante que:
 * 1. Admin e visualizador NUNCA recebem dados de salário via PessoaService.buscarRemuneracao
 * 2. Gestor FORA da hierarquia também não recebe
 * 3. Gestor DENTRO da hierarquia recebe normalmente
 * 4. PessoaService.salvarRemuneracao bloqueia admin, visualizador e gestor fora da hierarquia
 * 5. A busca de remuneração passa OBRIGATORIAMENTE pelo PermissaoService (não acesso direto ao repo)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Usuario } from '@/lib/types'

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

const usuarioAdmin = makeUsuario({ tipo_perfil: 'admin', pessoa_id: 'pessoa-admin' })
const usuarioVisualizador = makeUsuario({ tipo_perfil: 'visualizador', pessoa_id: 'pessoa-vis' })
const usuarioGestor = makeUsuario({ tipo_perfil: 'gestor', pessoa_id: 'pessoa-gestor' })

const remuneracaoFixture = {
  pessoa_id: 'pessoa-alvo',
  salario_atual: 12000,
  data_ultimo_reajuste: '2024-06-01',
  motivo_ultimo_reajuste: 'promoção',
}

// ===========================================================================
// BLOCO 3 — Separação de remuneração
// ===========================================================================

describe('PessoaService — separação de remuneração (LGPD)', () => {
  // -------------------------------------------------------------------------
  // buscarRemuneracao
  // -------------------------------------------------------------------------
  describe('buscarRemuneracao', () => {
    it('admin recebe null (nunca vê salário)', async () => {
      const service = await getPessoaService()
      const resultado = await service.buscarRemuneracao(usuarioAdmin, 'pessoa-alvo')
      expect(resultado).toBeNull()
      // Garante que o repo nunca foi consultado
      expect(mockRemuneracaoRepo.findByPessoaId).not.toHaveBeenCalled()
    })

    it('visualizador recebe null (nunca vê salário)', async () => {
      const service = await getPessoaService()
      const resultado = await service.buscarRemuneracao(usuarioVisualizador, 'pessoa-alvo')
      expect(resultado).toBeNull()
      expect(mockRemuneracaoRepo.findByPessoaId).not.toHaveBeenCalled()
    })

    it('gestor fora da hierarquia recebe null', async () => {
      // Gestor gerencia time-A; pessoa-alvo está em time-B
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])
      mockPessoaRepo.findById.mockResolvedValue({ id: 'pessoa-alvo', time_id: 'time-B' })

      const service = await getPessoaService()
      const resultado = await service.buscarRemuneracao(usuarioGestor, 'pessoa-alvo')
      expect(resultado).toBeNull()
      expect(mockRemuneracaoRepo.findByPessoaId).not.toHaveBeenCalled()
    })

    it('gestor dentro da hierarquia recebe a remuneração', async () => {
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])
      mockPessoaRepo.findById.mockResolvedValue({ id: 'pessoa-alvo', time_id: 'time-A' })
      mockRemuneracaoRepo.findByPessoaId.mockResolvedValue(remuneracaoFixture)

      const service = await getPessoaService()
      const resultado = await service.buscarRemuneracao(usuarioGestor, 'pessoa-alvo')
      expect(resultado).toEqual(remuneracaoFixture)
      expect(mockRemuneracaoRepo.findByPessoaId).toHaveBeenCalledWith('pessoa-alvo')
    })

    it('gestor dentro da hierarquia sem remuneração cadastrada recebe null', async () => {
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])
      mockPessoaRepo.findById.mockResolvedValue({ id: 'pessoa-alvo', time_id: 'time-A' })
      mockRemuneracaoRepo.findByPessoaId.mockResolvedValue(null)

      const service = await getPessoaService()
      const resultado = await service.buscarRemuneracao(usuarioGestor, 'pessoa-alvo')
      expect(resultado).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // salvarRemuneracao — bloqueios por perfil
  // -------------------------------------------------------------------------
  describe('salvarRemuneracao', () => {
    it('admin não pode salvar remuneração', async () => {
      const service = await getPessoaService()
      const resultado = await service.salvarRemuneracao(usuarioAdmin, 'pessoa-alvo', {
        salario_atual: 15000,
      })
      expect(resultado.success).toBe(false)
      expect(resultado.error).toBeTruthy()
      expect(mockRemuneracaoRepo.upsert).not.toHaveBeenCalled()
    })

    it('visualizador não pode salvar remuneração', async () => {
      const service = await getPessoaService()
      const resultado = await service.salvarRemuneracao(usuarioVisualizador, 'pessoa-alvo', {
        salario_atual: 15000,
      })
      expect(resultado.success).toBe(false)
      expect(mockRemuneracaoRepo.upsert).not.toHaveBeenCalled()
    })

    it('gestor fora da hierarquia não pode salvar remuneração', async () => {
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])
      mockPessoaRepo.findById.mockResolvedValue({ id: 'pessoa-alvo', time_id: 'time-B' })

      const service = await getPessoaService()
      const resultado = await service.salvarRemuneracao(usuarioGestor, 'pessoa-alvo', {
        salario_atual: 15000,
      })
      expect(resultado.success).toBe(false)
      expect(mockRemuneracaoRepo.upsert).not.toHaveBeenCalled()
    })

    it('gestor dentro da hierarquia pode salvar remuneração', async () => {
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])
      mockPessoaRepo.findById.mockResolvedValue({ id: 'pessoa-alvo', time_id: 'time-A' })
      mockRemuneracaoRepo.findByPessoaId.mockResolvedValue(null)
      mockRemuneracaoRepo.upsert.mockResolvedValue({
        pessoa_id: 'pessoa-alvo',
        salario_atual: 15000,
        data_ultimo_reajuste: null,
        motivo_ultimo_reajuste: null,
      })

      const service = await getPessoaService()
      const resultado = await service.salvarRemuneracao(usuarioGestor, 'pessoa-alvo', {
        salario_atual: 15000,
      })
      expect(resultado.success).toBe(true)
      expect(mockRemuneracaoRepo.upsert).toHaveBeenCalledOnce()
    })

    it('salário negativo é rejeitado mesmo para gestor da hierarquia', async () => {
      mockTimeRepo.findByGestorId.mockResolvedValue([{ id: 'time-A' }])
      mockTimeRepo.findByTimePaiId.mockResolvedValue([])
      mockPessoaRepo.findById.mockResolvedValue({ id: 'pessoa-alvo', time_id: 'time-A' })

      const service = await getPessoaService()
      const resultado = await service.salvarRemuneracao(usuarioGestor, 'pessoa-alvo', {
        salario_atual: -500,
      })
      expect(resultado.success).toBe(false)
      expect(mockRemuneracaoRepo.upsert).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Verificação estática: nenhuma Action lê pessoa_remuneracao diretamente
  // -------------------------------------------------------------------------
  describe('verificação de acesso direto proibido', () => {
    it('não há referência a supabase.from("pessoa_remuneracao") fora de lib/repositories', async () => {
      /**
       * Este teste garante a invariante arquitetural: a tabela pessoa_remuneracao
       * só pode ser acessada via PessoaRemuneracaoRepository, nunca via
       * supabase.from() direto em Actions ou componentes.
       *
       * Faz busca textual nos arquivos de app/actions e app/ (fora de lib/).
       */
      const { execSync } = await import('child_process')
      const projectRoot = '/Users/marcelviana/projects/orgzilla'

      // Grep: procura por pessoa_remuneracao fora de lib/ e __tests__/
      let output = ''
      try {
        output = execSync(
          `grep -r "pessoa_remuneracao" "${projectRoot}/app" "${projectRoot}/components" 2>/dev/null || true`,
          { encoding: 'utf-8', cwd: projectRoot }
        )
      } catch {
        output = ''
      }

      // Filtra linhas que realmente fazem query direta (não apenas comentários ou importações)
      const linhasProibidas = output
        .split('\n')
        .filter((linha) => linha.includes('from(') && linha.includes('pessoa_remuneracao'))

      expect(
        linhasProibidas,
        `Acesso direto à tabela pessoa_remuneracao encontrado fora de lib/:\n${linhasProibidas.join('\n')}`
      ).toHaveLength(0)
    })

    it('não há referência a salario_atual fora de lib/', async () => {
      const { execSync } = await import('child_process')
      const projectRoot = '/Users/marcelviana/projects/orgzilla'

      let output = ''
      try {
        output = execSync(
          `grep -r "salario_atual" "${projectRoot}/app" "${projectRoot}/components" 2>/dev/null || true`,
          { encoding: 'utf-8', cwd: projectRoot }
        )
      } catch {
        output = ''
      }

      // Permite referências em UI (exibição do campo), mas proíbe queries .select('salario_atual')
      const linhasProibidas = output
        .split('\n')
        .filter((linha) => linha.includes('select') && linha.includes('salario_atual'))

      expect(
        linhasProibidas,
        `Query direta de salario_atual encontrada fora de lib/:\n${linhasProibidas.join('\n')}`
      ).toHaveLength(0)
    })
  })
})
