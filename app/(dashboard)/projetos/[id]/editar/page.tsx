'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Home, ChevronRight, Plus, X, Search } from 'lucide-react'
import { toast } from '@/lib/ui/toast-config'

const availablePeople = [
  { id: 'p1', nome: 'Maria Santos', avatar: '', cargo: 'Tech Lead', time: 'Engenharia' },
  { id: 'p2', nome: 'João Silva', avatar: '', cargo: 'Backend Developer', time: 'Engenharia' },
  { id: 'p3', nome: 'Ana Costa', avatar: '', cargo: 'Frontend Developer', time: 'Frontend' },
  { id: 'p4', nome: 'Pedro Lima', avatar: '', cargo: 'Designer', time: 'Design' },
  { id: 'p5', nome: 'Carla Mendes', avatar: '', cargo: 'QA Engineer', time: 'Qualidade' },
  { id: 'p6', nome: 'Roberto Alves', avatar: '', cargo: 'Product Manager', time: 'Produto' },
]

export default function EditarProjeto() {
  const params = useParams()
  const projetoId = params.id as string
  const router = useRouter()
  const [nome, setNome] = useState('Projeto Alpha')
  const [observacoes, setObservacoes] = useState('Projeto estratégico da área de engenharia com foco em escalabilidade')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')
  const [pessoasAlocadas, setPessoasAlocadas] = useState(availablePeople.slice(0, 4))
  const [addPeopleModalOpen, setAddPeopleModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const availableToAdd = availablePeople.filter(
    (p) => !pessoasAlocadas.find((pa) => pa.id === p.id)
  )

  const filteredAvailable = availableToAdd.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddPeople = () => {
    const peopleToAdd = availablePeople.filter((p) => selectedPeople.includes(p.id))
    setPessoasAlocadas([...pessoasAlocadas, ...peopleToAdd])
    setSelectedPeople([])
    setSearchTerm('')
    setAddPeopleModalOpen(false)
    toast.success(`${peopleToAdd.length} pessoa(s) adicionada(s) ao projeto`)
  }

  const handleRemovePerson = (id: string) => {
    setPessoasAlocadas(pessoasAlocadas.filter((p) => p.id !== id))
    toast.success('Pessoa removida do projeto')
  }

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error({ type: 'validation', message: 'Nome do projeto é obrigatório' })
      return
    }

    toast.successDino(`${nome} atualizado com sucesso`)
    router.push(`/projetos/${projetoId}`)
  }

  const handleDelete = () => {
    toast.successDino('Projeto excluído com sucesso!')
    router.push('/projetos')
  }

  return (
    <DashboardShell>
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Home className="w-4 h-4" />
          <Link href="/" className="hover:text-gray-900">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/projetos" className="hover:text-gray-900">Projetos</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Editar Time</span>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Editar Projeto</h1>
          <p className="text-gray-600 mt-1">Atualize as informações do projeto</p>
        </div>

        {/* Form Card */}
        <Card className="max-w-4xl mx-auto">
          <div className="p-8 space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Projeto *</Label>
              <Input
                id="nome"
                placeholder="Ex: Plataforma de Analytics"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={100}
                className="h-11"
              />
              <p className="text-sm text-gray-500 text-right">{nome.length}/100 caracteres</p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'Ativo'}
                    onChange={() => setStatus('Ativo')}
                    className="w-4 h-4 text-green-600"
                  />
                  <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === 'Inativo'}
                    onChange={() => setStatus('Inativo')}
                    className="w-4 h-4 text-gray-600"
                  />
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inativo</Badge>
                </label>
              </div>
              <p className="text-sm text-gray-500">Projetos inativos não aparecem em filtros por padrão</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Alocação de Equipe</h3>
            </div>

            {/* Team Allocation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pessoas Alocadas</Label>
                <Badge variant="outline">{pessoasAlocadas.length} pessoas</Badge>
              </div>

              {pessoasAlocadas.length > 0 ? (
                <div className="border rounded-lg divide-y">
                  {pessoasAlocadas.map((pessoa) => (
                    <div key={pessoa.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={pessoa.avatar || "/placeholder.svg"} alt={pessoa.nome} />
                          <AvatarFallback className="bg-orange-100 text-orange-700">
                            {pessoa.nome.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{pessoa.nome}</p>
                          <p className="text-sm text-gray-600">{pessoa.cargo}</p>
                        </div>
                        <Badge variant="outline" className="ml-2">{pessoa.time}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePerson(pessoa.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center">
                  <p className="text-gray-500 mb-4">Nenhuma pessoa alocada</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAddPeopleModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Pessoas
              </Button>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Notas adicionais sobre o projeto (opcional)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-sm text-gray-500 text-right">{observacoes.length}/500 caracteres</p>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t p-6 flex items-center justify-between">
            <div className="flex gap-2">
              <Link href={`/projetos/${projetoId}`}>
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button variant="destructive" onClick={() => setDeleteModalOpen(true)}>
                Excluir Projeto
              </Button>
            </div>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
              Salvar Projeto
            </Button>
          </div>
        </Card>
      </div>

      {/* Add People Modal */}
      <Dialog open={addPeopleModalOpen} onOpenChange={setAddPeopleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Pessoas ao Projeto</DialogTitle>
            <DialogDescription>
              Selecione as pessoas que deseja adicionar ao projeto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar pessoas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              {filteredAvailable.map((pessoa) => (
                <label
                  key={pessoa.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedPeople.includes(pessoa.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPeople([...selectedPeople, pessoa.id])
                      } else {
                        setSelectedPeople(selectedPeople.filter((id) => id !== pessoa.id))
                      }
                    }}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={pessoa.avatar || "/placeholder.svg"} alt={pessoa.nome} />
                    <AvatarFallback className="bg-orange-100 text-orange-700">
                      {pessoa.nome.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{pessoa.nome}</p>
                    <p className="text-sm text-gray-600">{pessoa.cargo} • {pessoa.time}</p>
                  </div>
                </label>
              ))}
            </div>

            {selectedPeople.length > 0 && (
              <p className="text-sm text-gray-600">{selectedPeople.length} pessoa(s) selecionada(s)</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddPeopleModalOpen(false)
              setSelectedPeople([])
              setSearchTerm('')
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddPeople}
              disabled={selectedPeople.length === 0}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Adicionar {selectedPeople.length > 0 && `(${selectedPeople.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Projeto?</DialogTitle>
            <DialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-orange-600 font-medium">
              {pessoasAlocadas.length} pessoas estão alocadas. Elas serão desalocadas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
