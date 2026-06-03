"use client"

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Download, Plus, ChevronDown, ChevronUp, MoreVertical, X } from 'lucide-react'
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
import { toast } from 'sonner'
import type { PessoasResult } from '@/app/actions/pessoas.actions'
import { exportPessoasCSV } from '@/app/actions/pessoas.actions'

type PessoasTableProps = {
  initialData: PessoasResult
  times: Array<{ id: string; nome: string }>
  cargos: Array<{ id: string; nome: string }>
  canViewSalary: boolean
}

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'ferias', label: 'Férias' },
  { value: 'licenca', label: 'Licença' },
  { value: 'afastamento', label: 'Afastamento' },
]

export function PessoasTable({ initialData, times, cargos, canViewSalary }: PessoasTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string>('todos')
  const [selectedCargo, setSelectedCargo] = useState<string>('todos')
  const [selectedStatus, setSelectedStatus] = useState<string>('todos')
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const currentPage = initialData.page
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Usar dados do servidor
  const pessoas = initialData.pessoas
  const total = initialData.total
  const totalPages = initialData.totalPages

  const applyFilters = () => {
    // Construir query params
    const params = new URLSearchParams()

    if (searchQuery) params.set('search', searchQuery)
    if (selectedTeam !== 'todos') params.set('timeId', selectedTeam)
    if (selectedCargo !== 'todos') params.set('cargoId', selectedCargo)
    if (selectedStatus !== 'todos') params.set('status', selectedStatus)
    params.set('page', '1')
    params.set('itemsPerPage', itemsPerPage.toString())

    // Navegar com novos filtros
    startTransition(() => {
      router.push(`/pessoas?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTeam('todos')
    setSelectedCargo('todos')
    setSelectedStatus('todos')

    startTransition(() => {
      router.push('/pessoas')
    })
  }

  const changePage = (page: number) => {
    const params = new URLSearchParams()

    if (searchQuery) params.set('search', searchQuery)
    if (selectedTeam !== 'todos') params.set('timeId', selectedTeam)
    if (selectedCargo !== 'todos') params.set('cargoId', selectedCargo)
    if (selectedStatus !== 'todos') params.set('status', selectedStatus)
    params.set('page', page.toString())
    params.set('itemsPerPage', itemsPerPage.toString())

    startTransition(() => {
      router.push(`/pessoas?${params.toString()}`)
    })
  }

  const changeItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)

    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedTeam !== 'todos') params.set('timeId', selectedTeam)
    if (selectedCargo !== 'todos') params.set('cargoId', selectedCargo)
    if (selectedStatus !== 'todos') params.set('status', selectedStatus)
    params.set('page', '1')
    params.set('itemsPerPage', newItemsPerPage.toString())

    startTransition(() => {
      router.push(`/pessoas?${params.toString()}`)
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(pessoas.map(p => p.id))
    } else {
      setSelectedRows([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, id])
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id))
    }
  }

  const handleExport = async () => {
    try {
      const result = await exportPessoasCSV({
        search: searchQuery || undefined,
        timeId: selectedTeam !== 'todos' ? selectedTeam : undefined,
        cargoId: selectedCargo !== 'todos' ? selectedCargo : undefined,
        status: selectedStatus !== 'todos' ? selectedStatus : undefined,
      })

      if (result.success && result.data) {
        // Download CSV
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `pessoas-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast.success('🦖 Dados exportados com sucesso!')
      } else {
        toast.error(result.error || 'Erro ao exportar dados')
      }
    } catch (error) {
      console.error('[Export] Erro:', error)
      toast.error('Erro ao exportar dados')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'ativo': 'bg-green-100 text-green-700 border-green-200',
      'ferias': 'bg-blue-100 text-blue-700 border-blue-200',
      'licenca': 'bg-orange-100 text-orange-700 border-orange-200',
      'afastamento': 'bg-gray-100 text-foreground border-gray-200',
      'desligado': 'bg-red-100 text-red-700 border-red-200',
    }

    const labels: Record<string, string> = {
      'ativo': 'Ativo',
      'ferias': 'Férias',
      'licenca': 'Licença',
      'afastamento': 'Afastamento',
      'desligado': 'Desligado',
    }

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const getTeamColor = (teamName: string | undefined) => {
    if (!teamName) return 'bg-gray-500'

    const colors: Record<string, string> = {
      'Engenharia': 'bg-blue-500',
      'Produto': 'bg-purple-500',
      'Design': 'bg-pink-500',
      'Dados': 'bg-green-500',
      'Marketing': 'bg-orange-500',
    }
    return colors[teamName] || 'bg-gray-500'
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-primary">
              Dashboard
            </Link>
            <span>&gt;</span>
            <span className="text-foreground">Pessoas</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h1 className="text-3xl font-bold text-foreground">Pessoas</h1>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyFilters()
                  }}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2" onClick={() => { void handleExport() }}>
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Link href="/pessoas/novo">
                <Button className="gap-2 bg-primary-strong hover:bg-primary-strong/90">
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
            <span className="font-semibold text-foreground">Filtros</span>
            {filtersExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {filtersExpanded && (
            <div className="p-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Time</label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {times.map(time => (
                        <SelectItem key={time.id} value={time.id}>{time.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Cargo</label>
                  <Select value={selectedCargo} onValueChange={setSelectedCargo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {cargos.map(cargo => (
                        <SelectItem key={cargo.id} value={cargo.id}>{cargo.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(status => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="bg-primary-strong hover:bg-primary-strong/90"
                  onClick={applyFilters}
                  disabled={isPending}
                >
                  {isPending ? 'Aplicando...' : 'Aplicar Filtros'}
                </Button>
                <Button variant="outline" onClick={clearFilters} disabled={isPending}>
                  Limpar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isPending && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <div className="text-sm text-muted-foreground">Carregando...</div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRows.length === pessoas.length && pessoas.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Entrada</TableHead>
                  {canViewSalary && <TableHead>Salário</TableHead>}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pessoas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canViewSalary ? 8 : 7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground font-medium">Nenhuma pessoa encontrada</p>
                        <p className="text-sm text-muted-foreground">Tente ajustar seus filtros ou busca</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pessoas.map((pessoa) => (
                    <TableRow
                      key={pessoa.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedRows.includes(pessoa.id) ? 'bg-orange-50' : ''
                      }`}
                      onClick={() => router.push(`/pessoas/${pessoa.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows.includes(pessoa.id)}
                          onCheckedChange={(checked) => handleSelectRow(pessoa.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {pessoa.foto_url ? (
                            <Image
                              src={pessoa.foto_url}
                              alt={pessoa.nome}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {pessoa.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-foreground">
                              {pessoa.nome_social || pessoa.nome}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {pessoa.email_corporativo || pessoa.email_pessoal || '-'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{pessoa.cargo?.nome || '-'}</span>
                          {pessoa.cargo?.nivel && (
                            <Badge variant="secondary" className="text-xs text-white">
                              {pessoa.cargo.nivel.nome}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getTeamColor(pessoa.time?.nome)}`} />
                          <span className="text-sm">{pessoa.time?.nome || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(pessoa.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pessoa.data_entrada
                          ? new Date(pessoa.data_entrada).toLocaleDateString('pt-BR')
                          : '-'}
                      </TableCell>
                      {canViewSalary && (
                        <TableCell className="text-sm text-muted-foreground">
                          {pessoa.remuneracao?.salario_atual
                            ? new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(pessoa.remuneracao.salario_atual)
                            : '-'}
                        </TableCell>
                      )}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/pessoas/${pessoa.id}`}>Visualizar</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/pessoas/${pessoa.id}/editar`}>Editar</Link>
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
              <span className="text-sm text-muted-foreground">Mostrar</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(val) => changeItemsPerPage(Number(val))}
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
              <span className="text-sm text-muted-foreground">
                de {total} pessoas
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
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
                      onClick={() => changePage(page)}
                      disabled={isPending}
                      className={currentPage === page ? "bg-primary-strong hover:bg-primary-strong/90" : ""}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedRows.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-secondary text-white p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {selectedRows.length} {selectedRows.length === 1 ? 'pessoa selecionada' : 'pessoas selecionadas'}
                </span>
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
  )
}
