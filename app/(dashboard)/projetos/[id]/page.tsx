'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { MoreVertical, Plus, Search, Users, Calendar } from 'lucide-react'
import { DetailsSkeleton, Breadcrumb } from '@/components/shared'
import { handleError } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'
import { getProjetoById, removePessoaDoProjeto, addPessoaAoProjeto, softDeleteProjeto } from '@/app/actions/projetos.actions'
import { getPessoasParaGestor } from '@/app/actions/pessoas.actions'
import type { ProjetoDetail } from '@/app/actions/projetos.actions'

export default function ProjetoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projetoId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [projeto, setProjeto] = useState<ProjetoDetail | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Add people modal
  const [addPeopleModalOpen, setAddPeopleModalOpen] = useState(false)
  const [availablePeople, setAvailablePeople] = useState<Array<{
    id: string
    nome: string
    cargo: string | null
    time: string | null
  }>>([])
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([])

  // Remove person modal
  const [removePersonModal, setRemovePersonModal] = useState<{
    open: boolean
    alocacaoId: string | null
    pessoaNome: string | null
  }>({
    open: false,
    alocacaoId: null,
    pessoaNome: null,
  })

  // Recarrega os dados do projeto (usado pelos handlers após mutações)
  async function loadProjeto() {
    try {
      const result = await getProjetoById(projetoId)
      if (result.success && result.data) {
        setProjeto(result.data)
      } else {
        toast.error(String((!result.success && result.error) || 'Erro ao carregar projeto'))
        router.push('/projetos')
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
      router.push('/projetos')
    }
  }

  useEffect(() => {
    let active = true
    async function carregar() {
      try {
        const result = await getProjetoById(projetoId)
        if (!active) return
        if (result.success && result.data) {
          setProjeto(result.data)
        } else {
          toast.error(String((!result.success && result.error) || 'Erro ao carregar projeto'))
          router.push('/projetos')
        }
      } catch (error) {
        toast.error(handleError(error, 'database'))
        router.push('/projetos')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void carregar()
    return () => {
      active = false
    }
  }, [projetoId, router])

  async function loadAvailablePeople() {
    const result = await getPessoasParaGestor()
    if (result.success && result.data) {
      // Filter out people already allocated
      const alocadosIds = projeto?.alocacoes.filter(a => a.ativo && !a.data_fim).map(a => a.pessoa.id) || []
      setAvailablePeople(result.data.filter(p => !alocadosIds.includes(p.id)))
    }
  }

  const handleOpenAddPeopleModal = () => {
    void loadAvailablePeople()
    setAddPeopleModalOpen(true)
  }

  const handleAddPeople = async () => {
    if (!projeto || selectedPeopleIds.length === 0) return

    try {
      const hoje = new Date().toISOString().split('T')[0]

      const alocacoes = selectedPeopleIds.map(pessoaId =>
        addPessoaAoProjeto({
          pessoa_id: pessoaId,
          projeto_produto_id: projeto.id,
          data_inicio: hoje,
          data_fim: null,
          ativo: true,
        })
      )

      await Promise.all(alocacoes)

      toast.success(`${selectedPeopleIds.length} pessoa(s) adicionada(s) ao projeto`)
      setSelectedPeopleIds([])
      setAddPeopleModalOpen(false)
      await loadProjeto()
    } catch (error) {
      toast.error(handleError(error, 'database'))
    }
  }

  const handleRemovePerson = async () => {
    if (!removePersonModal.alocacaoId) return

    try {
      const hoje = new Date().toISOString().split('T')[0]
      const result = await removePessoaDoProjeto(removePersonModal.alocacaoId, hoje)

      if (result.success) {
        toast.success('Pessoa removida do projeto')
        setRemovePersonModal({ open: false, alocacaoId: null, pessoaNome: null })
        await loadProjeto()
      } else {
        toast.error(handleError(new Error(result.error ?? 'Erro ao remover pessoa'), 'database'))
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    }
  }

  const handleDeleteProject = async () => {
    try {
      const result = await softDeleteProjeto(projetoId)
      if (result.success) {
        toast.successDino('Projeto desativado com sucesso!')
        router.push('/projetos')
      } else {
        toast.error(handleError(new Error(result.error ?? 'Erro ao desativar projeto'), 'database'))
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="p-6">
          <DetailsSkeleton />
        </div>
      </DashboardShell>
    )
  }

  // Error state
  if (!projeto) {
    return (
      <DashboardShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold">Projeto não encontrado</p>
            <Button onClick={() => router.push('/projetos')}>Voltar para a lista</Button>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const alocacoesAtivas = projeto.alocacoes.filter(a => a.ativo && !a.data_fim)
  const filteredPeople = alocacoesAtivas.filter((a) =>
    a.pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const availableToAdd = availablePeople.filter(p =>
    !alocacoesAtivas.find(a => a.pessoa.id === p.id)
  )

  const filteredAvailableToAdd = availableToAdd.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Projetos", href: "/projetos" }, { label: projeto.nome }]} />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1A2734]">{projeto.nome}</h1>
            <Badge className={projeto.ativo ? 'bg-green-100 text-green-800 mt-2' : 'bg-gray-100 text-gray-800 mt-2'}>
              {projeto.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/projetos/${projeto.id}/editar`)}>
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenAddPeopleModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pessoas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { void handleDeleteProject() }} className="text-red-600">
                  Desativar Projeto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Pessoas Alocadas</h3>
            </div>
            <p className="text-3xl font-bold">{alocacoesAtivas.length}</p>
            <p className="text-sm text-muted-foreground mt-1">atualmente no projeto</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Criado em</h3>
            </div>
            <p className="text-lg font-semibold">{formatDate(projeto.created_at)}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Total Histórico</h3>
            </div>
            <p className="text-3xl font-bold">{projeto.alocacoes.length}</p>
            <p className="text-sm text-muted-foreground mt-1">todas as alocações</p>
          </Card>
        </div>

        {/* People List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pessoas no Projeto</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar pessoa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button onClick={handleOpenAddPeopleModal}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {filteredPeople.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{searchTerm ? 'Nenhuma pessoa encontrada' : 'Nenhuma pessoa alocada ainda'}</p>
              {!searchTerm && (
                <Button className="mt-4" onClick={handleOpenAddPeopleModal}>
                  Adicionar Primeira Pessoa
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPeople.map((alocacao) => (
                <div
                  key={alocacao.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>{alocacao.pessoa.nome[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link
                        href={`/pessoas/${alocacao.pessoa.id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {alocacao.pessoa.nome}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {alocacao.pessoa.cargo?.nome || 'Sem cargo'}
                        {alocacao.pessoa.time?.nome && ` • ${alocacao.pessoa.time.nome}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Desde {formatDate(alocacao.data_inicio)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRemovePersonModal({
                        open: true,
                        alocacaoId: alocacao.id,
                        pessoaNome: alocacao.pessoa.nome,
                      })
                    }
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Add People Modal */}
        <Dialog open={addPeopleModalOpen} onOpenChange={setAddPeopleModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Pessoas ao Projeto</DialogTitle>
              <DialogDescription>
                Selecione as pessoas que deseja alocar neste projeto
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome..."
                  className="pl-9"
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredAvailableToAdd.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Todas as pessoas já foram alocadas
                  </p>
                ) : (
                  filteredAvailableToAdd.map((pessoa) => (
                    <label
                      key={pessoa.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPeopleIds.includes(pessoa.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPeopleIds([...selectedPeopleIds, pessoa.id])
                          } else {
                            setSelectedPeopleIds(selectedPeopleIds.filter((id) => id !== pessoa.id))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{pessoa.nome[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{pessoa.nome}</p>
                        <p className="text-sm text-gray-500">
                          {pessoa.cargo || 'Sem cargo'} {pessoa.time ? `• ${pessoa.time}` : ''}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddPeopleModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => { void handleAddPeople() }}
                disabled={selectedPeopleIds.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                Adicionar {selectedPeopleIds.length > 0 ? `(${selectedPeopleIds.length})` : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Person Modal */}
        <Dialog open={removePersonModal.open} onOpenChange={(open) => setRemovePersonModal({ open, alocacaoId: null, pessoaNome: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover Pessoa do Projeto</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover {removePersonModal.pessoaNome} deste projeto?
                A data de fim será registrada como hoje.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemovePersonModal({ open: false, alocacaoId: null, pessoaNome: null })}>
                Cancelar
              </Button>
              <Button onClick={() => { void handleRemovePerson() }} variant="destructive">
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
