'use client'

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Briefcase, TrendingUp, BarChart3, Plus, Search, Filter, Grid3x3, List, MoreVertical, ChevronUp, Users, Edit, Copy, Trash2, ShieldAlert, Loader2 } from 'lucide-react'
import { TableSkeleton, Breadcrumb } from '@/components/shared'
import Link from 'next/link'
import { toast } from '@/lib/ui/toast-config'
import { handleError, validateRequired } from '@/lib/errors/error-handler'
import {
  getCargosComEstatisticas,
  createCargo,
  updateCargo,
  softDeleteCargo,
  getTrilhasParaFiltro,
  getNiveisParaFiltro,
  getPessoasNoCargo,
  type CargoComEstatisticas,
  type PessoaNoCargo,
} from '@/app/actions/cargos.actions'
import { getCurrentUser, checkIsAdmin } from '@/app/actions/auth.actions'

const trackColors: Record<string, string> = {
  'Engenharia de Software': 'bg-blue-100 text-blue-800',
  'Produto': 'bg-purple-100 text-purple-800',
  'Design': 'bg-pink-100 text-pink-800',
  'Dados': 'bg-green-100 text-green-800',
  'Marketing': 'bg-yellow-100 text-yellow-800',
  'Operações': 'bg-orange-100 text-orange-800',
}

