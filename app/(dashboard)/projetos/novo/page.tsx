'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, X, Search, Loader2 } from 'lucide-react'
import { DetailsSkeleton, Breadcrumb } from '@/components/shared'
import { handleError } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'
import { createProjeto, addPessoaAoProjeto } from '@/app/actions/projetos.actions'
import { getPessoasParaGestor } from '@/app/actions/pessoas.actions'

export default function NovoProjeto() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  // Form data
  const [nome, setNome] = useState('')
  const [pessoasAlocadas, setPessoasAlocadas] = useState<Array<{
    id: string
    nome: string
    cargo: string | null
    time: string | null
    dataInicio: Date
  }>>([])

  // Available pessoas from database
  const [availablePeople, setAvailablePeople] = useState<Array<{
    id: string
    nome: string
    cargo: string | null
    time: string | null
  }>>([])

  // Modal state
  const [addPeopleModalOpen, setAddPeopleModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([])

  // Load pessoas on mount
  useEffect(() => {
    async function loadData() {
      try {
        const pessoasResult = await getPessoasParaGestor()

        if (pessoasResult.success && pessoasResult.data) {
          setAvailablePeople(pessoasResult.data)
        }
      } catch (error) {
        toast.error(handleError(error, 'database'))
      } finally {
        setDataLoading(false)
      }
    }

    void loadData()
  }, [])

  const availableToAdd = availablePeople.filter(
    (p) => !pessoasAlocadas.find((pa) => pa.id === p.id)
  )

  const filteredAvailable = availableToAdd.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddPeople = () => {
    const peopleToAdd = availablePeople
      .filter((p) => selectedPeopleIds.includes(p.id))
      .map(p => ({
        ...p,
        dataInicio: new Date(),
      }))

    setPessoasAlocadas([...pessoasAlocadas, ...peopleToAdd])
    setSelectedPeopleIds([])
    setSearchTerm('')
    setAddPeopleModalOpen(false)
    toast.success(`${peopleToAdd.length} pessoa(s) adicionada(s) ao projeto`)
  }

  const handleRemovePerson = (id: string) => {
    setPessoasAlocadas(pessoasAlocadas.filter((p) => p.id !== id))
    toast.success('Pessoa removida do projeto')
  }

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error({ type: 'validation', message: 'Nome do projeto é obrigatório' })
      return
    }

    setIsLoading(true)

    try {
      // 1. Create project
      const projetoResult = await createProjeto({
        nome: nome.trim(),
        ativo: true,
      })

      if (!projetoResult.success) {
        toast.error(handleError(new Error(projetoResult.error ?? 'Erro ao criar projeto'), 'database'))
        return
      }

      const projetoId = projetoResult.data!

      // 2. Add pessoas to project
      if (pessoasAlocadas.length > 0) {
        const alocacoes = pessoasAlocadas.map(pessoa =>
          addPessoaAoProjeto({
            pessoa_id: pessoa.id,
            projeto_produto_id: projetoId,
            data_inicio: pessoa.dataInicio.toISOString().split('T')[0],
            data_fim: null,
            ativo: true,
          })
        )

        await Promise.all(alocacoes)
      }

      toast.successDino('Projeto criado com sucesso!')
      router.push('/projetos')
    } catch (error) {
      toast.error(handleError(error, 'database'))
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (dataLoading) {
    return (
      <DashboardShell>
        <div className="p-6">
          <DetailsSkeleton />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="p-6">
        <Breadcrumb className="mb-6" items={[{ label: "Dashboard", href: "/" }, { label: "Projetos", href: "/projetos" }, { label: "Novo Projeto" }]} />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Novo Projeto</h1>
          <p className="text-muted-foreground mt-1">Crie um novo projeto e aloque pessoas</p>
        </div>

        {/* Form Card */}
        <Card className="p-6 max-w-3xl">
          <div className="space-y-6">
            {/* Nome do Projeto */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Projeto *</Label>
              <Input
                id="nome"
                placeholder="Ex: Projeto Alpha, Sistema Core, App Mobile..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">{nome.length}/100 caracteres</p>
            </div>

            {/* Pessoas Alocadas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Pessoas Alocadas</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddPeopleModalOpen(true)}
                  disabled={availableToAdd.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pessoas
                </Button>
              </div>

              {pessoasAlocadas.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">Nenhuma pessoa alocada ainda</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Adicionar Pessoas" para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pessoasAlocadas.map((pessoa) => (
                    <div
                      key={pessoa.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{pessoa.nome[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{pessoa.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {pessoa.cargo || 'Sem cargo'} {pessoa.time ? `• ${pessoa.time}` : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePerson(pessoa.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/projetos')}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => { void handleSave() }}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Criar Projeto'
                )}
              </Button>
            </div>
          </div>
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
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* People List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredAvailable.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'Nenhuma pessoa encontrada' : 'Todas as pessoas já foram alocadas'}
                  </p>
                ) : (
                  filteredAvailable.map((pessoa) => (
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
                        <p className="text-sm text-muted-foreground">
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
                onClick={handleAddPeople}
                disabled={selectedPeopleIds.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                Adicionar {selectedPeopleIds.length > 0 ? `(${selectedPeopleIds.length})` : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
