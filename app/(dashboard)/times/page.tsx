'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, LayoutGrid, Network, TableIcon, Users, Briefcase, FolderKanban, MoreVertical, ChevronDown, ChevronRight, Edit, Eye, Trash2, Filter, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'

type Team = {
  id: number
  nome: string
  descricao: string
  gestor: { nome: string; avatar: string }
  numeroPessoas: number
  vagasAbertas: number
  projetos: number
  ativo: boolean
  timesFilhos: Team[]
}

const MOCK_TEAMS: Team[] = [
  {
    id: 1,
    nome: 'Tecnologia',
    descricao: 'Toda área de tecnologia e engenharia',
    gestor: { nome: 'Carlos Silva', avatar: '/avatar-carlos.jpg' },
    numeroPessoas: 45,
    vagasAbertas: 3,
    projetos: 8,
    ativo: true,
    timesFilhos: [
      {
        id: 2,
        nome: 'Engenharia',
        descricao: 'Desenvolvimento de software',
        gestor: { nome: 'Maria Santos', avatar: '/avatar-maria.jpg' },
        numeroPessoas: 35,
        vagasAbertas: 2,
        projetos: 6,
        ativo: true,
        timesFilhos: [
          {
            id: 3,
            nome: 'Frontend',
            descricao: 'Interfaces web e mobile',
            gestor: { nome: 'Ana Costa', avatar: '/avatar-ana.jpg' },
            numeroPessoas: 15,
            vagasAbertas: 1,
            projetos: 3,
            ativo: true,
            timesFilhos: [],
          },
          {
            id: 4,
            nome: 'Backend',
            descricao: 'APIs e microserviços',
            gestor: { nome: 'Pedro Lima', avatar: '/avatar-pedro.jpg' },
            numeroPessoas: 20,
            vagasAbertas: 1,
            projetos: 3,
            ativo: true,
            timesFilhos: [],
          },
        ],
      },
      {
        id: 5,
        nome: 'Dados',
        descricao: 'Analytics e Data Science',
        gestor: { nome: 'Julia Mendes', avatar: '/avatar-julia.jpg' },
        numeroPessoas: 10,
        vagasAbertas: 1,
        projetos: 2,
        ativo: true,
        timesFilhos: [],
      },
    ],
  },
  {
    id: 6,
    nome: 'Produto',
    descricao: 'Product Management e UX',
    gestor: { nome: 'Roberto Alves', avatar: '/avatar-roberto.jpg' },
    numeroPessoas: 18,
    vagasAbertas: 2,
    projetos: 5,
    ativo: true,
    timesFilhos: [
      {
        id: 7,
        nome: 'Design',
        descricao: 'UX/UI Design',
        gestor: { nome: 'Sofia Oliveira', avatar: '/avatar-sofia.jpg' },
        numeroPessoas: 8,
        vagasAbertas: 1,
        projetos: 3,
        ativo: true,
        timesFilhos: [],
      },
    ],
  },
]

type ViewMode = 'cards' | 'tree' | 'table'

