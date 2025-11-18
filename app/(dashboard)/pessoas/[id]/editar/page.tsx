'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Home, Upload, Info, Plus, X, Loader2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  nome: string
  dataInicio: Date | undefined
  dataFim: Date | undefined
}

const MOCK_TEAMS = ['Engenharia', 'Produto', 'Design', 'Dados', 'Marketing']
const MOCK_CARGOS = ['Engineer I', 'Engineer II', 'Senior Engineer', 'Staff Engineer', 'Product Manager', 'Product Designer', 'Data Analyst', 'Marketing Manager']
const MOCK_PROJECTS = ['Projeto Alpha', 'Projeto Beta', 'Sistema Core', 'App Mobile']
const MOCK_TAGS = ['Frontend', 'Backend', 'Full Stack', 'Leadership', 'Mentor', 'React', 'Node.js', 'Python', 'DevOps', 'Mobile']

const CARGO_TO_NIVEL: Record<string, string> = {
  'Engineer I': 'L1',
  'Engineer II': 'L2',
  'Senior Engineer': 'L3',
  'Staff Engineer': 'L4',
  'Product Manager': 'L3',
  'Product Designer': 'L3',
  'Data Analyst': 'L2',
  'Marketing Manager': 'L3',
}

const MOCK_DATA = {
  nome: 'Maria Santos',
  nomeSocial: '',
  emailCorporativo: 'maria@orgzilla.com',
  emailPessoal: 'maria.santos@gmail.com',
  telefone: '(11) 98765-4321',
  time: 'Engenharia',
  cargo: 'Senior Engineer',
  dataEntrada: new Date('2023-01-15'),
  dataInicioCargo: new Date('2024-06-01'),
  status: 'Ativo',
  salarioAtual: 'R$ 15.000,00',
  projetos: [
    { id: '1', nome: 'Projeto Alpha', dataInicio: new Date('2024-01-01'), dataFim: undefined },
    { id: '2', nome: 'Sistema Core', dataInicio: new Date('2023-06-01'), dataFim: new Date('2023-12-31') }
  ],
  tags: ['Frontend', 'React', 'Leadership']
}

