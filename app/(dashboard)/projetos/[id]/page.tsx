'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Home, ChevronRight, ArrowLeft, Pencil, MoreVertical, Plus, Grid3x3, Table, Search, Users, Briefcase } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const mockProject = {
  id: 1,
  nome: 'Projeto Alpha',
  status: 'Ativo' as const,
  observacoes: 'Projeto estratégico da área de engenharia com foco em escalabilidade',
  dataCriacao: '15 de Janeiro, 2024',
  ultimaAtualizacao: '2 dias',
  pessoasAlocadas: [
    { id: 'p1', nome: 'Maria Santos', avatar: '/diverse-woman-portrait.png', cargo: 'Tech Lead', nivel: 'L6', time: 'Engenharia', timeColor: '#FF7A00' },
    { id: 'p2', nome: 'João Silva', avatar: '/man.jpg', cargo: 'Backend Developer', nivel: 'L3', time: 'Backend', timeColor: '#00C8FF' },
    { id: 'p3', nome: 'Ana Costa', avatar: '/tech-woman.png', cargo: 'Frontend Developer', nivel: 'L3', time: 'Frontend', timeColor: '#00C8FF' },
    { id: 'p4', nome: 'Pedro Lima', avatar: '/engineer-man.png', cargo: 'Senior Designer', nivel: 'L4', time: 'Design', timeColor: '#9333EA' },
    { id: 'p5', nome: 'Carla Mendes', avatar: '/developer-woman.png', cargo: 'QA Engineer', nivel: 'L3', time: 'Qualidade', timeColor: '#10B981' },
    { id: 'p6', nome: 'Roberto Alves', avatar: '/executive-man.png', cargo: 'Product Manager', nivel: 'L5', time: 'Produto', timeColor: '#F59E0B' },
    { id: 'p7', nome: 'Julia Mendes', avatar: '/data-scientist-woman.jpg', cargo: 'Data Analyst', nivel: 'L2', time: 'Dados', timeColor: '#8B5CF6' },
    { id: 'p8', nome: 'Lucas Oliveira', avatar: '/young-developer.png', cargo: 'DevOps Engineer', nivel: 'L4', time: 'Infraestrutura', timeColor: '#EF4444' },
  ],
}