export default function TimesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [gestorFilter, setGestorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set([1, 2, 6]))

  const toggleTeamExpansion = (teamId: number) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  const filterTeams = (teams: Team[], query: string): Team[] => {
    return teams.filter((team) => {
      const matchesSearch = team.nome.toLowerCase().includes(query.toLowerCase()) ||
        team.gestor.nome.toLowerCase().includes(query.toLowerCase())
      const matchesGestor = gestorFilter === 'all' || team.gestor.nome === gestorFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && team.ativo) ||
        (statusFilter === 'inactive' && !team.ativo)

      if (matchesSearch && matchesGestor && matchesStatus) {
        return true
      }

      // Check children recursively
      const filteredChildren = filterTeams(team.timesFilhos, query)
      return filteredChildren.length > 0
    }).map((team) => ({
      ...team,
      timesFilhos: filterTeams(team.timesFilhos, query),
    }))
  }

  const filteredTeams = filterTeams(MOCK_TEAMS, searchQuery)

  const flattenTeams = (teams: Team[], level = 0): Array<Team & { level: number }> => {
    return teams.flatMap((team) => [
      { ...team, level },
      ...flattenTeams(team.timesFilhos, level + 1),
    ])
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Dashboard &gt; Times</div>
            <h1 className="text-3xl font-bold text-foreground">Times</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar times..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-[240px]"
              />
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="h-8 w-8 p-0"
              >
                <Network className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 w-8 p-0"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>

            {/* Add Team */}
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 h-9"
            >
              <Link href="/times/novo">
                <Plus className="h-4 w-4 mr-2" />
                Criar Time
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        {showFilters && (
          <Card className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Gestor</label>
                <Select value={gestorFilter} onValueChange={setGestorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os gestores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os gestores</SelectItem>
                    <SelectItem value="Carlos Silva">Carlos Silva</SelectItem>
                    <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                    <SelectItem value="Roberto Alves">Roberto Alves</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGestorFilter('all')
                    setStatusFilter('all')
                    setSearchQuery('')
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Content based on view mode */}
        {viewMode === 'cards' && (
          <CardsView
            teams={filteredTeams}
            expandedTeams={expandedTeams}
            toggleTeamExpansion={toggleTeamExpansion}
          />
        )}

        {viewMode === 'tree' && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Network className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Vista em árvore em desenvolvimento</p>
            </div>
          </div>
        )}

        {viewMode === 'table' && <TableView teams={flattenTeams(filteredTeams)} />}

        {/* Empty State */}
        {filteredTeams.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-center">
              <div className="text-6xl mb-4">🦖</div>
              <h3 className="text-lg font-semibold mb-2">Nenhum time encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou criar um novo time
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function CardsView({
  teams,
  expandedTeams,
  toggleTeamExpansion,
  level = 0,
}: {
  teams: Team[]
  expandedTeams: Set<number>
  toggleTeamExpansion: (id: number) => void
  level?: number
}) {
  return (
    <div className="space-y-3">
      {teams.map((team) => (
        <div key={team.id} style={{ marginLeft: `${level * 32}px` }}>
          {/* Connector Line */}
          {level > 0 && (
            <div
              className="absolute w-8 h-px bg-border"
              style={{ left: `${(level - 1) * 32 + 16}px`, marginTop: '24px' }}
            />
          )}

          <Card className="p-4 hover:shadow-md transition-all hover:scale-[1.01] cursor-pointer">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2 flex-1">
                  {team.timesFilhos.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTeamExpansion(team.id)
                      }}
                      className="h-6 w-6 p-0 shrink-0"
                    >
                      {expandedTeams.has(team.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">{team.nome}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs text-white">
                        <Users className="h-3 w-3 mr-1" />
                        {team.numeroPessoas} pessoas
                      </Badge>
                      {team.timesFilhos.length > 0 && (
                        <Badge variant="secondary" className="text-xs text-white">
                          <Network className="h-3 w-3 mr-1" />
                          {team.timesFilhos.length} times
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <p className="text-sm text-muted-foreground line-clamp-2">{team.descricao}</p>

              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={team.gestor.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{team.gestor.nome.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  <span className="text-muted-foreground">Gestor:</span>{' '}
                  <span className="font-medium">{team.gestor.nome}</span>
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>Vagas abertas: {team.vagasAbertas}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <FolderKanban className="h-4 w-4" />
                  <span>Projetos: {team.projetos}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                >
                  <Link href={`/times/${team.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                >
                  <Link href={`/times/${team.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/times/${team.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/times/${team.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => console.log('Delete team', team.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>

          {/* Render children if expanded */}
          {expandedTeams.has(team.id) && team.timesFilhos.length > 0 && (
            <div className="mt-3">
              <CardsView
                teams={team.timesFilhos}
                expandedTeams={expandedTeams}
                toggleTeamExpansion={toggleTeamExpansion}
                level={level + 1}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function TableView({ teams }: { teams: Array<Team & { level: number }> }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Gestor</TableHead>
            <TableHead className="text-center">Pessoas</TableHead>
            <TableHead className="text-center">Vagas</TableHead>
            <TableHead className="text-center">Projetos</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2" style={{ paddingLeft: `${team.level * 24}px` }}>
                  {team.level > 0 && (
                    <div className="w-4 h-px bg-border" />
                  )}
                  <span className="font-medium">{team.nome}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={team.gestor.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {team.gestor.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{team.gestor.nome}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">{team.numeroPessoas}</TableCell>
              <TableCell className="text-center">{team.vagasAbertas}</TableCell>
              <TableCell className="text-center">{team.projetos}</TableCell>
              <TableCell className="text-center">
                <Badge variant={team.ativo ? 'default' : 'secondary'} className="text-xs">
                  {team.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/times/${team.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/times/${team.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => console.log('Delete team', team.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
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
  )
}