export default function CargosPage() {
  // Data state
  const [cargos, setCargos] = useState<CargoComEstatisticas[]>([])
  const [trilhas, setTrilhas] = useState<Array<{ id: string; nome: string }>>([])
  const [niveis, setNiveis] = useState<Array<{ id: string; nome: string }>>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [, setCurrentUser] = useState<string | null>(null)

  // UI state
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [viewPeopleModalOpen, setViewPeopleModalOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<CargoComEstatisticas | null>(null)
  const [pessoasDoCargo, setPessoasDoCargo] = useState<PessoaNoCargo[]>([])
  const [loadingPessoas, setLoadingPessoas] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    trilha_id: '',
    nivel_id: '',
    ativo: true,
  })

  // Filters
  const [filters, setFilters] = useState({
    trilhas: [] as string[],
    niveis: [] as string[],
    status: 'todos',
    sortBy: 'nome',
  })

  // Mutation state
  const [, setIsSubmitting] = useState(false)

  // Load data and check permissions on mount
  useEffect(() => {
    void loadCargos()
    void loadTrilhas()
    void loadNiveis()
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
            message: 'Ops! Você não tem permissão para gerenciar cargos.',
          }
          toast.error(error)
        }
      }
    } catch (error) {
      console.error('[Cargos] Erro ao verificar permissões:', error)
    }
  }

  async function loadCargos() {
    try {
      setLoading(true)
      const result = await getCargosComEstatisticas()

      if (result.success && result.data) {
        setCargos(result.data)
      } else {
        toast.error(result.error || 'Erro ao carregar cargos')
      }
    } catch (error) {
      console.error('[Cargos] Erro ao carregar:', error)
      const appError = handleError(error, 'database')
      toast.error(appError)
    } finally {
      setLoading(false)
    }
  }

  async function loadTrilhas() {
    try {
      const result = await getTrilhasParaFiltro()
      if (result.success && result.data) {
        setTrilhas(result.data)
      }
    } catch (error) {
      console.error('[Cargos] Erro ao carregar trilhas:', error)
    }
  }

  async function loadNiveis() {
    try {
      const result = await getNiveisParaFiltro()
      if (result.success && result.data) {
        setNiveis(result.data)
      }
    } catch (error) {
      console.error('[Cargos] Erro ao carregar níveis:', error)
    }
  }

  const handleCreatePosition = async () => {
    // Validações
    const nomeError = validateRequired(formData.nome, 'Nome')
    if (nomeError) {
      toast.error(nomeError)
      return
    }

    const trilhaError = validateRequired(formData.trilha_id, 'Trilha')
    if (trilhaError) {
      toast.error(trilhaError)
      return
    }

    const nivelError = validateRequired(formData.nivel_id, 'Nível')
    if (nivelError) {
      toast.error(nivelError)
      return
    }

    if (!isAdmin) {
      toast.error('Você não tem permissão para criar cargos')
      return
    }

    try {
      setIsSubmitting(true)

      const result = await createCargo({
        nome: formData.nome,
        trilha_id: formData.trilha_id,
        nivel_id: formData.nivel_id,
        ativo: formData.ativo,
      })

      if (result.success) {
        toast.successDino('Cargo criado com sucesso!')
        setCreateModalOpen(false)
        setFormData({ nome: '', trilha_id: '', nivel_id: '', ativo: true })
        void loadCargos() // Recarregar lista
      } else {
        toast.error(result.error || 'Erro ao criar cargo')
      }
    } catch (error) {
      console.error('[Cargos] Erro ao criar:', error)
      const appError = handleError(error, 'database')
      toast.error(appError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPosition = async () => {
    if (!selectedPosition) return

    // Validações
    const nomeError = validateRequired(formData.nome, 'Nome')
    if (nomeError) {
      toast.error(nomeError)
      return
    }

    if (!isAdmin) {
      toast.error('Você não tem permissão para editar cargos')
      return
    }

    try {
      setIsSubmitting(true)

      const result = await updateCargo(selectedPosition.id, {
        nome: formData.nome,
        trilha_id: formData.trilha_id || undefined,
        nivel_id: formData.nivel_id || undefined,
        ativo: formData.ativo,
      })

      if (result.success) {
        toast.successDino('Cargo atualizado com sucesso!')
        setEditModalOpen(false)
        setSelectedPosition(null)
        setFormData({ nome: '', trilha_id: '', nivel_id: '', ativo: true })
        void loadCargos() // Recarregar lista
      } else {
        toast.error(result.error || 'Erro ao atualizar cargo')
      }
    } catch (error) {
      console.error('[Cargos] Erro ao atualizar:', error)
      const appError = handleError(error, 'database')
      toast.error(appError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePosition = async () => {
    if (!selectedPosition) return

    if (!isAdmin) {
      toast.error('Você não tem permissão para deletar cargos')
      return
    }

    try {
      setIsSubmitting(true)

      const result = await softDeleteCargo(selectedPosition.id)

      if (result.success) {
        toast.successDino('Cargo desativado com sucesso!')
        setDeleteModalOpen(false)
        setSelectedPosition(null)
        void loadCargos() // Recarregar lista
      } else {
        toast.error(result.error || 'Erro ao desativar cargo')
      }
    } catch (error) {
      console.error('[Cargos] Erro ao desativar:', error)
      const appError = handleError(error, 'database')
      toast.error(appError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDuplicatePosition = (position: CargoComEstatisticas) => {
    setFormData({
      nome: `${position.nome} (cópia)`,
      trilha_id: position.trilha_id,
      nivel_id: position.nivel_id,
      ativo: true,
    })
    setCreateModalOpen(true)
  }

  const handleViewPeople = async (position: CargoComEstatisticas) => {
    setSelectedPosition(position)
    setViewPeopleModalOpen(true)
    setLoadingPessoas(true)
    try {
      const result = await getPessoasNoCargo(position.id)
      if (result.success && result.data) {
        setPessoasDoCargo(result.data)
      } else {
        toast.error(result.error || 'Erro ao carregar pessoas')
      }
    } catch (error) {
      const appError = handleError(error, 'database')
      toast.error(appError)
    } finally {
      setLoadingPessoas(false)
    }
  }

  const handleToggleStatus = (positionId: string) => {
    console.log('Toggling status for position:', positionId)
  }

  const filteredPositions = cargos.filter((cargo) => {
    if (searchQuery && !cargo.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filters.trilhas.length > 0 && !filters.trilhas.includes(cargo.trilha?.nome || '')) {
      return false
    }
    if (filters.niveis.length > 0 && !filters.niveis.includes(cargo.nivel?.nome || '')) {
      return false
    }
    if (filters.status === 'ativos' && !cargo.ativo) return false
    if (filters.status === 'inativos' && cargo.ativo) return false
    return true
  })

  const stats = {
    total: cargos.length,
    ativos: cargos.filter((p) => p.ativo).length,
    inativos: cargos.filter((p) => !p.ativo).length,
    trilhas: new Set(cargos.map((p) => p.trilha?.nome).filter(Boolean)).size,
    niveisMin: 'L1',
    niveisMax: 'L8',
    totalNiveis: 8,
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
        <div className="flex flex-col gap-4">
          <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Configurações", href: "/configuracoes" }, { label: "Cargos" }]} />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Cargos</h1>
              <ShieldAlert className="h-5 w-5 text-error" />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar cargos..."
                  className="w-64 pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>

              <div className="flex gap-1 rounded-lg border p-1">
                <Button
                  variant={view === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  className={`h-8 w-8 ${view === 'table' ? 'text-white' : ''}`}
                  onClick={() => setView('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className={`h-8 w-8 ${view === 'grid' ? 'text-white' : ''}`}
                  onClick={() => setView('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-primary-strong hover:bg-primary-strong/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Cargo
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Cargos</p>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.ativos} ativos, {stats.inativos} inativos
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trilhas</p>
                <p className="text-3xl font-bold">{stats.trilhas}</p>
                <p className="text-sm text-muted-foreground mt-1">carreiras ativas</p>
              </div>
              <div className="rounded-full bg-cyan-100 p-3">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Níveis Usados</p>
                <p className="text-3xl font-bold">
                  {stats.niveisMin} - {stats.niveisMax}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.totalNiveis} níveis com cargos
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters Bar */}
        {showFilters && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filtros</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>Trilha de Carreira</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="eng">Engenharia de Software</SelectItem>
                      <SelectItem value="produto">Produto</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="dados">Dados</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="ops">Operações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nível</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'].map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativos">Ativos</SelectItem>
                      <SelectItem value="inativos">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Ordenar por</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nome">Nome (A-Z)</SelectItem>
                      <SelectItem value="trilha">Trilha</SelectItem>
                      <SelectItem value="nivel-asc">Nível (crescente)</SelectItem>
                      <SelectItem value="nivel-desc">Nível (decrescente)</SelectItem>
                      <SelectItem value="pessoas-desc">Pessoas (mais)</SelectItem>
                      <SelectItem value="pessoas-asc">Pessoas (menos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-8">
            Engenharia
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            L3-L5
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            Com Pessoas
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            Sem Pessoas
          </Button>
        </div>

        {/* Table View */}
        {view === 'table' && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead>Nome do Cargo</TableHead>
                  <TableHead>Trilha de Carreira</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Pessoas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell className="font-medium">{position.nome}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={trackColors[position.trilha?.nome || '']}>
                        {position.trilha?.nome || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{position.nivel?.nome || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      {position.pessoas > 0 ? (
                        <button
                          onClick={() => { void handleViewPeople(position) }}
                          className="text-accent hover:underline"
                        >
                          {position.pessoas} {position.pessoas === 1 ? 'pessoa' : 'pessoas'}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">0 pessoas</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={position.ativo}
                        onCheckedChange={() => handleToggleStatus(position.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { void handleViewPeople(position) }}>
                            <Users className="mr-2 h-4 w-4" />
                            Ver Pessoas neste Cargo
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPosition(position)
                              setFormData({
                                nome: position.nome,
                                trilha_id: position.trilha_id,
                                nivel_id: position.nivel_id,
                                ativo: position.ativo,
                              })
                              setEditModalOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicatePosition(position)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPosition(position)
                              setDeleteModalOpen(true)
                            }}
                            className="text-destructive"
                            disabled={position.pessoas > 0}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPositions.map((position) => (
              <Card key={position.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{position.nome}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { void handleViewPeople(position) }}>
                          <Users className="mr-2 h-4 w-4" />
                          Ver Pessoas
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPosition(position)
                            setFormData({
                              nome: position.nome,
                              trilha_id: position.trilha_id,
                              nivel_id: position.nivel_id,
                              ativo: position.ativo,
                            })
                            setEditModalOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicatePosition(position)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPosition(position)
                            setDeleteModalOpen(true)
                          }}
                          className="text-destructive"
                          disabled={position.pessoas > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="secondary" className={trackColors[position.trilha?.nome || '']}>
                      {position.trilha?.nome || 'N/A'}
                    </Badge>
                    <Badge variant="outline">{position.nivel?.nome || 'N/A'}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {position.pessoas} {position.pessoas === 1 ? 'pessoa' : 'pessoas'}
                    </div>
                    <Switch
                      checked={position.ativo}
                      onCheckedChange={() => handleToggleStatus(position.id)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={createModalOpen || editModalOpen} onOpenChange={(open) => {
          if (!open) {
            setCreateModalOpen(false)
            setEditModalOpen(false)
            setSelectedPosition(null)
            setFormData({ nome: '', trilha_id: '', nivel_id: '', ativo: true })
          }
        }}>
          <DialogContent 
            onInteractOutside={() => {
              setCreateModalOpen(false)
              setEditModalOpen(false)
              setSelectedPosition(null)
              setFormData({ nome: '', trilha_id: '', nivel_id: '', ativo: true })
            }}
            onEscapeKeyDown={() => {
              setCreateModalOpen(false)
              setEditModalOpen(false)
              setSelectedPosition(null)
              setFormData({ nome: '', trilha_id: '', nivel_id: '', ativo: true })
            }}
          >
            <DialogHeader>
              <DialogTitle>{editModalOpen ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
              <DialogDescription>
                Preencha as informações do cargo. Cargo = Nome + Trilha + Nível.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="nome">Nome do Cargo *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Senior Engineer"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.nome.length}/100 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="trilha">Trilha de Carreira *</Label>
                <Select value={formData.trilha_id} onValueChange={(value) => setFormData({ ...formData, trilha_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a trilha" />
                  </SelectTrigger>
                  <SelectContent>
                    {trilhas.map((trilha) => (
                      <SelectItem key={trilha.id} value={trilha.id}>
                        {trilha.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nivel">Nível *</Label>
                <Select value={formData.nivel_id} onValueChange={(value) => setFormData({ ...formData, nivel_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveis.map((nivel) => (
                      <SelectItem key={nivel.id} value={nivel.id}>
                        {nivel.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.ativo ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>

              {formData.nome && formData.trilha_id && formData.nivel_id && (() => {
                const trilhaSelecionada = trilhas.find(t => t.id === formData.trilha_id)
                const nivelSelecionado = niveis.find(n => n.id === formData.nivel_id)
                return (
                  <Card className="p-4 bg-muted">
                    <p className="text-sm font-medium mb-2">Preview</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={trackColors[trilhaSelecionada?.nome || '']}>
                        {trilhaSelecionada?.nome || 'N/A'}
                      </Badge>
                      <span className="font-medium">
                        {formData.nome} ({nivelSelecionado?.nome || 'N/A'})
                      </span>
                    </div>
                  </Card>
                )
              })()}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateModalOpen(false)
                  setEditModalOpen(false)
                  setFormData({ nome: '', trilha_id: '', nivel_id: '', ativo: true })
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => { void (editModalOpen ? handleEditPosition() : handleCreatePosition()) }}
                className="bg-primary-strong hover:bg-primary-strong/90"
                disabled={!formData.nome || !formData.trilha_id || !formData.nivel_id}
              >
                {editModalOpen ? 'Salvar Alterações' : 'Salvar Cargo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent 
            className="sm:max-w-md"
            onInteractOutside={() => setDeleteModalOpen(false)}
            onEscapeKeyDown={() => setDeleteModalOpen(false)}
          >
            <DialogHeader>
              <DialogTitle>Excluir Cargo?</DialogTitle>
              <DialogDescription>
                {selectedPosition && (selectedPosition.pessoas ?? 0) > 0 ? (
                  <span className="text-destructive">
                    Não é possível excluir. {selectedPosition.pessoas}{' '}
                    {selectedPosition.pessoas === 1 ? 'pessoa possui' : 'pessoas possuem'} este cargo.
                    Mova-as primeiro.
                  </span>
                ) : (
                  'Esta ação não pode ser desfeita.'
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => { void handleDeletePosition() }}
                disabled={selectedPosition != null && (selectedPosition.pessoas ?? 0) > 0}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View People Modal */}
        <Dialog open={viewPeopleModalOpen} onOpenChange={(open) => { setViewPeopleModalOpen(open); if (!open) setPessoasDoCargo([]) }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Pessoas com este Cargo</DialogTitle>
              <DialogDescription>
                {selectedPosition?.nome} - {selectedPosition?.pessoas}{' '}
                {selectedPosition?.pessoas === 1 ? 'pessoa' : 'pessoas'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {loadingPessoas ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pessoasDoCargo.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhuma pessoa neste cargo.
                </p>
              ) : (
                pessoasDoCargo.map((person) => (
                  <div key={person.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50">
                    <Avatar>
                      <AvatarImage src={person.foto_url || '/placeholder.svg'} />
                      <AvatarFallback>{person.nome.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{person.nome}</p>
                      {person.time_nome && (
                        <p className="text-sm text-muted-foreground">{person.time_nome}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pessoas/${person.id}`}>Ver Perfil</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewPeopleModalOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
