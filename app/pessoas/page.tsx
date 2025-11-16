'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Download, Plus, ChevronDown, ChevronUp, MoreVertical, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { DashboardShell } from '@/components/dashboard-shell'

// Mock data
const MOCK_PEOPLE = [
  { id: 1, nome: "Maria Santos", email: "maria@orgzilla.com", cargo: "Senior Engineer", nivel: "L4", time: "Engenharia", status: "Ativo", dataEntrada: "2023-01-15", avatar: "/diverse-woman-portrait.png" },
  { id: 2, nome: "João Silva", email: "joao@orgzilla.com", cargo: "Product Manager", nivel: "L3", time: "Produto", status: "Ativo", dataEntrada: "2022-06-20", avatar: "/man.jpg" },
  { id: 3, nome: "Ana Costa", email: "ana@orgzilla.com", cargo: "Designer", nivel: "L2", time: "Design", status: "Férias", dataEntrada: "2024-02-10", avatar: "/diverse-woman-portrait.png" },
  { id: 4, nome: "Pedro Oliveira", email: "pedro@orgzilla.com", cargo: "Data Analyst", nivel: "L2", time: "Dados", status: "Ativo", dataEntrada: "2023-08-05", avatar: "/man.jpg" },
  { id: 5, nome: "Carla Mendes", email: "carla@orgzilla.com", cargo: "Marketing Lead", nivel: "L5", time: "Marketing", status: "Ativo", dataEntrada: "2021-03-12", avatar: "/diverse-woman-portrait.png" },
  { id: 6, nome: "Lucas Ferreira", email: "lucas@orgzilla.com", cargo: "Engineer II", nivel: "L2", time: "Engenharia", status: "Ativo", dataEntrada: "2023-09-22", avatar: "/man.jpg" },
  { id: 7, nome: "Beatriz Alves", email: "beatriz@orgzilla.com", cargo: "UX Designer", nivel: "L3", time: "Design", status: "Ativo", dataEntrada: "2022-11-08", avatar: "/diverse-woman-portrait.png" },
  { id: 8, nome: "Rafael Lima", email: "rafael@orgzilla.com", cargo: "Engineer I", nivel: "L1", time: "Engenharia", status: "Licença", dataEntrada: "2024-03-01", avatar: "/man.jpg" },
  { id: 9, nome: "Juliana Rocha", email: "juliana@orgzilla.com", cargo: "Product Designer", nivel: "L3", time: "Design", status: "Ativo", dataEntrada: "2022-04-15", avatar: "/diverse-woman-portrait.png" },
  { id: 10, nome: "Gabriel Souza", email: "gabriel@orgzilla.com", cargo: "Data Engineer", nivel: "L3", time: "Dados", status: "Ativo", dataEntrada: "2023-02-20", avatar: "/man.jpg" },
  { id: 11, nome: "Fernanda Dias", email: "fernanda@orgzilla.com", cargo: "Engineering Manager", nivel: "L5", time: "Engenharia", status: "Ativo", dataEntrada: "2021-01-10", avatar: "/diverse-woman-portrait.png" },
  { id: 12, nome: "Thiago Martins", email: "thiago@orgzilla.com", cargo: "Content Writer", nivel: "L2", time: "Marketing", status: "Férias", dataEntrada: "2023-07-12", avatar: "/man.jpg" },
  { id: 13, nome: "Camila Nunes", email: "camila@orgzilla.com", cargo: "Senior Designer", nivel: "L4", time: "Design", status: "Ativo", dataEntrada: "2022-08-30", avatar: "/diverse-woman-portrait.png" },
  { id: 14, nome: "Bruno Castro", email: "bruno@orgzilla.com", cargo: "Product Analyst", nivel: "L2", time: "Produto", status: "Ativo", dataEntrada: "2024-01-05", avatar: "/man.jpg" },
  { id: 15, nome: "Larissa Pinto", email: "larissa@orgzilla.com", cargo: "Marketing Manager", nivel: "L4", time: "Marketing", status: "Ativo", dataEntrada: "2022-03-18", avatar: "/diverse-woman-portrait.png" },
]

const TEAM_OPTIONS = ["Todos", "Engenharia", "Produto", "Design", "Dados", "Marketing"]
const LEVEL_OPTIONS = ["Todos", "L1", "L2", "L3", "L4", "L5"]
const STATUS_OPTIONS = ["Todos", "Ativo", "Férias", "Licença", "Afastamento"]

