'use client'

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
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
import { Plus, LayoutGrid, Network, TableIcon, Users, Briefcase, FolderKanban, MoreVertical, ChevronDown, ChevronRight, Edit, Eye, Trash2, Filter } from 'lucide-react'
import { TableSkeleton } from '@/components/shared/loading-state'
import { PageHeader, EmptyState, ConfirmDialog, SearchInput } from '@/components/shared'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { handleError } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'
import {
  getTimesHierarquia,
  getGestoresParaFiltro,
  softDeleteTime,
  type TimeComEstatisticas,
  type TimeHierarquico,
} from '@/app/actions/times.actions'
import Link from 'next/link'

type Team = TimeComEstatisticas & {
  gestor: { nome: string; avatar: string | null } | null
  numeroPessoas: number
  vagasAbertas: number
  projetos: number
  timesFilhos: Team[]
}

function mapTimeHierarquicoToTeam(h: TimeHierarquico): Team {
  return {
    ...h,
    gestor: h.gestor
      ? { nome: h.gestor.nome, avatar: null }
      : null,
    numeroPessoas: h.membros,
    vagasAbertas: h.vagas,
    projetos: 0,
    timesFilhos: h.filhos.map(mapTimeHierarquicoToTeam),
  } as Team
}

type ViewMode = 'cards' | 'tree' | 'table'

export default function TimesPage() {
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [gestores, setGestores] = useState<Array<{ id: string; nome: string }>>([])
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [gestorFilter, setGestorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [timeToDelete, setTimeToDelete] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchAll() {
      setLoading(true)
      try {
        const [timesResult, gestoresResult] = await Promise.all([
          getTimesHierarquia(),
          getGestoresParaFiltro(),
        ])

        if (controller.signal.aborted) return

        if (timesResult.success && timesResult.data) {
          setTeams(timesResult.data.map(mapTimeHierarquicoToTeam))
        } else {
          toast.error(String(timesResult.error ?? 'Erro ao carregar times'))
        }

        if (gestoresResult.success && gestoresResult.data) {
          setGestores(gestoresResult.data)
        }
      } catch (error) {
        if (controller.signal.aborted) return
        toast.error(handleError(error, 'database'))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void fetchAll()
    return () => controller.abort()
  }, [])

  async function handleDelete(timeId: string) {
    try {
      const result = await softDeleteTime(timeId)
      if (result.success) {
        toast.successDino('Time desativado com sucesso!')
        const timesResult = await getTimesHierarquia()
        if (timesResult.success && timesResult.data) {
          setTeams(timesResult.data.map(mapTimeHierarquicoToTeam))
        }
      } else {
        toast.error(handleError(new Error(result.error ?? 'Erro ao desativar time'), 'database'))
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    } finally {
      setDeleteDialogOpen(false)
      setTimeToDelete(null)
    }
  }

  function confirmDelete(timeId: string) {
    setTimeToDelete(timeId)
    setDeleteDialogOpen(true)
  }

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  const filterTeams = (teams: Team[] | undefined, query: string): Team[] => {
    // Guard against undefined or null
    if (!teams || !Array.isArray(teams)) {
      return []
    }

    return teams.filter((team) => {
      const gestorNome = team.gestor?.nome || ''
      const matchesSearch = team.nome.toLowerCase().includes(query.toLowerCase()) ||
        gestorNome.toLowerCase().includes(query.toLowerCase())
      const matchesGestor = gestorFilter === 'all' || gestorNome === gestorFilter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && team.ativo) ||
        (statusFilter === 'inactive' && !team.ativo)

      if (matchesSearch && matchesGestor && matchesStatus) {
        return true
      }

      // Check children recursively (handle undefined timesFilhos)
      const filteredChildren = filterTeams(team.timesFilhos, query)
      return filteredChildren.length > 0
    }).map((team) => ({
      ...team,
      timesFilhos: filterTeams(team.timesFilhos, query),
    }))
  }

  const filteredTeams = filterTeams(teams, searchQuery)

  const flattenTeams = (teams: Team[] | undefined, level = 0): Array<Team & { level: number }> => {
    // Guard against undefined or null
    if (!teams || !Array.isArray(teams)) {
      return []
    }

    return teams.flatMap((team) => [
      { ...team, level },
      ...flattenTeams(team.timesFilhos, level + 1),
    ])
  }

  // Show loading state
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
          title="Times"
          breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Times" }]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <SearchInput
              placeholder="Buscar times..."
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              className="flex-1 sm:flex-initial sm:w-[240px]"
            />

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
            <Button asChild className="h-9">
              <Link href="/times/novo">
                <Plus className="h-4 w-4 mr-2" />
                Criar time
              </Link>
            </Button>
            </div>
          }
        />

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
                    {gestores.map((gestor) => (
                      <SelectItem key={gestor.id} value={gestor.nome}>
                        {gestor.nome}
                      </SelectItem>
                    ))}
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
            confirmDelete={confirmDelete}
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

        {viewMode === 'table' && (
          <TableView
            teams={flattenTeams(filteredTeams)}
            confirmDelete={confirmDelete}
          />
        )}

        {/* Empty State */}
        {filteredTeams.length === 0 && (
          <EmptyState
            illustration="search"
            title="Nenhum time encontrado"
            description="Tente ajustar os filtros ou crie um novo time."
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Desativar time?"
          description="O time será desativado. Você pode reativá-lo depois."
          variant="danger"
          confirmText="Desativar"
          onConfirm={() => { if (timeToDelete) void handleDelete(timeToDelete) }}
        />
      </div>
    </DashboardShell>
  )
}

function CardsView({
  teams,
  expandedTeams,
  toggleTeamExpansion,
  confirmDelete,
  level = 0,
}: {
  teams: Team[]
  expandedTeams: Set<string>
  toggleTeamExpansion: (id: string) => void
  confirmDelete: (id: string) => void
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

              {team.gestor && (
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
              )}

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
                      onClick={() => confirmDelete(team.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Desativar
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
                confirmDelete={confirmDelete}
                level={level + 1}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function TableView({
  teams,
  confirmDelete,
}: {
  teams: Array<Team & { level: number }>
  confirmDelete: (id: string) => void
}) {
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
                {team.gestor ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={team.gestor.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {team.gestor.nome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{team.gestor.nome}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Sem gestor</span>
                )}
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
                      onClick={() => confirmDelete(team.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Desativar
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
