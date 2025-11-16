'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ChevronRight, Info, Plus, X, Search, Users } from 'lucide-react'

export default function NovoTimePage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    timePai: null as any,
    gestor: null as any,
    temVagas: false,
    vagas: [] as any[],
    status: 'ativo'
  })
  
  const [showPersonSelector, setShowPersonSelector] = useState(false)
  const [showParentSelect, setShowParentSelect] = useState(false)
  const [showManagerSelect, setShowManagerSelect] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [selectedPeople, setSelectedPeople] = useState([] as string[])

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
    { id: 'p1', nome: 'Alice Johnson', cargo: 'Software Engineer', time: 'Tecnologia', avatar: '/software-engineer.png' },
    { id: 'p2', nome: 'Bob Smith', cargo: 'Product Designer', time: 'Produto', avatar: '/product-designer.png' },
    { id: 'p3', nome: 'Charlie Brown', cargo: 'Data Analyst', time: 'Dados', avatar: '/data-analyst.png' },
    { id: 'p4', nome: 'Diana Prince', cargo: 'Marketing Specialist', time: 'Marketing', avatar: '/marketing-specialist.png' },
  ]

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
      title: '🦖 Time salvo com sucesso!',
      description: `O time "${formData.nome}" foi criado.`
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

  const handleAddPeople = () => {
    // Logic to add selected people to the team
    console.log('Adding people to team:', selectedPeople)
    setShowPersonSelector(false)
  }

  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground">Dashboard</a>
          <ChevronRight className="w-4 h-4" />
          <a href="/times" className="hover:text-foreground">Times</a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Novo Time</span>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Novo Time</h1>
          <p className="text-muted-foreground mt-1">Crie um novo time para sua organização</p>
        </div>

        {/* Form Card */}
        <div className="max-w-[800px] mx-auto bg-white rounded-lg shadow-sm border p-8 space-y-8">
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
                <Info className="w-4 h-4 text-muted-foreground cursor-help" title="Time hierarquicamente superior. Deixe vazio para times de nível raiz" />
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
              {formData.gestor && (
                <p className="text-xs text-muted-foreground">Atualmente em: {formData.gestor.time}</p>
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

          {/* Section 3: Adicionar Pessoas */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-xl font-semibold text-foreground">Adicionar Pessoas</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPersonSelector(true)}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Adicionar Pessoas
              </Button>
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
              <p className="text-xs text-muted-foreground">Times inativos não aparecem em seleções e relatórios</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <Button variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
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
                  className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors"
                  style={{ paddingLeft: `${team.nivel * 20 + 12}px` }}
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
          <DialogContent className="sm:max-w-3xl w-full p-6">
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
      </div>
    </DashboardShell>
  )
}