export default function PessoasPage() {
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<string[]>(["Todos"])
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["Todos"])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Todos"])
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data
  const filteredData = MOCK_PEOPLE.filter(person => {
    const matchesSearch = searchQuery === '' || 
      person.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.cargo.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTeam = selectedTeams.includes("Todos") || selectedTeams.includes(person.time)
    const matchesLevel = selectedLevels.includes("Todos") || selectedLevels.includes(person.nivel)
    const matchesStatus = selectedStatuses.includes("Todos") || selectedStatuses.includes(person.status)
    
    return matchesSearch && matchesTeam && matchesLevel && matchesStatus
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aValue = a[sortColumn as keyof typeof a]
    const bValue = b[sortColumn as keyof typeof b]
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    console.log(`Sorting by ${column} ${sortDirection === 'asc' ? 'desc' : 'asc'}`)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(paginatedData.map(p => p.id))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id])
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id))
    }
  }

  const handleAction = (action: string, personId: number) => {
    console.log(`Action: ${action} for person ID: ${personId}`)
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} for IDs:`, selectedRows)
    setSelectedRows([])
  }

  const clearFilters = () => {
    setSelectedTeams(["Todos"])
    setSelectedLevels(["Todos"])
    setSelectedStatuses(["Todos"])
    console.log('Filters cleared')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'Ativo': 'bg-green-100 text-green-700 border-green-200',
      'Férias': 'bg-blue-100 text-blue-700 border-blue-200',
      'Licença': 'bg-orange-100 text-orange-700 border-orange-200',
      'Afastamento': 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return (
      <Badge variant="outline" className={variants[status]}>
        {status}
      </Badge>
    )
  }

  const getTeamColor = (team: string) => {
    const colors: Record<string, string> = {
      'Engenharia': 'bg-blue-500',
      'Produto': 'bg-purple-500',
      'Design': 'bg-pink-500',
      'Dados': 'bg-green-500',
      'Marketing': 'bg-orange-500',
    }
    return colors[team] || 'bg-gray-500'
  }

  return (
    <DashboardShell>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span className="hover:text-primary cursor-pointer">Dashboard</span>
              <span>&gt;</span>
              <span className="text-gray-900">Pessoas</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <h1 className="text-3xl font-bold text-[#1A2734]">Pessoas</h1>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, email, cargo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                <Link href="/pessoas/nova">
                  <Button className="gap-2 bg-[#FF7A00] hover:bg-[#FF7A00]/90">
                    <Plus className="h-4 w-4" />
                    Adicionar Pessoa
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-[#1A2734]">Filtros</span>
              {filtersExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {filtersExpanded && (
              <div className="p-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Time</label>
                    <Select value={selectedTeams[0]} onValueChange={(val) => setSelectedTeams([val])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_OPTIONS.map(team => (
                          <SelectItem key={team} value={team}>{team}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Nível</label>
                    <Select value={selectedLevels[0]} onValueChange={(val) => setSelectedLevels([val])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVEL_OPTIONS.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                    <Select value={selectedStatuses[0]} onValueChange={(val) => setSelectedStatuses([val])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="bg-[#FF7A00] hover:bg-[#FF7A00]/90"
                    onClick={() => console.log('Filters applied:', { selectedTeams, selectedLevels, selectedStatuses })}
                  >
                    Aplicar Filtros
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('nome')}
                    >
                      Nome
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('cargo')}
                    >
                      Cargo
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('time')}
                    >
                      Time
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('dataEntrada')}
                    >
                      Data de Entrada
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-gray-500 font-medium">Nenhuma pessoa encontrada</p>
                          <p className="text-sm text-gray-400">Tente ajustar seus filtros ou busca</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((person) => (
                      <TableRow 
                        key={person.id}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedRows.includes(person.id) ? 'bg-orange-50' : ''
                        }`}
                        onClick={() => window.location.href = `/pessoas/${person.id}`}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedRows.includes(person.id)}
                            onCheckedChange={(checked) => handleSelectRow(person.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img 
                              src={person.avatar || "/placeholder.svg"} 
                              alt={person.nome}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium text-[#1A2734]">{person.nome}</div>
                              <div className="text-sm text-gray-500">{person.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{person.cargo}</span>
                            <Badge variant="secondary" className="text-xs text-white">
                              {person.nivel}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getTeamColor(person.time)}`} />
                            <span className="text-sm">{person.time}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(person.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(person.dataEntrada).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/pessoas/${person.id}`}>Visualizar</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/pessoas/${person.id}`}>Editar</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction('mover', person.id)}>
                                Mover Time
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleAction('desativar', person.id)}
                                className="text-red-600"
                              >
                                Desativar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Mostrar</span>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(val) => {
                    setItemsPerPage(Number(val))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">
                  de {sortedData.length} pessoas
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90" : ""}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedRows.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-[#1A2734] text-white p-4 shadow-lg">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-semibold">
                    {selectedRows.length} {selectedRows.length === 1 ? 'pessoa selecionada' : 'pessoas selecionadas'}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBulkAction('exportar')}
                    >
                      Exportar Selecionados
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBulkAction('mover')}
                    >
                      Mover Time
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBulkAction('desativar')}
                      className="text-red-600"
                    >
                      Desativar
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRows([])}
                  className="text-white hover:text-white/80"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
