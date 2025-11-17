'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ChevronRight, Info, Plus, X, Search, Users, AlertTriangle } from 'lucide-react'

export default function EditarTimePage() {
  const params = useParams()
  const { toast } = useToast()
  
  // Mock data for edit mode
  const mockTeam = {
    id: 2,
    nome: 'Engenharia',
    descricao: 'Time responsável pelo desenvolvimento de software e manutenção de sistemas',
    timePai: {
      id: 1,
      nome: 'Tecnologia',
      path: 'Tecnologia'
    },
    gestor: {
      id: 'g1',
      nome: 'Maria Santos',
      avatar: '/diverse-woman-portrait.png',
      cargo: 'Engineering Manager',
      time: 'Tecnologia'
    },
    vagas: [
      { cargo: 'Senior Engineer', quantidade: 2 },
      { cargo: 'Tech Lead', quantidade: 1 }
    ],
    membros: [
      { id: 'm1', nome: 'João Silva', cargo: 'Senior Engineer', avatar: '/man.jpg', isGestor: false },
      { id: 'm2', nome: 'Ana Costa', cargo: 'Engineer II', avatar: '/tech-woman.png', isGestor: false },
      { id: 'm3', nome: 'Pedro Lima', cargo: 'Engineer I', avatar: '/engineer-man.png', isGestor: false },
      { id: 'm4', nome: 'Carla Mendes', cargo: 'Senior Engineer', avatar: '/developer-woman.png', isGestor: false },
      { id: 'm5', nome: 'Rafael Souza', cargo: 'Engineer II', avatar: '/developer-man.png', isGestor: false },
    ],
    totalMembros: 18,
    status: 'ativo',
    dataCriacao: '2023-01-15'
  }

  const [formData, setFormData] = useState({
    nome: mockTeam.nome,
    descricao: mockTeam.descricao,
    timePai: mockTeam.timePai,
    gestor: mockTeam.gestor,
    temVagas: mockTeam.vagas.length > 0,
    vagas: mockTeam.vagas,
    status: mockTeam.status,
    membros: mockTeam.membros,
    totalMembros: mockTeam.totalMembros,
    dataCriacao: mockTeam.dataCriacao
  })
  
  const [showPersonSelector, setShowPersonSelector] = useState(false)
  const [showParentSelect, setShowParentSelect] = useState(false)
  const [showManagerSelect, setShowManagerSelect] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showAllMembers, setShowAllMembers] = useState(false)

  // Mock data
  const availableTeams = [
    { id: 1, nome: 'Tecnologia', nivel: 0, path: 'Tecnologia' },
    { id: 3, nome: 'Dados', nivel: 1, path: 'Tecnologia > Dados', paiId: 1 },
    { id: 4, nome: 'Produto', nivel: 0, path: 'Produto' },
    { id: 5, nome: 'Design', nivel: 1, path: 'Produto > Design', paiId: 4 },
    { id: 6, nome: 'Marketing', nivel: 0, path: 'Marketing' },
  ]

  const availableManagers = [
    { id: 'g1', nome: 'Maria Santos', cargo: 'Senior Engineer', time: 'Engenharia', avatar: '/diverse-woman-portrait.png' },
    { id: 'g2', nome: 'João Silva', cargo: 'Product Manager', time: 'Produto', avatar: '/man.jpg' },
    { id: 'g3', nome: 'Ana Costa', cargo: 'Designer', time: 'Design', avatar: '/tech-woman.png' },
    { id: 'g4', nome: 'Pedro Lima', cargo: 'Tech Lead', time: 'Backend', avatar: '/engineer-man.png' },
    { id: 'g5', nome: 'Carla Mendes', cargo: 'Marketing Lead', time: 'Marketing', avatar: '/developer-woman.png' },
  ]

  const availablePositions = [
    'Engineer I', 'Engineer II', 'Senior Engineer', 'Tech Lead', 
    'Product Manager', 'Designer', 'Marketing Analyst'
  ]

  const availablePeople = [
    { id: 'p1', nome: 'Lucas Oliveira', cargo: 'Engineer I', time: 'Backend', avatar: '/young-developer.png' },
    { id: 'p2', nome: 'Juliana Martins', cargo: 'Engineer II', time: 'Frontend', avatar: '/junior-developer-woman.jpg' },
    { id: 'p3', nome: 'Roberto Santos', cargo: 'Senior Engineer', time: 'Dados', avatar: '/engineer-man.png' },
  ]

  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [moveToTeam, setMoveToTeam] = useState<any>(null)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const addVaga = () => {
    setFormData(prev => ({
      ...prev,
      vagas: [...prev.vagas, { cargo: '', quantidade: 1 }]
    }))
    setIsDirty(true)
  }

  const removeVaga = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vagas: prev.vagas.filter((_, i) => i !== index)
    }))
    setIsDirty(true)
  }

  const updateVaga = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      vagas: prev.vagas.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }))
    setIsDirty(true)
  }

  const handleSave = () => {
    if (!formData.nome || !formData.gestor) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios (*)',
        variant: 'destructive'
      })
      return
    }

    console.log('Saving team:', formData)
    toast({
      title: '🦖 Time atualizado com sucesso!',
      description: `As alterações do time "${formData.nome}" foram salvas.`
    })
    setIsDirty(false)
  }

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Descartar alterações?')) {
        window.history.back()
      }
    } else {
      window.history.back()
    }
  }

  const handleDelete = () => {
    console.log('Deleting team, moving people to:', moveToTeam)
    toast({
      title: 'Time excluído',
      description: `O time foi excluído e ${formData.totalMembros} pessoas foram realocadas.`
    })
    setShowDeleteModal(false)
  }

  const handleAddPeople = () => {
    console.log('Adding people:', selectedPeople)
    toast({
      title: 'Pessoas adicionadas',
      description: `${selectedPeople.length} pessoa(s) foram adicionadas ao time.`
    })
    setShowPersonSelector(false)
    setSelectedPeople([])
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const visibleMembers = showAllMembers ? formData.membros : formData.membros.slice(0, 5)

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground">Dashboard</a>
          <ChevronRight className="w-4 h-4" />
          <a href="/times" className="hover:text-foreground">Times</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Editar Time</span>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Time</h1>
          <p className="text-muted-foreground mt-1">Atualize as informações do time</p>
        </div>

        {/* Form Card */}
        <div className="max-w-[800px] mx-auto bg-white rounded-lg shadow-sm border p-8 space-y-8 mb-24">
          {/* Section 1: Informações Básicas */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground border-b pb-2">Informações Básicas</h2>
            
            {/* Nome do Time */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Time *</Label>
              <Input
                id="nome"
                placeholder="Ex: Engenharia de Software"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                maxLength={100}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground text-right">{formData.nome.length}/100 caracteres</p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o propósito e responsabilidades do time..."
                rows={4}
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{formData.descricao.length}/500 caracteres</p>
            </div>

            {/* Time Pai */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Time Pai
                <Info
                  className="w-4 h-4 text-muted-foreground cursor-help"
                  aria-label="Time hierarquicamente superior. Deixe vazio para times de nível raiz"
                  data-tooltip="Time hierarquicamente superior. Deixe vazio para times de nível raiz"
                  tabIndex={0}
                />
              </Label>
              <button
                type="button"
                onClick={() => setShowParentSelect(true)}
                className="w-full h-11 px-3 text-left border rounded-md hover:border-primary transition-colors flex items-center justify-between"
              >
                <span className={formData.timePai ? 'text-foreground' : 'text-muted-foreground'}>
                  {formData.timePai ? formData.timePai.path : 'Selecione um time (opcional)'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Gestor */}
            <div className="space-y-2">
              <Label>Gestor *</Label>
              <button
                type="button"
                onClick={() => setShowManagerSelect(true)}
                className="w-full h-11 px-3 text-left border rounded-md hover:border-primary transition-colors flex items-center justify-between"
              >
                {formData.gestor ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={formData.gestor.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{formData.gestor.nome[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-foreground text-sm">{formData.gestor.nome}</span>
                      <span className="text-xs text-muted-foreground">{formData.gestor.cargo}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Busque por nome ou email</span>
                )}
                <ChevronRight className="w-4 h-4" />
              </button>
              {formData.gestor && formData.gestor.id !== mockTeam.gestor.id && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <span className="text-amber-900">Alterar gestor afetará permissões de acesso na hierarquia</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Vagas Abertas */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-semibold text-foreground">Vagas Abertas</h2>
              <div className="flex items-center gap-2">
                <Label htmlFor="tem-vagas" className="text-sm">Este time tem vagas abertas?</Label>
                <Switch
                  id="tem-vagas"
                  checked={formData.temVagas}
                  onCheckedChange={(checked) => handleInputChange('temVagas', checked)}
                />
              </div>
            </div>

            {formData.temVagas && (
              <div className="space-y-4">
                {formData.vagas.map((vaga, index) => (
                  <div key={index} className="flex gap-4 p-4 border rounded-lg relative">
                    <button
                      type="button"
                      onClick={() => removeVaga(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="flex-1 space-y-2">
                      <Label>Cargo *</Label>
                      <select
                        value={vaga.cargo}
                        onChange={(e) => updateVaga(index, 'cargo', e.target.value)}
                        className="w-full h-10 px-3 border rounded-md"
                      >
                        <option value="">Selecione um cargo</option>
                        {availablePositions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32 space-y-2">
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={vaga.quantidade}
                        onChange={(e) => updateVaga(index, 'quantidade', parseInt(e.target.value) || 1)}
                        className="h-10"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addVaga}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Outra Vaga
                </Button>
              </div>
            )}
          </div>

          {/* Section 3: Membros Atuais */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-semibold text-foreground">Membros Atuais</h2>
              <Button size="sm" onClick={() => setShowPersonSelector(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Pessoas
              </Button>
            </div>

            <div className="space-y-3">
              {visibleMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{member.nome[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{member.nome}</span>
                        {member.isGestor && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">Gestor</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{member.cargo}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Mover para outro time
                  </Button>
                </div>
              ))}

              {formData.totalMembros > 5 && !showAllMembers && (
                <button
                  onClick={() => setShowAllMembers(true)}
                  className="w-full py-2 text-sm text-primary hover:underline"
                >
                  Ver todos {formData.totalMembros} membros
                </button>
              )}
            </div>
          </div>

          {/* Section 4: Informações Adicionais */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground border-b pb-2">Informações Adicionais</h2>
            
            <div className="space-y-4">
              <Label>Status</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="ativo"
                    checked={formData.status === 'ativo'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Ativo
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="inativo"
                    checked={formData.status === 'inativo'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    Inativo
                  </span>
                </label>
              </div>
              {formData.status === 'inativo' && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <span className="text-amber-900">Desativar time ocultará suas informações. Pessoas permanecerão alocadas</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Times inativos não aparecem em seleções e relatórios</p>
            </div>

            <div className="space-y-2">
              <Label>Data de Criação</Label>
              <div className="text-sm text-muted-foreground">
                Criado em {formatDate(formData.dataCriacao)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
                Excluir Time
              </Button>
            </div>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              Salvar Time
            </Button>
          </div>
        </div>

        {/* Parent Team Selector Modal */}
        <Dialog open={showParentSelect} onOpenChange={setShowParentSelect}>
          <DialogContent className="max-w-md w-full p-6">
            <DialogHeader>
              <DialogTitle>Selecionar Time Pai</DialogTitle>
              <DialogDescription>Escolha o time hierarquicamente superior</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              <button
                onClick={() => {
                  handleInputChange('timePai', null)
                  setShowParentSelect(false)
                }}
                className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors"
              >
                <span className="text-muted-foreground">Nenhum (time de nível raiz)</span>
              </button>
              {availableTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => {
                    handleInputChange('timePai', team)
                    setShowParentSelect(false)
                  }}
                  className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                  style={{ paddingLeft: `${team.nivel * 20 + 12}px` }}
                  disabled={team.id === mockTeam.id}
                >
                  <div className="font-medium">{team.nome}</div>
                  <div className="text-xs text-muted-foreground">{team.path}</div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Manager Selector Modal */}
        <Dialog open={showManagerSelect} onOpenChange={setShowManagerSelect}>
          <DialogContent className="max-w-md w-full p-6">
            <DialogHeader>
              <DialogTitle>Selecionar Gestor</DialogTitle>
              <DialogDescription>Escolha o gestor do time</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableManagers.map(manager => (
                <button
                  key={manager.id}
                  onClick={() => {
                    handleInputChange('gestor', manager)
                    setShowManagerSelect(false)
                  }}
                  className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors flex items-center gap-3"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={manager.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{manager.nome[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{manager.nome}</div>
                    <div className="text-xs text-muted-foreground">{manager.cargo} - {manager.time}</div>
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Person Selector Modal */}
        <Dialog open={showPersonSelector} onOpenChange={setShowPersonSelector}>
          <DialogContent className="p-6">
            <DialogHeader>
              <DialogTitle>Adicionar Pessoas ao Time</DialogTitle>
              <DialogDescription>Selecione as pessoas que deseja adicionar</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar pessoas..." className="pl-9" />
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availablePeople.map(person => (
                  <label
                    key={person.id}
                    className="flex items-center gap-3 p-3 border rounded-md hover:bg-accent transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPeople.includes(person.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPeople(prev => [...prev, person.id])
                        } else {
                          setSelectedPeople(prev => prev.filter(id => id !== person.id))
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={person.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{person.nome[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{person.nome}</div>
                      <div className="text-xs text-muted-foreground">{person.cargo} - {person.time}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPersonSelector(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddPeople}
                disabled={selectedPeople.length === 0}
                className="bg-primary hover:bg-primary/90"
              >
                Adicionar {selectedPeople.length > 0 ? selectedPeople.length : ''} pessoa{selectedPeople.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-md w-full p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Excluir Time?
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. {formData.totalMembros} pessoas estão alocadas neste time.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>O que fazer com as pessoas?</Label>
                <button
                  type="button"
                  onClick={() => setMoveToTeam('select')}
                  className="w-full h-11 px-3 text-left border rounded-md hover:border-primary transition-colors flex items-center justify-between"
                >
                  <span className={moveToTeam ? 'text-foreground' : 'text-muted-foreground'}>
                    {moveToTeam && moveToTeam !== 'select' ? moveToTeam.nome : 'Mover para outro time'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <label className="flex items-center gap-2 p-3 border rounded-md hover:bg-accent cursor-pointer">
                  <input type="radio" name="move-option" className="w-4 h-4" />
                  <span className="text-sm">Desalocar pessoas (deixar sem time)</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir Time
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