export default function ProjetoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [removePersonModal, setRemovePersonModal] = useState<{ open: boolean; person: typeof mockProject.pessoasAlocadas[0] | null }>({
    open: false,
    person: null,
  })
  const [deleteProjectModal, setDeleteProjectModal] = useState(false)

  const filteredPeople = mockProject.pessoasAlocadas.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const uniqueTeams = Array.from(new Set(mockProject.pessoasAlocadas.map(p => p.time))).length
  const levels = mockProject.pessoasAlocadas.map(p => parseInt(p.nivel.substring(1)))
  const minLevel = Math.min(...levels)
  const maxLevel = Math.max(...levels)

  const handleRemovePerson = () => {
    console.log('Removendo pessoa:', removePersonModal.person?.nome)
    toast({
      title: 'Pessoa removida',
      description: `${removePersonModal.person?.nome} foi removida do projeto`,
    })
    setRemovePersonModal({ open: false, person: null })
  }

  const handleDeleteProject = () => {
    console.log('Excluindo projeto:', mockProject.nome)
    toast({
      title: 'Projeto excluído',
      description: 'O projeto foi excluído com sucesso',
    })
    router.push('/projetos')
  }

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Home className="w-4 h-4" />
            <Link href="/" className="hover:text-gray-900">Dashboard</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/projetos" className="hover:text-gray-900">Projetos</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{mockProject.nome}</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Link href="/projetos">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{mockProject.nome}</h1>
                <Badge className="bg-green-100 text-green-800 border-green-200 mt-2">
                  {mockProject.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/projetos/${params.id}/editar`}>
                <Button variant="outline">
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar Projeto
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log('Adicionar pessoas')}>
                    Adicionar Pessoas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Duplicar projeto')}>
                    Duplicar Projeto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Ativar/Desativar')}>
                    {mockProject.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setDeleteProjectModal(true)}
                  >
                    Excluir Projeto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Project Info Card */}
        {mockProject.observacoes && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Observações</p>
                <p className="text-gray-600">{mockProject.observacoes}</p>
              </div>
              <div className="flex gap-8 text-sm">
                <div>
                  <span className="text-gray-600">Criado em </span>
                  <span className="font-medium">{mockProject.dataCriacao}</span>
                </div>
                <div>
                  <span className="text-gray-600">Última atualização </span>
                  <span className="font-medium">há {mockProject.ultimaAtualizacao}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pessoas</p>
                <p className="text-3xl font-bold text-gray-900">{mockProject.pessoasAlocadas.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Times Representados</p>
                <p className="text-3xl font-bold text-gray-900">{uniqueTeams}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Níveis</p>
                <p className="text-3xl font-bold text-gray-900">L{minLevel} ao L{maxLevel}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Team Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Equipe Alocada</h2>
              <Badge variant="outline">{mockProject.pessoasAlocadas.length} pessoas</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('cards')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('table')}
                >
                  <Table className="w-4 h-4" />
                </Button>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => console.log('Adicionar pessoas')}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Pessoas
              </Button>
            </div>
          </div>

          {/* Cards View */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPeople.map((pessoa) => (
                <Card
                  key={pessoa.id}
                  className="p-6 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer relative"
                  onClick={() => router.push(`/pessoas/${pessoa.id}`)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      setRemovePersonModal({ open: true, person: pessoa })
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="w-16 h-16 mb-3">
                      <AvatarImage src={pessoa.avatar || "/placeholder.svg"} alt={pessoa.nome} />
                      <AvatarFallback className="bg-orange-100 text-orange-700 text-lg">
                        {pessoa.nome.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-gray-900 mb-1">{pessoa.nome}</h3>
                    <p className="text-sm text-gray-600 mb-3">{pessoa.cargo}</p>
                    <Badge
                      variant="outline"
                      style={{ backgroundColor: `${pessoa.timeColor}20`, borderColor: pessoa.timeColor, color: pessoa.timeColor }}
                    >
                      {pessoa.time}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Table View */
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-gray-700">Nome</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-700">Cargo</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-700">Nível</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-700">Time Atual</th>
                      <th className="text-left p-4 text-sm font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPeople.map((pessoa) => (
                      <tr
                        key={pessoa.id}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/pessoas/${pessoa.id}`)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={pessoa.avatar || "/placeholder.svg"} alt={pessoa.nome} />
                              <AvatarFallback className="bg-orange-100 text-orange-700">
                                {pessoa.nome.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{pessoa.nome}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{pessoa.cargo}</td>
                        <td className="p-4">
                          <Badge variant="outline">{pessoa.nivel}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            style={{ backgroundColor: `${pessoa.timeColor}20`, borderColor: pessoa.timeColor, color: pessoa.timeColor }}
                          >
                            {pessoa.time}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                Ações
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/pessoas/${pessoa.id}`)}>
                                Ver Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setRemovePersonModal({ open: true, person: pessoa })}
                              >
                                Remover do Projeto
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
        </div>
      </div>

      {/* Remove Person Modal */}
      <Dialog open={removePersonModal.open} onOpenChange={(open) => setRemovePersonModal({ open, person: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover {removePersonModal.person?.nome}?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta pessoa do projeto?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovePersonModal({ open: false, person: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemovePerson}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Modal */}
      <Dialog open={deleteProjectModal} onOpenChange={setDeleteProjectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Projeto?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este projeto?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-orange-600 font-medium">
              {mockProject.pessoasAlocadas.length} pessoas estão alocadas e serão desalocadas
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProjectModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Excluir Projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