export default function EditPessoaPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState('pessoais')

  // Form fields initialized with MOCK_DATA
  const [nome, setNome] = useState(MOCK_DATA.nome)
  const [nomeSocial, setNomeSocial] = useState(MOCK_DATA.nomeSocial)
  const [emailCorporativo, setEmailCorporativo] = useState(MOCK_DATA.emailCorporativo)
  const [emailPessoal, setEmailPessoal] = useState(MOCK_DATA.emailPessoal)
  const [telefone, setTelefone] = useState(MOCK_DATA.telefone)
  const [time, setTime] = useState(MOCK_DATA.time)
  const [cargo, setCargo] = useState(MOCK_DATA.cargo)
  const [dataEntrada, setDataEntrada] = useState<Date | undefined>(MOCK_DATA.dataEntrada)
  const [dataInicioCargo, setDataInicioCargo] = useState<Date | undefined>(MOCK_DATA.dataInicioCargo)
  const [status, setStatus] = useState(MOCK_DATA.status)
  const [dataDesligamento, setDataDesligamento] = useState<Date | undefined>(undefined)
  const [salario, setSalario] = useState(MOCK_DATA.salarioAtual)
  const [projects, setProjects] = useState<Project[]>(MOCK_DATA.projetos)
  const [selectedTags, setSelectedTags] = useState<string[]>(MOCK_DATA.tags)
  const [newTag, setNewTag] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const nivel = cargo ? CARGO_TO_NIVEL[cargo] || '-' : '-'

  const handlePhoneMask = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      const match = cleaned.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/)
      if (match) {
        return !match[2] ? match[1] : `(${match[1]}) ${match[2]}${match[3] ? '-' + match[3] : ''}`
      }
    }
    return value
  }

  const handleCurrencyMask = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const number = parseInt(cleaned) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(number)
  }

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleFieldChange = (field: string, value: any) => {
    setIsDirty(true)
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!nome.trim()) newErrors.nome = 'Nome completo é obrigatório'
    if (!emailCorporativo.trim()) newErrors.emailCorporativo = 'Email corporativo é obrigatório'
    else if (!validateEmail(emailCorporativo)) newErrors.emailCorporativo = 'Email inválido'
    if (emailPessoal && !validateEmail(emailPessoal)) newErrors.emailPessoal = 'Email inválido'
    if (!time) newErrors.time = 'Time é obrigatório'
    if (!cargo) newErrors.cargo = 'Cargo é obrigatório'
    if (dataEntrada && dataInicioCargo && dataInicioCargo < dataEntrada) {
      newErrors.dataInicioCargo = 'Data de início no cargo deve ser posterior à data de entrada'
    }
    if (status === 'Desligado' && !dataDesligamento) {
      newErrors.dataDesligamento = 'Data de desligamento é obrigatória para status Desligado'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }

    setIsLoading(true)
    
    const formData = {
      nome,
      nomeSocial,
      emailCorporativo,
      emailPessoal,
      telefone,
      time,
      cargo,
      nivel,
      dataEntrada,
      dataInicioCargo,
      status,
      dataDesligamento,
      salario,
      projects,
      tags: selectedTags,
    }

    console.log('[v0] Form data:', formData)

    setTimeout(() => {
      setIsLoading(false)
      toast.success('🦖 Pessoa atualizada com sucesso!')
      setIsDirty(false)
    }, 1500)
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true)
    } else {
      window.history.back()
    }
  }

  const handleAddProject = () => {
    setProjects([...projects, {
      id: Math.random().toString(),
      nome: '',
      dataInicio: undefined,
      dataFim: undefined,
    }])
  }

  const handleRemoveProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id))
    setIsDirty(true)
  }

  const handleProjectChange = (id: string, field: keyof Project, value: any) => {
    setProjects(projects.map(p => p.id === id ? { ...p, [field]: value } : p))
    setIsDirty(true)
  }

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
      setIsDirty(true)
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
    setIsDirty(true)
  }

  const handleCreateNewTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()])
      setNewTag('')
      setIsDirty(true)
    }
  }

  return (
    <DashboardShell>
      <div className="flex-1 space-y-6 p-8 pb-32">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <span className="hover:text-foreground cursor-pointer">Pessoas</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Editar Pessoa</span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Pessoa</h1>
          <p className="text-muted-foreground mt-1">Atualize os dados de {nome}</p>
        </div>

        {/* Tabbed Form - Same structure as nova/page.tsx */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="profissionais">Dados Profissionais</TabsTrigger>
            <TabsTrigger value="financeiros">Dados Financeiros</TabsTrigger>
            <TabsTrigger value="projetos">Projetos/Produtos</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>

          {/* TAB 1: Dados Pessoais */}
          <TabsContent value="pessoais" className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold">
                  {nome ? nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AP'}
                </div>
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border-2 border-background hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium">Foto do perfil</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou GIF. Máximo 2MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome Completo <span className="text-error">*</span></Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value)
                    handleFieldChange('nome', e.target.value)
                  }}
                  onBlur={() => {
                    if (!nome.trim()) setErrors(prev => ({ ...prev, nome: 'Nome completo é obrigatório' }))
                  }}
                  className={cn(errors.nome && 'border-error focus-visible:ring-error')}
                  placeholder="Digite o nome completo"
                />
                {errors.nome && <p className="text-xs text-error mt-1">{errors.nome}</p>}
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="nomeSocial">Nome Social</Label>
                  <Popover>
                    <PopoverTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </PopoverTrigger>
                    <PopoverContent className="text-sm">
                      Nome pelo qual a pessoa prefere ser chamada
                    </PopoverContent>
                  </Popover>
                </div>
                <Input
                  id="nomeSocial"
                  value={nomeSocial}
                  onChange={(e) => {
                    setNomeSocial(e.target.value)
                    handleFieldChange('nomeSocial', e.target.value)
                  }}
                  placeholder="Digite o nome social (opcional)"
                />
              </div>

              <div>
                <Label htmlFor="emailCorporativo">Email Corporativo <span className="text-error">*</span></Label>
                <Input
                  id="emailCorporativo"
                  type="email"
                  value={emailCorporativo}
                  onChange={(e) => {
                    setEmailCorporativo(e.target.value)
                    handleFieldChange('emailCorporativo', e.target.value)
                  }}
                  onBlur={() => {
                    if (!emailCorporativo.trim()) {
                      setErrors(prev => ({ ...prev, emailCorporativo: 'Email corporativo é obrigatório' }))
                    } else if (!validateEmail(emailCorporativo)) {
                      setErrors(prev => ({ ...prev, emailCorporativo: 'Email inválido' }))
                    }
                  }}
                  className={cn(errors.emailCorporativo && 'border-error focus-visible:ring-error')}
                  placeholder="exemplo@orgzilla.com"
                />
                {errors.emailCorporativo && <p className="text-xs text-error mt-1">{errors.emailCorporativo}</p>}
              </div>

              <div>
                <Label htmlFor="emailPessoal">Email Pessoal</Label>
                <Input
                  id="emailPessoal"
                  type="email"
                  value={emailPessoal}
                  onChange={(e) => {
                    setEmailPessoal(e.target.value)
                    handleFieldChange('emailPessoal', e.target.value)
                  }}
                  onBlur={() => {
                    if (emailPessoal && !validateEmail(emailPessoal)) {
                      setErrors(prev => ({ ...prev, emailPessoal: 'Email inválido' }))
                    }
                  }}
                  className={cn(errors.emailPessoal && 'border-error focus-visible:ring-error')}
                  placeholder="exemplo@gmail.com"
                />
                {errors.emailPessoal && <p className="text-xs text-error mt-1">{errors.emailPessoal}</p>}
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => {
                    const masked = handlePhoneMask(e.target.value)
                    setTelefone(masked)
                    handleFieldChange('telefone', masked)
                  }}
                  placeholder="(11) 98765-4321"
                  maxLength={15}
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Dados Profissionais */}
          <TabsContent value="profissionais" className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="time">Time <span className="text-error">*</span></Label>
                <Select value={time} onValueChange={(value) => {
                  setTime(value)
                  handleFieldChange('time', value)
                }}>
                  <SelectTrigger className={cn(errors.time && 'border-error focus:ring-error')}>
                    <SelectValue placeholder="Selecione o time" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_TEAMS.map(team => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.time && <p className="text-xs text-error mt-1">{errors.time}</p>}
              </div>

              <div>
                <Label htmlFor="cargo">Cargo <span className="text-error">*</span></Label>
                <Select value={cargo} onValueChange={(value) => {
                  setCargo(value)
                  handleFieldChange('cargo', value)
                }}>
                  <SelectTrigger className={cn(errors.cargo && 'border-error focus:ring-error')}>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CARGOS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cargo && <p className="text-xs text-error mt-1">{errors.cargo}</p>}
              </div>

              <div>
                <Label>Nível</Label>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-base px-4 py-1 text-white">
                    {nivel}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Preenchido automaticamente baseado no cargo</p>
                </div>
              </div>

              <div>
                <Label>Data de Entrada</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {dataEntrada ? format(dataEntrada, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataEntrada}
                      onSelect={(date) => {
                        setDataEntrada(date)
                        handleFieldChange('dataEntrada', date)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Data Início no Cargo Atual</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", errors.dataInicioCargo && 'border-error')}>
                      {dataInicioCargo ? format(dataInicioCargo, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataInicioCargo}
                      onSelect={(date) => {
                        setDataInicioCargo(date)
                        handleFieldChange('dataInicioCargo', date)
                      }}
                      disabled={(date) => dataEntrada ? date < dataEntrada : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.dataInicioCargo && <p className="text-xs text-error mt-1">{errors.dataInicioCargo}</p>}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => {
                  setStatus(value)
                  handleFieldChange('status', value)
                  if (value !== 'Desligado') {
                    setDataDesligamento(undefined)
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Férias">Férias</SelectItem>
                    <SelectItem value="Licença">Licença</SelectItem>
                    <SelectItem value="Afastamento">Afastamento</SelectItem>
                    <SelectItem value="Desligado">Desligado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === 'Desligado' && (
                <div>
                  <Label>Data de Desligamento <span className="text-error">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", errors.dataDesligamento && 'border-error')}>
                        {dataDesligamento ? format(dataDesligamento, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataDesligamento}
                        onSelect={(date) => {
                          setDataDesligamento(date)
                          handleFieldChange('dataDesligamento', date)
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dataDesligamento && <p className="text-xs text-error mt-1">{errors.dataDesligamento}</p>}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: Dados Financeiros */}
          <TabsContent value="financeiros" className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900">Dados sensíveis - visível apenas para gestores da hierarquia</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="salario">Salário Atual</Label>
                <Input
                  id="salario"
                  value={salario}
                  onChange={(e) => {
                    const masked = handleCurrencyMask(e.target.value)
                    setSalario(masked)
                    handleFieldChange('salario', masked)
                  }}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <Label>Data Último Reajuste</Label>
                <Input disabled value="01/06/2024" />
              </div>

              <div className="md:col-span-2">
                <Label>Motivo Último Reajuste</Label>
                <Textarea disabled value="Promoção para Senior Engineer - reconhecimento por liderança técnica e mentoria da equipe" rows={3} />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-900">Histórico completo de reajustes disponível na visualização</p>
            </div>
          </TabsContent>

          {/* TAB 4: Projetos/Produtos */}
          <TabsContent value="projetos" className="bg-white rounded-lg shadow p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Alocações em Projetos</h3>
                <p className="text-sm text-muted-foreground">Gerencie em quais projetos esta pessoa está alocada</p>
              </div>
              <Button onClick={handleAddProject} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Alocação
              </Button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma alocação de projeto ainda</p>
                <p className="text-sm mt-1">Clique em "Adicionar Alocação" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 space-y-4 relative">
                    <button
                      onClick={() => handleRemoveProject(project.id)}
                      className="absolute top-4 right-4 text-error hover:bg-error/10 p-1 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-8">
                      <div>
                        <Label>Projeto <span className="text-error">*</span></Label>
                        <Select 
                          value={project.nome} 
                          onValueChange={(value) => handleProjectChange(project.id, 'nome', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o projeto" />
                          </SelectTrigger>
                          <SelectContent>
                            {MOCK_PROJECTS.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Data Início <span className="text-error">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              {project.dataInicio ? format(project.dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={project.dataInicio}
                              onSelect={(date) => handleProjectChange(project.id, 'dataInicio', date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <Label>Data Fim</Label>
                          <Popover>
                            <PopoverTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </PopoverTrigger>
                            <PopoverContent className="text-sm">
                              Deixe vazio se for alocação atual
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              {project.dataFim ? format(project.dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Alocação atual'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={project.dataFim}
                              onSelect={(date) => handleProjectChange(project.id, 'dataFim', date)}
                              disabled={(date) => project.dataInicio ? date < project.dataInicio : false}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 5: Tags */}
          <TabsContent value="tags" className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Tags de Habilidades</h3>
              <p className="text-sm text-muted-foreground">Adicione tags para identificar habilidades e características</p>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-sm px-3 py-1 text-white">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-error"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Tag Section */}
            <div className="space-y-4">
              <div>
                <Label>Selecionar tags existentes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {MOCK_TAGS.filter(tag => !selectedTags.includes(tag)).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="px-3 py-1 text-sm border rounded-full hover:bg-accent/10 hover:border-accent transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Criar nova tag</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateNewTag()
                      }
                    }}
                    placeholder="Digite o nome da nova tag"
                  />
                  <Button onClick={handleCreateNewTag} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Inline Action Buttons */}
        <div className="bg-white rounded-lg shadow border-t p-6 flex items-center justify-between">
          <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => window.history.back()} className="bg-error hover:bg-error/90">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  )
}
