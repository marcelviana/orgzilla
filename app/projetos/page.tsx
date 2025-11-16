'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Plus, Grid3x3, List, FolderKanban, Users, MoreVertical, Home, ChevronRight, Search } from 'lucide-react'

// Mock data
const mockProjects = [
  {
    id: 1,
    nome: 'Projeto Alpha',
    status: 'Ativo',
    pessoasAlocadas: [
      { nome: 'Maria Santos', avatar: '/diverse-woman-portrait.png' },
      { nome: 'João Silva', avatar: '/man.jpg' },
      { nome: 'Ana Costa', avatar: '/tech-woman.png' },
      { nome: 'Pedro Lima', avatar: '/engineer-man.png' },
      { nome: 'Carla Mendes', avatar: '/developer-woman.png' },
    ],
  },
  {
    id: 2,
    nome: 'Sistema Core',
    status: 'Ativo',
    pessoasAlocadas: [
      { nome: 'Roberto Alves', avatar: '/executive-man.png' },
      { nome: 'Julia Mendes', avatar: '/data-scientist-woman.jpg' },
      { nome: 'Lucas Oliveira', avatar: '/young-developer.png' },
    ],
  },
  {
    id: 3,
    nome: 'App Mobile',
    status: 'Ativo',
    pessoasAlocadas: [
      { nome: 'Sofia Oliveira', avatar: '/junior-developer-woman.jpg' },
      { nome: 'Bruno Alves', avatar: '/developer-man.png' },
    ],
  },
  {
    id: 4,
    nome: 'Portal do Cliente',
    status: 'Ativo',
    pessoasAlocadas: [
      { nome: 'Fernanda Costa', avatar: '/tech-woman.png' },
      { nome: 'Carlos Silva', avatar: '/engineer-man.png' },
      { nome: 'Amanda Lima', avatar: '/developer-woman.png' },
      { nome: 'Ricardo Santos', avatar: '/man.jpg' },
    ],
  },
  {
    id: 5,
    nome: 'API Gateway',
    status: 'Ativo',
    pessoasAlocadas: [
      { nome: 'Paulo Mendes', avatar: '/executive-man.png' },
      { nome: 'Beatriz Alves', avatar: '/data-scientist-woman.jpg' },
      { nome: 'Thiago Costa', avatar: '/young-developer.png' },
    ],
  },
  {
    id: 6,
    nome: 'Data Warehouse',
    status: 'Pausado',
    pessoasAlocadas: [
      { nome: 'Mariana Silva', avatar: '/junior-developer-woman.jpg' },
      { nome: 'Felipe Santos', avatar: '/developer-man.png' },
    ],
  },
  {
    id: 7,
    nome: 'Integração ERP',
    status: 'Ativo',
    pessoasAlocadas: [
      { nome: 'Gustavo Lima', avatar: '/engineer-man.png' },
      { nome: 'Camila Oliveira', avatar: '/tech-woman.png' },
      { nome: 'Rafael Costa', avatar: '/man.jpg' },
      { nome: 'Juliana Mendes', avatar: '/diverse-woman-portrait.png' },
    ],
  },
  {
    id: 8,
    nome: 'Redesign UI/UX',
    status: 'Planejamento',
    pessoasAlocadas: [
      { nome: 'Isabela Santos', avatar: '/developer-woman.png' },
      { nome: 'Leonardo Alves', avatar: '/young-developer.png' },
    ],
  },
  {
    id: 9,
    nome: 'Microserviços',
    status: 'Ativo',
    pessoasAlocadas: [
      { nome: 'Eduardo Costa', avatar: '/executive-man.png' },
      { nome: 'Patricia Lima', avatar: '/data-scientist-woman.jpg' },
      { nome: 'Diego Silva', avatar: '/developer-man.png' },
      { nome: 'Vanessa Mendes', avatar: '/junior-developer-woman.jpg' },
      { nome: 'André Santos', avatar: '/engineer-man.png' },
    ],
  },
  {
    id: 10,
    nome: 'Sistema de Notificações',
    status: 'Ativo',
    pessoasAlocadas: [
      { nome: 'Rodrigo Oliveira', avatar: '/man.jpg' },
      { nome: 'Larissa Costa', avatar: '/tech-woman.png' },
      { nome: 'Marcelo Lima', avatar: '/young-developer.png' },
    ],
  },
  {
    id: 11,
    nome: 'Plataforma E-learning',
    status: 'Concluído',
    pessoasAlocadas: [
      { nome: 'Gabriela Santos', avatar: '/diverse-woman-portrait.png' },
      { nome: 'Fernando Alves', avatar: '/executive-man.png' },
    ],
  },
  {
    id: 12,
    nome: 'Chatbot IA',
    status: 'Planejamento',
    pessoasAlocadas: [
      { nome: 'Vitor Costa', avatar: '/developer-man.png' },
    ],
  },
]

