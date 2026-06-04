'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Grid3x3, List, FolderKanban, Users, MoreVertical } from 'lucide-react'
import { TableSkeleton, PageHeader, StatusBadge, ConfirmDialog, EmptyState, SearchInput, StatsCard } from '@/components/shared'
import { getProjetos, softDeleteProjeto, type ProjetoListItem } from '@/app/actions/projetos.actions'
import { handleError } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'

export default function ProjetosPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [projetos, setProjetos] = useState<ProjetoListItem[]>([])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome: string } | null>(null)

  async function loadProjetos() {
    try {
      const result = await getProjetos()
      if (result.success && result.data) {
        setProjetos(result.data)
      } else if (!result.success) {
        toast.error(result.error ?? 'Erro ao carregar projetos')
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    } finally {
      setIsLoading(false)
    }
  }

  // Load projetos on mount — setState apenas em callbacks async para satisfazer set-state-in-effect
  useEffect(() => {
    void getProjetos()
      .then((result) => {
        if (result.success && result.data) {
          setProjetos(result.data)
        } else if (!result.success) {
          toast.error(result.error ?? 'Erro ao carregar projetos')
        }
      })
      .catch((error: unknown) => {
        toast.error(handleError(error, 'database'))
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const handleDeleteProjeto = async (id: string) => {
    try {
      const result = await softDeleteProjeto(id)
      if (result.success) {
        toast.successDino('Projeto desativado com sucesso!')
        await loadProjetos()
      } else {
        toast.error(result.error ?? 'Erro ao desativar projeto')
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    }
  }

  const filteredProjects = projetos.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPessoas = projetos.reduce((acc, p) => acc + p.total_pessoas, 0)
  const projetosAtivos = projetos.filter((p) => p.ativo).length
  const projetosInativos = projetos.filter((p) => !p.ativo).length

  // Loading state
  if (isLoading) {
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="Projetos e Produtos"
          breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Projetos" }]}
          actions={
            <div className="flex items-center gap-3">
              <SearchInput
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={() => setSearchTerm('')}
                className="w-64"
              />
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  aria-label="Visualização em grade"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  aria-label="Visualização em lista"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Link href="/projetos/novo">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Projeto
                </Button>
              </Link>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatsCard
            title="Total de Projetos"
            value={projetos.length}
            icon={<FolderKanban className="h-6 w-6" />}
            iconWrapperClassName="bg-primary/10 text-primary"
            subtext={`${projetosAtivos} ativos, ${projetosInativos} inativos`}
          />
          <StatsCard
            title="Total de Alocações"
            value={totalPessoas}
            icon={<Users className="h-6 w-6" />}
            iconWrapperClassName="bg-accent/10 text-accent"
            subtext={`${projetos.reduce((acc, p) => acc + p.pessoas_ativas, 0)} alocações ativas`}
          />
        </div>

        {/* Projects Grid */}
        {viewMode === 'grid' ? (
          filteredProjects.length === 0 ? (
            searchTerm ? (
              <EmptyState
                illustration="search"
                title="Nenhum projeto encontrado"
                description="Tente ajustar os filtros de busca."
              />
            ) : (
              <EmptyState
                title="Nenhum projeto cadastrado"
                description="Comece criando seu primeiro projeto."
                action={{ label: "Novo projeto", onClick: () => router.push('/projetos/novo') }}
              />
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{project.nome}</h3>
                      <StatusBadge status={project.ativo ? 'Ativo' : 'Inativo'} />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações do projeto">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/projetos/${project.id}`}>Ver Detalhes</Link>
                        </DropdownMenuItem>
                        {project.ativo && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteTarget({ id: project.id, nome: project.nome })}
                          >
                            Desativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="border-t pt-4 mb-4" />

                  <div className="flex-grow">
                    <p className="text-sm font-semibold text-foreground mb-3">Alocações</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total de alocações</span>
                        <span className="text-lg font-bold text-foreground">
                          {project.total_pessoas}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Alocações ativas</span>
                        <span className="text-sm font-semibold text-green-600">
                          {project.pessoas_ativas}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Link href={`/projetos/${project.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          /* List View */
          <Card>
            <div className="overflow-x-auto">
              {filteredProjects.length === 0 ? (
                searchTerm ? (
                  <EmptyState
                    illustration="search"
                    title="Nenhum projeto encontrado"
                    description="Tente ajustar os filtros de busca."
                  />
                ) : (
                  <EmptyState
                    title="Nenhum projeto cadastrado"
                    description="Comece criando seu primeiro projeto."
                    action={{ label: "Novo projeto", onClick: () => router.push('/projetos/novo') }}
                  />
                )
              ) : (
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-foreground">Nome</th>
                      <th className="text-left p-4 text-sm font-semibold text-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-foreground">Alocações</th>
                      <th className="text-left p-4 text-sm font-semibold text-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-semibold text-foreground">{project.nome}</p>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={project.ativo ? 'Ativo' : 'Inativo'} />
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="text-sm text-foreground">
                              <span className="font-semibold">{project.total_pessoas}</span> total
                            </div>
                            <div className="text-xs text-green-600">
                              {project.pessoas_ativas} ativas
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Link href={`/projetos/${project.id}`}>
                              <Button variant="ghost" size="sm">
                                Ver Detalhes
                              </Button>
                            </Link>
                            {project.ativo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => setDeleteTarget({ id: project.id, nome: project.nome })}
                              >
                                Desativar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title="Desativar projeto?"
        description={deleteTarget ? `O projeto "${deleteTarget.nome}" será desativado e deixará de aparecer nas listagens.` : ''}
        variant="danger"
        confirmText="Desativar"
        onConfirm={() => { if (deleteTarget) void handleDeleteProjeto(deleteTarget.id) }}
      />
    </DashboardShell>
  )
}
