'use client'

import { useState } from 'react'
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
import { Briefcase, TrendingUp, BarChart3, Plus, Search, Filter, Grid3x3, List, MoreVertical, ChevronDown, ChevronUp, Users, Edit, Copy, Trash2, X, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

// Mock data
const mockPositions = [
  // Engenharia de Software
  { id: 'c1', nome: 'Engineer I', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L2', nivelId: 'n2', pessoas: 12, ativo: true },
  { id: 'c2', nome: 'Engineer II', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L3', nivelId: 'n3', pessoas: 18, ativo: true },
  { id: 'c3', nome: 'Senior Engineer', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L4', nivelId: 'n4', pessoas: 15, ativo: true },
  { id: 'c4', nome: 'Staff Engineer', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L5', nivelId: 'n5', pessoas: 8, ativo: true },
  { id: 'c5', nome: 'Principal Engineer', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L6', nivelId: 'n6', pessoas: 4, ativo: true },
  { id: 'c6', nome: 'Engineering Lead', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L6', nivelId: 'n6', pessoas: 3, ativo: true },
  { id: 'c7', nome: 'Architect', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L7', nivelId: 'n7', pessoas: 2, ativo: true },
  
  // Produto
  { id: 'c8', nome: 'Associate PM', trilha: 'Produto', trilhaId: 't2', nivel: 'L2', nivelId: 'n2', pessoas: 3, ativo: true },
  { id: 'c9', nome: 'Product Manager', trilha: 'Produto', trilhaId: 't2', nivel: 'L4', nivelId: 'n4', pessoas: 8, ativo: true },
  { id: 'c10', nome: 'Senior PM', trilha: 'Produto', trilhaId: 't2', nivel: 'L5', nivelId: 'n5', pessoas: 5, ativo: true },
  { id: 'c11', nome: 'Group PM', trilha: 'Produto', trilhaId: 't2', nivel: 'L6', nivelId: 'n6', pessoas: 2, ativo: true },
  { id: 'c12', nome: 'Director of Product', trilha: 'Produto', trilhaId: 't2', nivel: 'L7', nivelId: 'n7', pessoas: 1, ativo: true },
  
  // Design
  { id: 'c13', nome: 'Junior Designer', trilha: 'Design', trilhaId: 't3', nivel: 'L2', nivelId: 'n2', pessoas: 4, ativo: true },
  { id: 'c14', nome: 'Designer', trilha: 'Design', trilhaId: 't3', nivel: 'L3', nivelId: 'n3', pessoas: 6, ativo: true },
  { id: 'c15', nome: 'Senior Designer', trilha: 'Design', trilhaId: 't3', nivel: 'L4', nivelId: 'n4', pessoas: 4, ativo: true },
  { id: 'c16', nome: 'Design Lead', trilha: 'Design', trilhaId: 't3', nivel: 'L5', nivelId: 'n5', pessoas: 2, ativo: true },
  { id: 'c17', nome: 'Head of Design', trilha: 'Design', trilhaId: 't3', nivel: 'L6', nivelId: 'n6', pessoas: 1, ativo: true },
  
  // Dados
  { id: 'c18', nome: 'Data Analyst', trilha: 'Dados', trilhaId: 't4', nivel: 'L2', nivelId: 'n2', pessoas: 5, ativo: true },
  { id: 'c19', nome: 'Senior Data Analyst', trilha: 'Dados', trilhaId: 't4', nivel: 'L3', nivelId: 'n3', pessoas: 3, ativo: true },
  { id: 'c20', nome: 'Data Scientist', trilha: 'Dados', trilhaId: 't4', nivel: 'L4', nivelId: 'n4', pessoas: 4, ativo: true },
  { id: 'c21', nome: 'Senior Data Scientist', trilha: 'Dados', trilhaId: 't4', nivel: 'L5', nivelId: 'n5', pessoas: 2, ativo: true },
  { id: 'c22', nome: 'Data Engineering Lead', trilha: 'Dados', trilhaId: 't4', nivel: 'L6', nivelId: 'n6', pessoas: 1, ativo: true },
  
  // Marketing
  { id: 'c23', nome: 'Marketing Analyst', trilha: 'Marketing', trilhaId: 't5', nivel: 'L2', nivelId: 'n2', pessoas: 3, ativo: true },
  { id: 'c24', nome: 'Marketing Specialist', trilha: 'Marketing', trilhaId: 't5', nivel: 'L3', nivelId: 'n3', pessoas: 4, ativo: true },
  { id: 'c25', nome: 'Marketing Manager', trilha: 'Marketing', trilhaId: 't5', nivel: 'L4', nivelId: 'n4', pessoas: 2, ativo: true },
  { id: 'c26', nome: 'Senior Marketing Manager', trilha: 'Marketing', trilhaId: 't5', nivel: 'L5', nivelId: 'n5', pessoas: 1, ativo: true },
  
  // Operações
  { id: 'c27', nome: 'Operations Analyst', trilha: 'Operações', trilhaId: 't6', nivel: 'L2', nivelId: 'n2', pessoas: 4, ativo: true },
  { id: 'c28', nome: 'Operations Specialist', trilha: 'Operações', trilhaId: 't6', nivel: 'L3', nivelId: 'n3', pessoas: 5, ativo: true },
  { id: 'c29', nome: 'Operations Manager', trilha: 'Operações', trilhaId: 't6', nivel: 'L4', nivelId: 'n4', pessoas: 3, ativo: true },
  { id: 'c30', nome: 'Senior Operations Manager', trilha: 'Operações', trilhaId: 't6', nivel: 'L5', nivelId: 'n5', pessoas: 2, ativo: true },
  
  // Additional positions
  { id: 'c31', nome: 'Tech Lead', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L5', nivelId: 'n5', pessoas: 5, ativo: true },
  { id: 'c32', nome: 'Frontend Engineer', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L3', nivelId: 'n3', pessoas: 8, ativo: true },
  { id: 'c33', nome: 'Backend Engineer', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L3', nivelId: 'n3', pessoas: 10, ativo: true },
  { id: 'c34', nome: 'DevOps Engineer', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L4', nivelId: 'n4', pessoas: 4, ativo: true },
  { id: 'c35', nome: 'QA Engineer', trilha: 'Engenharia de Software', trilhaId: 't1', nivel: 'L3', nivelId: 'n3', pessoas: 6, ativo: true },
  { id: 'c36', nome: 'Product Designer', trilha: 'Design', trilhaId: 't3', nivel: 'L4', nivelId: 'n4', pessoas: 3, ativo: true },
  { id: 'c37', nome: 'UX Researcher', trilha: 'Design', trilhaId: 't3', nivel: 'L3', nivelId: 'n3', pessoas: 2, ativo: true },
  { id: 'c38', nome: 'Content Designer', trilha: 'Design', trilhaId: 't3', nivel: 'L3', nivelId: 'n3', pessoas: 2, ativo: true },
  { id: 'c39', nome: 'Growth PM', trilha: 'Produto', trilhaId: 't2', nivel: 'L4', nivelId: 'n4', pessoas: 2, ativo: true },
  { id: 'c40', nome: 'Technical PM', trilha: 'Produto', trilhaId: 't2', nivel: 'L5', nivelId: 'n5', pessoas: 3, ativo: true },
  { id: 'c41', nome: 'ML Engineer', trilha: 'Dados', trilhaId: 't4', nivel: 'L4', nivelId: 'n4', pessoas: 0, ativo: true },
  { id: 'c42', nome: 'Data Engineer (Deprecated)', trilha: 'Dados', trilhaId: 't4', nivel: 'L3', nivelId: 'n3', pessoas: 0, ativo: false },
]

const trackColors: Record<string, string> = {
  'Engenharia de Software': 'bg-blue-100 text-blue-800',
  'Produto': 'bg-purple-100 text-purple-800',
  'Design': 'bg-pink-100 text-pink-800',
  'Dados': 'bg-green-100 text-green-800',
  'Marketing': 'bg-yellow-100 text-yellow-800',
  'Operações': 'bg-orange-100 text-orange-800',
}

const mockPeople = [
  { id: '1', nome: 'Maria Santos', avatar: '/diverse-woman-portrait.png', time: 'Engenharia', desde: 'jan. 2023' },
  { id: '2', nome: 'João Silva', avatar: '/man.jpg', time: 'Produto', desde: 'mar. 2022' },
  { id: '3', nome: 'Ana Costa', avatar: '/tech-woman.png', time: 'Design', desde: 'jun. 2023' },
]

export default function CargosPage() {
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [viewPeopleModalOpen, setViewPeopleModalOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    trilha: '',
    nivel: '',
    ativo: true,
  })
  
  // Filters
  const [filters, setFilters] = useState({
    trilhas: [] as string[],
    niveis: [] as string[],
    status: 'todos',
    sortBy: 'nome',
  })

  const handleCreatePosition = () => {
    console.log('Creating position:', formData)
    setCreateModalOpen(false)
    setFormData({ nome: '', trilha: '', nivel: '', ativo: true })
    // Toast notification would go here
  }

  const handleEditPosition = () => {
    console.log('Editing position:', selectedPosition?.id, formData)
    setEditModalOpen(false)
    setSelectedPosition(null)
  }

  const handleDuplicatePosition = (position: any) => {
    setFormData({
      nome: `${position.nome} (cópia)`,
      trilha: position.trilha,
      nivel: position.nivel,
      ativo: true,
    })
    setCreateModalOpen(true)
  }

  const handleDeletePosition = () => {
    console.log('Deleting position:', selectedPosition?.id)
    setDeleteModalOpen(false)
    setSelectedPosition(null)
  }

  const handleViewPeople = (position: any) => {
    setSelectedPosition(position)
    setViewPeopleModalOpen(true)
  }

  const handleToggleStatus = (positionId: string) => {
    console.log('Toggling status for position:', positionId)
  }

  const filteredPositions = mockPositions.filter((pos) => {
    if (searchQuery && !pos.nome.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filters.trilhas.length > 0 && !filters.trilhas.includes(pos.trilha)) {
      return false
    }
    if (filters.niveis.length > 0 && !filters.niveis.includes(pos.nivel)) {
      return false
    }
    if (filters.status === 'ativos' && !pos.ativo) return false
    if (filters.status === 'inativos' && pos.ativo) return false
    return true
  })

  const stats = {
    total: mockPositions.length,
    ativos: mockPositions.filter((p) => p.ativo).length,
    inativos: mockPositions.filter((p) => !p.ativo).length,
    trilhas: new Set(mockPositions.map((p) => p.trilha)).size,
    niveisMin: 'L1',
    niveisMax: 'L8',
    totalNiveis: 8,
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>{'>'}</span>
            <Link href="/configuracoes" className="hover:text-foreground">
              Configurações
            </Link>
            <span>{'>'}</span>
            <span className="text-foreground">Cargos</span>
          </div>

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
                className="bg-[#FF7A00] hover:bg-[#FF7A00]/90"
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
                <Briefcase className="h-6 w-6 text-[#FF7A00]" />
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
                <TrendingUp className="h-6 w-6 text-[#00C8FF]" />
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
                      <Badge variant="secondary" className={trackColors[position.trilha]}>
                        {position.trilha}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{position.nivel}</Badge>
                    </TableCell>
                    <TableCell>
                      {position.pessoas > 0 ? (
                        <button
                          onClick={() => handleViewPeople(position)}
                          className="text-[#00C8FF] hover:underline"
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
                          <DropdownMenuItem onClick={() => handleViewPeople(position)}>
                            <Users className="mr-2 h-4 w-4" />
                            Ver Pessoas neste Cargo
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedPosition(position)
                              setFormData({
                                nome: position.nome,
                                trilha: position.trilha,
                                nivel: position.nivel,
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
                        <DropdownMenuItem onClick={() => handleViewPeople(position)}>
                          <Users className="mr-2 h-4 w-4" />
                          Ver Pessoas
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPosition(position)
                            setFormData({
                              nome: position.nome,
                              trilha: position.trilha,
                              nivel: position.nivel,
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
                    <Badge variant="secondary" className={trackColors[position.trilha]}>
                      {position.trilha}
                    </Badge>
                    <Badge variant="outline">{position.nivel}</Badge>
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
            setFormData({ nome: '', trilha: '', nivel: '', ativo: true })
          }
        }}>
          <DialogContent 
            onInteractOutside={() => {
              setCreateModalOpen(false)
              setEditModalOpen(false)
              setSelectedPosition(null)
              setFormData({ nome: '', trilha: '', nivel: '', ativo: true })
            }}
            onEscapeKeyDown={() => {
              setCreateModalOpen(false)
              setEditModalOpen(false)
              setSelectedPosition(null)
              setFormData({ nome: '', trilha: '', nivel: '', ativo: true })
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
                <Select value={formData.trilha} onValueChange={(value) => setFormData({ ...formData, trilha: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a trilha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engenharia de Software">Engenharia de Software</SelectItem>
                    <SelectItem value="Produto">Produto</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Dados">Dados</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operações">Operações</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nivel">Nível *</Label>
                <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'].map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
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

              {formData.nome && formData.trilha && formData.nivel && (
                <Card className="p-4 bg-muted">
                  <p className="text-sm font-medium mb-2">Preview</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={trackColors[formData.trilha]}>
                      {formData.trilha}
                    </Badge>
                    <span className="font-medium">
                      {formData.nome} ({formData.nivel})
                    </span>
                  </div>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateModalOpen(false)
                  setEditModalOpen(false)
                  setFormData({ nome: '', trilha: '', nivel: '', ativo: true })
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={editModalOpen ? handleEditPosition : handleCreatePosition}
                className="bg-[#FF7A00] hover:bg-[#FF7A00]/90"
                disabled={!formData.nome || !formData.trilha || !formData.nivel}
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
                {selectedPosition?.pessoas > 0 ? (
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
                onClick={handleDeletePosition}
                disabled={selectedPosition?.pessoas > 0}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View People Modal */}
        <Dialog open={viewPeopleModalOpen} onOpenChange={setViewPeopleModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Pessoas com este Cargo</DialogTitle>
              <DialogDescription>
                {selectedPosition?.nome} - {selectedPosition?.pessoas}{' '}
                {selectedPosition?.pessoas === 1 ? 'pessoa' : 'pessoas'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {mockPeople.map((person) => (
                <div key={person.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50">
                  <Avatar>
                    <AvatarImage src={person.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{person.nome.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{person.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {person.time} • Desde {person.desde}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Ver Perfil
                  </Button>
                </div>
              ))}
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
