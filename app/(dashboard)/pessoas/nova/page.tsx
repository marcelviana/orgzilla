'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { handleError } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Upload, Info, Plus, X, Loader2, Lock } from 'lucide-react'
import { TableSkeleton, Breadcrumb } from '@/components/shared'
import { cn } from '@/lib/utils'
import { createPessoa } from '@/app/actions/pessoas.actions'
import { getTimesParaFiltro, getCargosParaFiltro } from '@/app/actions/pessoas.actions'
import { getCurrentUser } from '@/app/actions/auth.actions'
import { getProjetosParaFiltro } from '@/app/actions/projetos.actions'
import { getTagsParaFiltro } from '@/app/actions/tags.actions'

interface Project {
  id: string
  nome: string
  dataInicio: Date | undefined
  dataFim: Date | undefined
}

export default function NovasPessoasPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  // Dados dinâmicos
  const [times, setTimes] = useState<Array<{ id: string; nome: string }>>([])
  const [cargos, setCargos] = useState<Array<{ id: string; nome: string }>>([])
  const [projetos, setProjetos] = useState<Array<{ id: string; nome: string }>>([])
  const [tags, setTags] = useState<Array<{ id: string; nome: string }>>([])
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState('pessoais')

  // Form fields
  const [nome, setNome] = useState('')
  const [nomeSocial, setNomeSocial] = useState('')
  const [emailCorporativo, setEmailCorporativo] = useState('')
  const [emailPessoal, setEmailPessoal] = useState('')
  const [telefone, setTelefone] = useState('')
  const [time, setTime] = useState('')
  const [cargo, setCargo] = useState('')
  const [dataEntrada, setDataEntrada] = useState<Date | undefined>(undefined)
  const [dataInicioCargo, setDataInicioCargo] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState('Ativo')
  const [dataDesligamento, setDataDesligamento] = useState<Date | undefined>(undefined)
  const [salario, setSalario] = useState('')
  // Remuneração (SENSÍVEL - LGPD): só gestor pode informar salário
  const [canViewSalary, setCanViewSalary] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Carregar dados ao montar
  useEffect(() => {
    async function loadData() {
      try {
        const [timesResult, cargosResult, projetosResult, tagsResult, usuario] = await Promise.all([
          getTimesParaFiltro(),
          getCargosParaFiltro(),
          getProjetosParaFiltro(),
          getTagsParaFiltro(),
          getCurrentUser(),
        ])

        if (timesResult.success && timesResult.data) {
          setTimes(timesResult.data)
        }

        if (cargosResult.success && cargosResult.data) {
          setCargos(cargosResult.data)
        }

        if (projetosResult.success && projetosResult.data) {
          setProjetos(projetosResult.data)
        }

        if (tagsResult.success && tagsResult.data) {
          setTags(tagsResult.data)
        }

        // Apenas gestores podem informar remuneração (SENSÍVEL - LGPD)
        setCanViewSalary(usuario?.tipo_perfil === 'gestor')
      } catch (error) {
        toast.error(handleError(error, 'database'))
      } finally {
        setDataLoading(false)
      }
    }

    void loadData()
  }, [])

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

  const handleFieldChange = (field: string, _value?: unknown) => {
    setIsDirty(true)
    
    // Clear error when user starts typing
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

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }

    setIsLoading(true)

    try {
      // Preparar dados para a API
      const pessoaData = {
        nome: nome.trim(),
        nome_social: nomeSocial.trim() || null,
        email_corporativo: emailCorporativo.trim(),
        email_pessoal: emailPessoal.trim() || null,
        telefone: telefone || null,
        time_id: time || null,
        cargo_id: cargo || null,
        data_entrada: dataEntrada ? dataEntrada.toISOString().split('T')[0] : null,
        data_inicio_cargo_atual: dataInicioCargo ? dataInicioCargo.toISOString().split('T')[0] : null,
        status: status.toLowerCase() as 'ativo' | 'ferias' | 'licenca' | 'afastamento' | 'desligado',
        data_desligamento: dataDesligamento ? dataDesligamento.toISOString().split('T')[0] : null,
        ativo: true,
        // Remuneração (SENSÍVEL - LGPD): só enviada no fluxo do gestor
        ...(canViewSalary
          ? { salario_atual: salario ? parseFloat(salario.replace(/[^\d,]/g, '').replace(',', '.')) : null }
          : {}),
      }

      const result = await createPessoa(pessoaData)

      if (result.success) {
        toast.successDino('Pessoa criada com sucesso!')
        setIsDirty(false)
        // Redirecionar para a lista ou detalhe
        router.push('/pessoas')
      } else {
        toast.error(result.error || 'Erro ao criar pessoa')
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    } finally {
      setIsLoading(false)
    }
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

  const handleProjectChange = (id: string, field: keyof Project, value: Project[keyof Project]) => {
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
        <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Pessoas", href: "/pessoas" }, { label: "Nova Pessoa" }]} />

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Pessoa</h1>
          <p className="text-muted-foreground mt-1">Preencha os dados para adicionar uma nova pessoa ao time</p>
        </div>

        {dataLoading ? (
          <TableSkeleton rows={4} />
        ) : (
          /* Tabbed Form */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={cn('grid w-full', canViewSalary ? 'grid-cols-5' : 'grid-cols-4')}>
            <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="profissionais">Dados Profissionais</TabsTrigger>
            {canViewSalary && <TabsTrigger value="financeiros">Dados Financeiros</TabsTrigger>}
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
                }} disabled={dataLoading}>
                  <SelectTrigger className={cn(errors.time && 'border-error focus:ring-error')}>
                    <SelectValue placeholder={dataLoading ? "Carregando..." : "Selecione o time"} />
                  </SelectTrigger>
                  <SelectContent>
                    {times.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
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
                }} disabled={dataLoading}>
                  <SelectTrigger className={cn(errors.cargo && 'border-error focus:ring-error')}>
                    <SelectValue placeholder={dataLoading ? "Carregando..." : "Selecione o cargo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cargo && <p className="text-xs text-error mt-1">{errors.cargo}</p>}
              </div>

              <div>
                <Label>Nível</Label>
                <div className="mt-2">
                  {cargo ? (
                    (() => {
                      const cargoSelecionado = cargos.find(c => c.id === cargo)
                      return (
                        <Badge variant="secondary" className="text-base px-4 py-1 text-white">
                          {cargoSelecionado?.nome || 'N/A'}
                        </Badge>
                      )
                    })()
                  ) : (
                    <Badge variant="outline" className="text-base px-4 py-1">
                      Selecione um cargo
                    </Badge>
                  )}
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

          {/* TAB 3: Dados Financeiros (SENSÍVEL - LGPD: apenas gestor) */}
          {canViewSalary && (
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
                <Input disabled value="" placeholder="Sem reajustes" />
              </div>

              <div className="md:col-span-2">
                <Label>Motivo Último Reajuste</Label>
                <Textarea disabled placeholder="Nenhum reajuste registrado" rows={3} />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-900">Histórico completo de reajustes disponível na visualização</p>
            </div>
          </TabsContent>
          )}

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
                            {projetos.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
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
                  {tags.filter(t => !selectedTags.includes(t.nome)).map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleAddTag(t.nome)}
                      className="px-3 py-1 text-sm border rounded-full hover:bg-accent/10 hover:border-accent transition-colors"
                    >
                      + {t.nome}
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
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={() => { void handleSave() }} disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Pessoa'
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