const statusColors = {
  Ativo: 'bg-green-100 text-green-800 border-green-200',
  Planejamento: 'bg-blue-100 text-blue-800 border-blue-200',
  Pausado: 'bg-orange-100 text-orange-800 border-orange-200',
  Concluído: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function ProjetosPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredProjects = mockProjects.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPessoas = mockProjects.reduce((acc, p) => acc + p.pessoasAlocadas.length, 0)
  const projetosAtivos = mockProjects.filter((p) => p.status === 'Ativo').length
  const projetosInativos = mockProjects.filter((p) => p.status === 'Pausado' || p.status === 'Concluído').length

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Projetos</span>
            </div>
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
                <p className="text-3xl font-bold text-gray-900">{mockProjects.length}</p>
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
                <p className="text-sm text-gray-600 mb-1">Pessoas Alocadas</p>
                <p className="text-3xl font-bold text-gray-900">{totalPessoas}</p>
                <p className="text-sm text-gray-600 mt-2">37% do time total</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Projects Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="p-6 hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{project.nome}</h3>
                    <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                      {project.status}
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
                      <DropdownMenuItem asChild>
                        <Link href={`/projetos/${project.id}/editar`}>Editar</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log('Duplicar:', project.nome)}>
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => console.log('Excluir:', project.nome)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="border-t pt-4 mb-4" />

                <div className="flex-grow">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Equipe Alocada</p>
                  {project.pessoasAlocadas.length > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {project.pessoasAlocadas.slice(0, 6).map((pessoa, idx) => (
                          <Avatar key={idx} className="w-10 h-10 border-2 border-white">
                            <AvatarImage src={pessoa.avatar || "/placeholder.svg"} alt={pessoa.nome} />
                            <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                              {pessoa.nome.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {project.pessoasAlocadas.length > 6 && (
                        <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                          +{project.pessoasAlocadas.length - 6}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma pessoa alocada</p>
                  )}
                  <p className="text-sm text-gray-600 mt-3">{project.pessoasAlocadas.length} pessoas</p>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Link href={`/projetos/${project.id}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full">
                      Ver Detalhes
                    </Button>
                  </Link>
                  <Link href={`/projetos/${project.id}/editar`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full">
                      Gerenciar Equipe
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Nome</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Pessoas</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <p className="font-semibold text-gray-900">{project.nome}</p>
                      </td>
                      <td className="p-4">
                        <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                          {project.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {project.pessoasAlocadas.slice(0, 4).map((pessoa, idx) => (
                              <Avatar key={idx} className="w-8 h-8 border-2 border-white">
                                <AvatarImage src={pessoa.avatar || "/placeholder.svg"} alt={pessoa.nome} />
                                <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                                  {pessoa.nome.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {project.pessoasAlocadas.length > 4 && (
                              <div className="w-8 h-8 rounded-full bg-orange-500 text-white border-2 border-white flex items-center justify-center text-xs font-semibold">
                                +{project.pessoasAlocadas.length - 4}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-600">{project.pessoasAlocadas.length} pessoas</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link href={`/projetos/${project.id}`}>
                            <Button variant="ghost" size="sm">Ver</Button>
                          </Link>
                          <Link href={`/projetos/${project.id}/editar`}>
                            <Button variant="ghost" size="sm">Editar</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
