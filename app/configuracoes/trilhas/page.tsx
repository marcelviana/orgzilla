'use client'

import { useState } from 'react'
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
import { Plus, Search, Grid3x3, List, TrendingUp, Briefcase, Users, MoreVertical, BarChart3, ShieldAlert, X, Trash2, Copy, Eye, Edit, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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

const mockTracks: CareerTrack[] = [
  {
    id: 't1',
    nome: 'Engenharia de Software',
    descricao:
      'Desenvolvimento, arquitetura e manutenção de sistemas de software, desde aplicações web até infraestrutura',
    cargos: 12,
    pessoas: 58,
    niveisUsados: { min: 'L2', max: 'L8' },
    nivelMedio: 'L4',
    ativo: true,
    cargosPrincipais: [
      'Engineer I',
      'Engineer II',
      'Senior Engineer',
      'Staff Engineer',
      'Principal Engineer',
    ],
    cor: '#FF7A00',
  },
  {
    id: 't2',
    nome: 'Produto',
    descricao:
      'Product Management, definição de estratégia, roadmap e priorização de features',
    cargos: 8,
    pessoas: 18,
    niveisUsados: { min: 'L2', max: 'L6' },
    nivelMedio: 'L4',
    ativo: true,
    cargosPrincipais: [
      'Associate PM',
      'Product Manager',
      'Senior PM',
      'Group PM',
    ],
    cor: '#00C8FF',
  },
  {
    id: 't3',
    nome: 'Design',
    descricao:
      'UX/UI Design, Design Research, Design Systems e experiência do usuário',
    cargos: 6,
    pessoas: 12,
    niveisUsados: { min: 'L2', max: 'L5' },
    nivelMedio: 'L3',
    ativo: true,
    cargosPrincipais: [
      'Designer Júnior',
      'Designer',
      'Senior Designer',
      'Design Lead',
    ],
    cor: '#9333EA',
  },
  {
    id: 't4',
    nome: 'Dados',
    descricao:
      'Data Science, Analytics, Business Intelligence e Machine Learning',
    cargos: 7,
    pessoas: 15,
    niveisUsados: { min: 'L2', max: 'L6' },
    nivelMedio: 'L3',
    ativo: true,
    cargosPrincipais: [
      'Data Analyst',
      'Data Scientist',
      'Senior Data Scientist',
      'Data Lead',
    ],
    cor: '#8B5CF6',
  },
  {
    id: 't5',
    nome: 'Marketing',
    descricao:
      'Marketing Digital, Growth, Branding, Comunicação e estratégia de mercado',
    cargos: 5,
    pessoas: 10,
    niveisUsados: { min: 'L2', max: 'L5' },
    nivelMedio: 'L3',
    ativo: true,
    cargosPrincipais: [
      'Marketing Analyst',
      'Marketing Specialist',
      'Marketing Manager',
      'Marketing Lead',
    ],
    cor: '#F59E0B',
  },
  {
    id: 't6',
    nome: 'Operações',
    descricao:
      'Infraestrutura, DevOps, Segurança, SRE e operações de TI',
    cargos: 4,
    pessoas: 14,
    niveisUsados: { min: 'L3', max: 'L6' },
    nivelMedio: 'L4',
    ativo: true,
    cargosPrincipais: [
      'DevOps Engineer',
      'SRE',
      'Infrastructure Lead',
      'Security Engineer',
    ],
    cor: '#EF4444',
  },
]

const mockPositions = [
  { id: 1, name: 'Engineer I', level: 'L2', people: 12 },
  { id: 2, name: 'Engineer II', level: 'L3', people: 18 },
  { id: 3, name: 'Senior Engineer', level: 'L4', people: 15 },
  { id: 4, name: 'Staff Engineer', level: 'L5', people: 8 },
  { id: 5, name: 'Principal Engineer', level: 'L6', people: 5 },
]

const mockPeople = [
  {
    id: 1,
    name: 'Maria Santos',
    position: 'Senior Engineer',
    level: 'L4',
    team: 'Engenharia',
    avatar: '/diverse-woman-portrait.png',
  },
  {
    id: 2,
    name: 'João Silva',
    position: 'Staff Engineer',
    level: 'L5',
    team: 'Backend',
    avatar: '/man.jpg',
  },
  {
    id: 3,
    name: 'Ana Costa',
    position: 'Engineer II',
    level: 'L3',
    team: 'Frontend',
    avatar: '/tech-woman.png',
  },
]

export default function CareerTracksPage() {
  const [tracks, setTracks] = useState<CareerTrack[]>(mockTracks)
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [positionsModalOpen, setPositionsModalOpen] = useState(false)
  const [peopleModalOpen, setPeopleModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  
  const [selectedTrack, setSelectedTrack] = useState<CareerTrack | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#FF7A00',
    ativo: true,
  })

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

  const handleCreateTrack = () => {
    console.log('[v0] Creating track:', formData)
    setCreateModalOpen(false)
    // Show success toast
  }

  const handleEditTrack = () => {
    console.log('[v0] Editing track:', selectedTrack?.id, formData)
    setEditModalOpen(false)
    // Show success toast
  }

  const handleDeleteTrack = () => {
    console.log('[v0] Deleting track:', selectedTrack?.id)
    setDeleteModalOpen(false)
    // Show success toast
  }

  const handleDuplicateTrack = (track: CareerTrack) => {
    console.log('[v0] Duplicating track:', track.id)
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

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Dashboard</span>
            <span>{'>'}</span>
            <span>Configurações</span>
            <span>{'>'}</span>
            <span className="text-foreground">Trilhas</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                Trilhas
              </h1>
              <ShieldAlert className="h-5 w-5 text-error" />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar trilhas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <div className="flex gap-1 rounded-lg border p-1">
                <Button
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setView('grid')}
                  className={view === 'grid' ? 'text-white' : ''}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <Button variant="ghost" size="icon">
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
                      <DropdownMenuItem onClick={() => openEditModal(track)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTrack(track)
                          setPositionsModalOpen(true)
                        }}
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Ver Cargos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTrack(track)
                          setPeopleModalOpen(true)
                        }}
                      >
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
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                    onClick={() => {
                      setSelectedTrack(track)
                      setPositionsModalOpen(true)
                    }}
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
                      onClick={() => {
                        setSelectedTrack(track)
                        setPeopleModalOpen(true)
                      }}
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
                          onClick={() => {
                            setSelectedTrack(track)
                            setPositionsModalOpen(true)
                          }}
                        >
                          {track.cargos} cargos
                        </Button>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => {
                            setSelectedTrack(track)
                            setPeopleModalOpen(true)
                          }}
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
                            <Button variant="ghost" size="icon">
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
          <DialogContent className="sm:max-w-2xl w-full p-0">
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

            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
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
                  onClick={() => {
                    handleCreateTrack()
                    console.log('[v0] Save and add positions')
                  }}
                >
                  Salvar e Adicionar Cargos
                </Button>
              )}
              <Button
                onClick={editModalOpen ? handleEditTrack : handleCreateTrack}
                disabled={!formData.nome}
              >
                {editModalOpen ? 'Salvar Alterações' : 'Salvar Trilha'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="sm:max-w-4xl w-full p-0">
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
                  <div className="grid grid-cols-2 gap-4">
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
                      {mockPositions.map((position) => (
                        <tr
                          key={position.id}
                          className="border-b hover:bg-muted/50 cursor-pointer"
                        >
                          <td className="p-4 font-medium">{position.name}</td>
                          <td className="p-4">
                            <Badge variant="outline">{position.level}</Badge>
                          </td>
                          <td className="p-4">{position.people}</td>
                          <td className="p-4">
                            <Badge className="bg-green-500">Ativo</Badge>
                          </td>
                        </tr>
                      ))}
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
          <DialogContent className="sm:max-w-2xl w-full p-0">
            <div className="p-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle>Cargos - {selectedTrack?.nome}</DialogTitle>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {mockPositions.map((position) => (
                <Card key={position.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{position.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{position.level}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {position.people} pessoas
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver Cargo
                    </Button>
                  </div>
                </Card>
              ))}
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
          <DialogContent className="sm:max-w-4xl w-full p-0">
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
                    {mockPeople.map((person) => (
                      <tr key={person.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={person.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {person.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{person.name}</span>
                          </div>
                        </td>
                        <td className="p-4">{person.position}</td>
                        <td className="p-4">
                          <Badge variant="outline">{person.level}</Badge>
                        </td>
                        <td className="p-4">{person.team}</td>
                      </tr>
                    ))}
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
          <DialogContent className="sm:max-w-md w-full p-6">
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
                onClick={handleDeleteTrack}
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
