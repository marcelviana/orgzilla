'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Plus, Grid3x3, List, FolderKanban, Users, MoreVertical, Search } from 'lucide-react'
import { TableSkeleton, Breadcrumb } from '@/components/shared'
import { getProjetos, softDeleteProjeto, type ProjetoListItem } from '@/app/actions/projetos.actions'
import { handleError } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'

const statusColors = {
  Ativo: 'bg-green-100 text-green-800 border-green-200',
  Inativo: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function ProjetosPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [projetos, setProjetos] = useState<ProjetoListItem[]>([])

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

  const handleDeleteProjeto = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente desativar o projeto "${nome}"?`)) {
      return
    }

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Breadcrumb className="mb-2" items={[{ label: "Dashboard", href: "/" }, { label: "Projetos" }]} />
            <h1 className="text-3xl font-bold text-gray-900">Projetos e Produtos</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Link href="/projetos/novo">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Novo Projeto
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Projetos</p>
                <p className="text-3xl font-bold text-gray-900">{projetos.length}</p>
                <p className="text-sm text-gray-600 mt-2">{projetosAtivos} ativos, {projetosInativos} inativos</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Alocações</p>
                <p className="text-3xl font-bold text-gray-900">{totalPessoas}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {projetos.reduce((acc, p) => acc + p.pessoas_ativas, 0)} alocações ativas
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Projects Grid */}
        {viewMode === 'grid' ? (
          filteredProjects.length === 0 ? (
            <Card className="p-12 text-center">
              <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro projeto'}
              </p>
              {!searchTerm && (
                <Link href="/projetos/novo">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Projeto
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{project.nome}</h3>
                      <Badge
                        className={
                          statusColors[project.ativo ? 'Ativo' : 'Inativo']
                        }
                      >
                        {project.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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
                            onClick={() => { void handleDeleteProjeto(project.id, project.nome) }}
                          >
                            Desativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="border-t pt-4 mb-4" />

                  <div className="flex-grow">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Alocações</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total de alocações</span>
                        <span className="text-lg font-bold text-gray-900">
                          {project.total_pessoas}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Alocações ativas</span>
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
                <div className="p-12 text-center">
                  <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando seu primeiro projeto'}
                  </p>
                  {!searchTerm && (
                    <Link href="/projetos/novo">
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Projeto
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-gray-700">Nome</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-700">Alocações</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-semibold text-gray-900">{project.nome}</p>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={
                              statusColors[project.ativo ? 'Ativo' : 'Inativo']
                            }
                          >
                            {project.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900">
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
                                onClick={() => { void handleDeleteProjeto(project.id, project.nome) }}
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
    </DashboardShell>
  )
}
