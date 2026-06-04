'use client'

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Grid3x3, List, TrendingUp, Briefcase, Users, MoreVertical, BarChart3, X, Trash2, Copy, Eye, Edit, XCircle, ArrowRight, Loader2 } from 'lucide-react'
import { TableSkeleton, PageHeader, StatusBadge, EmptyState, SearchInput } from '@/components/shared'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/lib/ui/toast-config'
import { handleError, validateRequired } from '@/lib/errors/error-handler'
import {
  getTrilhasComEstatisticas,
  getCargosNaTrilha,
  getPessoasNaTrilha,
  createTrilha,
  updateTrilha,
  softDeleteTrilha,
} from '@/app/actions/trilhas.actions'
import type { CargoNaTrilha, PessoaNaTrilha } from '@/app/actions/trilhas.actions'
import { getCurrentUser, checkIsAdmin } from '@/app/actions/auth.actions'

interface CareerTrack {
  id: string
  nome: string
  descricao: string
  cargos: number
  pessoas: number
  niveisUsados: { min: string; max: string }
  nivelMedio: string
  ativo: boolean
  cargosPrincipais: string[]
  cor: string
}


export default function CareerTracksPage() {
  // Data state
  const [tracks, setTracks] = useState<CareerTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [, setCurrentUser] = useState<string | null>(null)

  // UI state
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [positionsModalOpen, setPositionsModalOpen] = useState(false)
  const [peopleModalOpen, setPeopleModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const [selectedTrack, setSelectedTrack] = useState<CareerTrack | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#FF7A00',
    ativo: true,
  })

  // Modal data state
  const [cargosModal, setCargosModal] = useState<CargoNaTrilha[]>([])
  const [pessoasModal, setPessoasModal] = useState<PessoaNaTrilha[]>([])
  const [loadingModal, setLoadingModal] = useState(false)

  // Mutation state
  const [, setIsSubmitting] = useState(false)

  // Load data and check permissions on mount
  useEffect(() => {
    void loadTrilhas()
    void checkPermissions()
  }, [])

  async function checkPermissions() {
    try {
      const user = await getCurrentUser()
      if (user) {
        setCurrentUser(user.nome)
        const adminStatus = await checkIsAdmin()
        setIsAdmin(adminStatus)

        if (!adminStatus) {
          const error = {
            type: 'permission' as const,
            message: 'Ops! Você não tem permissão para gerenciar trilhas de carreira.',
          }
          toast.error(error)
        }
      }
    } catch (error) {
      console.error('[Trilhas] Erro ao verificar permissões:', error)
    }
  }

  async function loadCargos(trilhaId: string) {
    try {
      setLoadingModal(true)
      const result = await getCargosNaTrilha(trilhaId)
      if (result.success && result.data) {
        setCargosModal(result.data)
      } else {
        toast.error(result.error || 'Erro ao carregar cargos')
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    } finally {
      setLoadingModal(false)
    }
  }

  async function loadPessoas(trilhaId: string) {
    try {
      setLoadingModal(true)
      const result = await getPessoasNaTrilha(trilhaId)
      if (result.success && result.data) {
        setPessoasModal(result.data)
      } else {
        toast.error(result.error || 'Erro ao carregar pessoas')
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    } finally {
      setLoadingModal(false)
    }
  }

  async function loadTrilhas() {
    try {
      setLoading(true)
      const result = await getTrilhasComEstatisticas()

      if (result.success && result.data) {
        // Converter TrilhaComEstatisticas para CareerTrack (formato da UI)
        const tracksFormatted: CareerTrack[] = result.data.map(trilha => ({
          id: trilha.id,
          nome: trilha.nome,
          descricao: trilha.descricao || '',
          cargos: trilha.cargos,
          pessoas: trilha.pessoas,
          niveisUsados: { min: 'L1', max: 'L8' }, // TODO: calcular dinamicamente
          nivelMedio: 'L4', // TODO: calcular dinamicamente
          ativo: trilha.ativo,
          cargosPrincipais: trilha.cargosLista.slice(0, 5),
          cor: '#FF7A00', // TODO: adicionar campo cor na tabela
        }))

        setTracks(tracksFormatted)
      } else {
        toast.error(result.error || 'Erro ao carregar trilhas')
      }
    } catch (error) {
      console.error('[Trilhas] Erro ao carregar:', error)
      const appError = handleError(error, 'database')
      toast.error(appError)
    } finally {
      setLoading(false)
    }
  }

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch = track.nome
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    
    if (activeFilters.length === 0) return matchesSearch

    const matchesFilters = activeFilters.every((filter) => {
      if (filter === 'Com Pessoas') return track.pessoas > 0
      if (filter === 'Vazias') return track.cargos === 0
      if (filter === 'Ativas') return track.ativo
      if (filter === 'Inativas') return !track.ativo
      return true
    })

    return matchesSearch && matchesFilters
  })

  const handleCreateTrack = async () => {
    // Validação
    const nomeError = validateRequired(formData.nome, 'Nome')
    if (nomeError) {
      toast.error(nomeError)
      return
    }

    if (!isAdmin) {
      toast.error('Você não tem permissão para criar trilhas')
      return
    }

    try {
      setIsSubmitting(true)

      const result = await createTrilha({
        nome: formData.nome,
        descricao: formData.descricao || null,
        ativo: formData.ativo,
      })

      if (result.success) {
        toast.successDino('Trilha criada com sucesso!')
        setCreateModalOpen(false)
        setFormData({ nome: '', descricao: '', cor: '#FF7A00', ativo: true })
        void loadTrilhas() // Recarregar lista
      } else {
        toast.error(result.error || 'Erro ao criar trilha')
      }
    } catch (error) {
      console.error('[Trilhas] Erro ao criar:', error)
      const appError = handleError(error, 'database')
      toast.error(appError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTrack = async () => {
    if (!selectedTrack) return

    // Validação
    const nomeError = validateRequired(formData.nome, 'Nome')
    if (nomeError) {
      toast.error(nomeError)
      return
    }

    if (!isAdmin) {
      toast.error('Você não tem permissão para editar trilhas')
      return
    }

    try {
      setIsSubmitting(true)

      const result = await updateTrilha(selectedTrack.id, {
        nome: formData.nome,
        descricao: formData.descricao || null,
        ativo: formData.ativo,
      })

      if (result.success) {
        toast.successDino('Trilha atualizada com sucesso!')
        setEditModalOpen(false)
        setSelectedTrack(null)
        setFormData({ nome: '', descricao: '', cor: '#FF7A00', ativo: true })
        void loadTrilhas() // Recarregar lista
      } else {
        toast.error(result.error || 'Erro ao atualizar trilha')
      }
    } catch (error) {
      console.error('[Trilhas] Erro ao atualizar:', error)
      const appError = handleError(error, 'database')
      toast.error(appError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTrack = async () => {
    if (!selectedTrack) return

    if (!isAdmin) {
      toast.error('Você não tem permissão para deletar trilhas')
      return
    }

    try {
      setIsSubmitting(true)

      const result = await softDeleteTrilha(selectedTrack.id)

      if (result.success) {
        toast.successDino('Trilha desativada com sucesso!')
        setDeleteModalOpen(false)
        setSelectedTrack(null)
        void loadTrilhas() // Recarregar lista
      } else {
        toast.error(result.error || 'Erro ao desativar trilha')
      }
    } catch (error) {
      console.error('[Trilhas] Erro ao desativar:', error)
      const appError = handleError(error, 'database')
      toast.error(appError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDuplicateTrack = (track: CareerTrack) => {
    console.log('[Trilhas] Duplicar não implementado ainda:', track.id)
    toast.info('Funcionalidade de duplicar virá em breve!')
    setFormData({
      nome: `${track.nome} (cópia)`,
      descricao: track.descricao,
      cor: track.cor,
      ativo: true,
    })
    setCreateModalOpen(true)
  }

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    )
  }

  const openPositionsModal = (track: CareerTrack) => {
    setSelectedTrack(track)
    setCargosModal([])
    setPositionsModalOpen(true)
    void loadCargos(track.id)
  }

  const openPeopleModal = (track: CareerTrack) => {
    setSelectedTrack(track)
    setPessoasModal([])
    setPeopleModalOpen(true)
    void loadPessoas(track.id)
  }

  const openEditModal = (track: CareerTrack) => {
    setSelectedTrack(track)
    setFormData({
      nome: track.nome,
      descricao: track.descricao,
      cor: track.cor,
      ativo: track.ativo,
    })
    setEditModalOpen(true)
  }

  // Loading state
  if (loading) {
    return (
      <DashboardShell>
        <div className="p-6">
          <TableSkeleton rows={8} />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Trilhas"
          breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Configurações", href: "/configuracoes" }, { label: "Trilhas" }]}
          badge={{ label: "Admin", variant: "admin" }}
          actions={
            <div className="flex items-center gap-2">
              <SearchInput
                placeholder="Buscar trilhas..."
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
                className="w-64"
              />
              <div className="flex gap-1 rounded-lg border p-1">
                <Button
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  aria-label="Visualização em grade"
                  onClick={() => setView('grid')}
                  className={view === 'grid' ? 'text-white' : ''}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  aria-label="Visualização em tabela"
                  onClick={() => setView('table')}
                  className={view === 'table' ? 'text-white' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Trilha
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total de Trilhas
                </p>
                <p className="text-3xl font-bold mt-2">6</p>
                <p className="text-xs text-muted-foreground mt-1">
                  5 ativas, 1 inativa
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cargos Criados</p>
                <p className="text-3xl font-bold mt-2">42</p>
                <p className="text-xs text-muted-foreground mt-1">
                  distribuídos nas trilhas
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pessoas</p>
                <p className="text-3xl font-bold mt-2">127</p>
                <p className="text-xs text-muted-foreground mt-1">
                  em carreiras ativas
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {['Com Pessoas', 'Vazias', 'Ativas', 'Inativas'].map((filter) => (
            <Button
              key={filter}
              variant={activeFilters.includes(filter) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleFilter(filter)}
            >
              {filter}
              {activeFilters.includes(filter) && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Button>
          ))}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilters([])}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTracks.map((track) => (
              <Card
                key={track.id}
                className="p-6 hover:shadow-lg transition-all hover:scale-[1.02]"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: track.cor }}
                      />
                      <h3 className="text-2xl font-bold text-secondary">
                        {track.nome}
                      </h3>
                    </div>
                    <Badge
                      variant={track.ativo ? 'default' : 'secondary'}
                      className={track.ativo ? 'bg-green-500' : ''}
                    >
                      {track.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações da trilha">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTrack(track)
                          setCargosModal([])
                          setDetailsModalOpen(true)
                          void loadCargos(track.id)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditModal(track)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openPositionsModal(track)}>
                        <Briefcase className="h-4 w-4 mr-2" />
                        Ver Cargos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openPeopleModal(track)}>
                        <Users className="h-4 w-4 mr-2" />
                        Ver Pessoas
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicateTrack(track)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTrack(track)
                          setDeleteModalOpen(true)
                        }}
                        className="text-error"
                        disabled={track.cargos > 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {track.descricao}
                </p>

                <div className="border-t pt-4 mb-4" />

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cargos</p>
                      <p className="font-semibold">{track.cargos}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pessoas</p>
                      <p className="font-semibold">{track.pessoas}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Níveis usados
                      </p>
                      <p className="font-semibold">
                        {track.niveisUsados.min}-{track.niveisUsados.max}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Avg. Nível
                      </p>
                      <p className="font-semibold">{track.nivelMedio}</p>
                    </div>
                  </div>
                </div>

                {/* Positions Preview */}
                {track.cargosPrincipais.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold mb-2">
                      Cargos nesta trilha:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {track.cargosPrincipais.slice(0, 3).map((cargo, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cargo}
                        </Badge>
                      ))}
                      {track.cargosPrincipais.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{track.cargosPrincipais.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Footer */}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPositionsModal(track)}
                  >
                    Ver Todos os Cargos
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditModal(track)}
                    >
                      Editar Trilha
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => openPeopleModal(track)}
                    >
                      Gerenciar Pessoas
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Table View */}
        {view === 'table' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold">
                      Nome da Trilha
                    </th>
                    <th className="text-left p-4 font-semibold">Descrição</th>
                    <th className="text-left p-4 font-semibold">Cargos</th>
                    <th className="text-left p-4 font-semibold">Pessoas</th>
                    <th className="text-left p-4 font-semibold">Níveis</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTracks.map((track) => (
                    <tr key={track.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: track.cor }}
                          />
                          <span className="font-semibold">{track.nome}</span>
                        </div>
                      </td>
                      <td className="p-4 max-w-md">
                        <p className="text-sm text-muted-foreground truncate">
                          {track.descricao}
                        </p>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => openPositionsModal(track)}
                        >
                          {track.cargos} cargos
                        </Button>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => openPeopleModal(track)}
                        >
                          {track.pessoas} pessoas
                        </Button>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          {track.niveisUsados.min}-{track.niveisUsados.max}
                        </span>
                      </td>
                      <td className="p-4">
                        <Switch checked={track.ativo} />
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Ações da trilha">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTrack(track)
                                setDetailsModalOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditModal(track)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateTrack(track)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTrack(track)
                                setDeleteModalOpen(true)
                              }}
                              className="text-error"
                              disabled={track.cargos > 0}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Create/Edit Track Modal */}
        <Dialog
          open={createModalOpen || editModalOpen}
          onOpenChange={(open) => {
            setCreateModalOpen(open)
            setEditModalOpen(open)
            if (!open) {
              setFormData({ nome: '', descricao: '', cor: '#FF7A00', ativo: true })
            }
          }}
        >
          <DialogContent 
            className="p-0"
            onInteractOutside={() => {
              setCreateModalOpen(false)
              setEditModalOpen(false)
              setFormData({ nome: '', descricao: '', cor: '#FF7A00', ativo: true })
            }}
            onEscapeKeyDown={() => {
              setCreateModalOpen(false)
              setEditModalOpen(false)
              setFormData({ nome: '', descricao: '', cor: '#FF7A00', ativo: true })
            }}
          >
            <div className="p-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle>
                  {editModalOpen ? 'Editar Trilha' : 'Nova Trilha de Carreira'}
                </DialogTitle>
                <DialogDescription>
                  {editModalOpen
                    ? 'Atualize as informações da trilha'
                    : 'Preencha as informações para criar uma nova trilha'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Trilha *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Engenharia de Software"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.nome.length}/100 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o foco e responsabilidades desta trilha..."
                  rows={4}
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.descricao.length}/500 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cor"
                    type="color"
                    value={formData.cor}
                    onChange={(e) =>
                      setFormData({ ...formData, cor: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <div className="flex-1">
                    <Input value={formData.cor} readOnly />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Usada para elementos visuais (badges, gráficos)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ativo">Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Trilhas inativas não aparecem em novas seleções
                  </p>
                </div>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: checked })
                  }
                />
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <p className="text-xs font-semibold mb-2">Preview:</p>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: formData.cor }}
                  />
                  <span className="font-bold">
                    {formData.nome || 'Nome da Trilha'}
                  </span>
                  <Badge
                    variant={formData.ativo ? 'default' : 'secondary'}
                    className={formData.ativo ? 'bg-green-500' : ''}
                  >
                    {formData.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.descricao || 'Descrição da trilha...'}
                </p>
              </div>
            </div>

            <div className="p-6 pt-4 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateModalOpen(false)
                  setEditModalOpen(false)
                }}
              >
                Cancelar
              </Button>
              {!editModalOpen && (
                <Button
                  variant="outline"
                  onClick={() => { void handleCreateTrack() }}
                >
                  Salvar e Adicionar Cargos
                </Button>
              )}
              <Button
                onClick={() => { void (editModalOpen ? handleEditTrack() : handleCreateTrack()) }}
                disabled={!formData.nome}
              >
                {editModalOpen ? 'Salvar Alterações' : 'Salvar Trilha'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent 
            className="sm:max-w-4xl w-full p-0"
            onInteractOutside={() => setDetailsModalOpen(false)}
            onEscapeKeyDown={() => setDetailsModalOpen(false)}
          >
            <div className="p-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle>
                  {selectedTrack?.nome} - Detalhes
                </DialogTitle>
              </DialogHeader>
            </div>

            <Tabs defaultValue="overview" className="p-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="positions">Posições</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Information */}
                <div>
                  <h3 className="font-semibold mb-3">Informações</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{selectedTrack?.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={
                          selectedTrack?.ativo ? 'default' : 'secondary'
                        }
                        className={
                          selectedTrack?.ativo ? 'bg-green-500' : ''
                        }
                      >
                        {selectedTrack?.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Descrição
                      </p>
                      <p className="text-sm">{selectedTrack?.descricao}</p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="font-semibold mb-3">Estatísticas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground">
                        Total cargos
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedTrack?.cargos}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground">
                        Total pessoas
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedTrack?.pessoas}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground">
                        Níveis usados
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedTrack?.niveisUsados.min}-
                        {selectedTrack?.niveisUsados.max}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-xs text-muted-foreground">
                        Nível médio
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedTrack?.nivelMedio}
                      </p>
                    </Card>
                  </div>
                </div>

                {/* Career Progression */}
                <div>
                  <h3 className="font-semibold mb-3">Progressão de Carreira</h3>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground mb-4">
                      Baseado em cargos criados nesta trilha
                    </p>
                    <div className="space-y-3">
                      {selectedTrack?.cargosPrincipais.map((cargo, idx) => (
                        <div key={idx}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">L{idx + 2}</Badge>
                            <span className="font-medium">{cargo}</span>
                          </div>
                          {idx < (selectedTrack?.cargosPrincipais.length ?? 0) - 1 && (
                            <div className="flex items-center gap-2 ml-4 my-1">
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                ~{idx + 1}-{idx + 2} anos
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="positions" className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Todos os cargos desta trilha
                  </p>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Novo Cargo
                  </Button>
                </div>
                <Card>
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4">Nome do Cargo</th>
                        <th className="text-left p-4">Nível</th>
                        <th className="text-left p-4">Pessoas</th>
                        <th className="text-left p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingModal ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                          </td>
                        </tr>
                      ) : cargosModal.length === 0 ? (
                        <tr>
                          <td colSpan={4}>
                            <EmptyState
                              icon={<Briefcase className="h-10 w-10" />}
                              title="Nenhum cargo nesta trilha"
                            />
                          </td>
                        </tr>
                      ) : (
                        cargosModal.map((cargo) => (
                          <tr key={cargo.id} className="border-b hover:bg-muted/50 cursor-pointer">
                            <td className="p-4 font-medium">{cargo.nome}</td>
                            <td className="p-4">
                              {cargo.nivel_nome ? (
                                <Badge variant="outline">{cargo.nivel_nome}</Badge>
                              ) : '—'}
                            </td>
                            <td className="p-4">{cargo.pessoas_count}</td>
                            <td className="p-4">
                              <StatusBadge status="Ativo" />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="p-6 pt-4 border-t flex justify-end">
              <Button onClick={() => setDetailsModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Positions Modal */}
        <Dialog open={positionsModalOpen} onOpenChange={setPositionsModalOpen}>
          <DialogContent 
            className="p-0"
            onInteractOutside={() => setPositionsModalOpen(false)}
            onEscapeKeyDown={() => setPositionsModalOpen(false)}
          >
            <div className="p-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle>Cargos - {selectedTrack?.nome}</DialogTitle>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {loadingModal ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : cargosModal.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="h-10 w-10" />}
                  title="Nenhum cargo encontrado nesta trilha"
                />
              ) : (
                cargosModal.map((cargo) => (
                  <Card key={cargo.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{cargo.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {cargo.nivel_nome && (
                            <Badge variant="outline">{cargo.nivel_nome}</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {cargo.pessoas_count} {cargo.pessoas_count === 1 ? 'pessoa' : 'pessoas'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="p-6 pt-4 border-t flex justify-between">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Cargo nesta Trilha
              </Button>
              <Button onClick={() => setPositionsModalOpen(false)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View People Modal */}
        <Dialog open={peopleModalOpen} onOpenChange={setPeopleModalOpen}>
          <DialogContent 
            className="sm:max-w-4xl w-full p-0"
            onInteractOutside={() => setPeopleModalOpen(false)}
            onEscapeKeyDown={() => setPeopleModalOpen(false)}
          >
            <div className="p-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle>Pessoas - {selectedTrack?.nome}</DialogTitle>
              </DialogHeader>
            </div>

            <div className="p-6">
              <Card>
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4">Pessoa</th>
                      <th className="text-left p-4">Cargo</th>
                      <th className="text-left p-4">Nível</th>
                      <th className="text-left p-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingModal ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        </td>
                      </tr>
                    ) : pessoasModal.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <EmptyState
                            icon={<Users className="h-10 w-10" />}
                            title="Nenhuma pessoa encontrada nesta trilha"
                          />
                        </td>
                      </tr>
                    ) : (
                      pessoasModal.map((person) => (
                        <tr key={person.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={person.foto_url || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {person.nome.split(' ').map((n) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{person.nome}</span>
                            </div>
                          </td>
                          <td className="p-4">{person.cargo_nome ?? '—'}</td>
                          <td className="p-4">
                            {person.nivel_nome ? (
                              <Badge variant="outline">{person.nivel_nome}</Badge>
                            ) : '—'}
                          </td>
                          <td className="p-4">{person.time_nome ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </div>

            <div className="p-6 pt-4 border-t flex justify-between">
              <Button variant="outline">Exportar Lista</Button>
              <Button onClick={() => setPeopleModalOpen(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent 
            className="sm:max-w-md"
            onInteractOutside={() => setDeleteModalOpen(false)}
            onEscapeKeyDown={() => setDeleteModalOpen(false)}
          >
            <DialogHeader>
              <DialogTitle>Excluir Trilha?</DialogTitle>
              <DialogDescription>
                {selectedTrack && selectedTrack.cargos > 0 ? (
                  <div className="flex items-start gap-2 mt-4 text-error">
                    <XCircle className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Não é possível excluir.</p>
                      <p className="text-sm">
                        {selectedTrack.cargos} cargos nesta trilha. Remova ou
                        mova os cargos primeiro.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p>Esta ação não pode ser desfeita.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Pessoas nos cargos desta trilha perderão a referência de
                      trilha
                    </p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => { void handleDeleteTrack() }}
                disabled={selectedTrack ? selectedTrack.cargos > 0 : true}
              >
                Excluir Trilha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
