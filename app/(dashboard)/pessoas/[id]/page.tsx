'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, Mail, Phone, Pencil, MoreVertical, TrendingUp, Briefcase, Calendar, Users, Lock, MessageSquare, ChevronRight, Home, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getPessoaById } from '@/app/actions/pessoas.actions'

// Type for person data
type PessoaData = {
  id: string
  nome: string
  nome_social: string | null
  email_corporativo: string
  email_pessoal: string | null
  telefone: string | null
  foto_url: string | null
  cargo: {
    nome: string
    trilha?: { nome: string }
    nivel?: { nome: string }
  } | null
  time: {
    id: string
    nome: string
    gestor?: { id: string; nome: string } | null
  } | null
  data_entrada: string | null
  data_inicio_cargo_atual: string | null
  status: string
  salario_atual?: number | null
  data_ultimo_reajuste?: string | null
  motivo_ultimo_reajuste?: string | null
  ativo: boolean
  created_at: string
}

// Keep mock data for now for items not yet implemented
const PERSON_DATA_MOCK = {
  id: 'p1',
  nome: 'Maria Santos',
  nomeSocial: null,
  emailCorporativo: 'maria@orgzilla.com',
  emailPessoal: 'maria.santos@gmail.com',
  telefone: '(11) 98765-4321',
  avatar: '/avatar-maria.jpg',
  cargo: { 
    id: 'c1', 
    nome: 'Senior Engineer', 
    nivel: 'L4', 
    trilha: 'Engenharia de Software',
    dataInicio: '2024-06-20'
  },
  time: { 
    id: 't1', 
    nome: 'Engenharia', 
    breadcrumb: 'Tecnologia > Engenharia' 
  },
  gestorDireto: { 
    id: 'g1', 
    nome: 'João Silva', 
    avatar: '/avatar-joao.jpg' 
  },
  dataEntrada: '2023-01-15',
  status: 'Ativo',
  salarioAtual: 15000.00,
  dataUltimoReajuste: '2024-06-20',
  motivoUltimoReajuste: 'Promoção para L4',
  tags: ['Frontend', 'React', 'Leadership', 'Mentor'],
  projetosAtivos: [
    { id: 'proj1', nome: 'Projeto Alpha', status: 'Ativo', dataInicio: '2024-01-15' }
  ],
  projetosAnteriores: [
    { id: 'proj2', nome: 'Sistema Core', status: 'Concluído', dataInicio: '2023-06-01', dataFim: '2023-12-31' }
  ]
}

const TIMELINE_DATA = [
  { tipo: 'entrada', titulo: 'Entrou na empresa', data: '2023-01-15', detalhes: 'Como Engineer I no time de Backend' },
  { tipo: 'promocao', titulo: 'Promovido para Engineer II', data: '2023-07-01', detalhes: 'De L2 para L3' },
  { tipo: 'mudanca_time', titulo: 'Mudou para time de Engenharia', data: '2023-10-15', detalhes: 'De Backend para Engenharia (time pai)' },
  { tipo: 'projeto', titulo: 'Alocado no Projeto Alpha', data: '2024-01-15', detalhes: 'Início da alocação' },
  { tipo: 'promocao', titulo: 'Promovido para Senior Engineer', data: '2024-06-20', detalhes: 'De L3 para L4' }
]

const SALARY_HISTORY = [
  { data: '2024-06-20', anterior: 12000, novo: 15000, variacao: '+25%', variacaoValor: '+R$ 3.000', motivo: 'Promoção para L4', registradoPor: 'João Silva' },
  { data: '2023-07-01', anterior: 8000, novo: 12000, variacao: '+50%', variacaoValor: '+R$ 4.000', motivo: 'Promoção para L3', registradoPor: 'João Silva' },
  { data: '2023-01-15', anterior: 0, novo: 8000, variacao: 'Inicial', variacaoValor: '-', motivo: 'Contratação', registradoPor: 'RH' }
]

const SALARY_CHART_DATA = [
  { mes: 'Jan/23', salario: 8000 },
  { mes: 'Jul/23', salario: 12000 },
  { mes: 'Jun/24', salario: 15000 }
]

const MOCK_NOTES = [
  { 
    id: '1',
    autor: 'João Silva', 
    autorAvatar: '/avatar-joao.jpg', 
    data: '2024-11-10T14:30:00', 
    conteudo: 'Maria mostrou excelente liderança no Projeto Alpha. Considerar para próxima promoção.' 
  },
  { 
    id: '2',
    autor: 'Carlos Mendes', 
    autorAvatar: '/avatar-carlos.jpg', 
    data: '2024-09-15T09:20:00', 
    conteudo: 'Participou como mentor no onboarding de 3 novos engenheiros.' 
  }
]

export default function PersonProfilePage() {
  const router = useRouter()
  const params = useParams()
  const pessoaId = params.id as string

  const [activeTab, setActiveTab] = useState('geral')
  const [isLoading, setIsLoading] = useState(true)
  const [pessoa, setPessoa] = useState<PessoaData | null>(null)
  const [canViewSalary, setCanViewSalary] = useState(false)
  const [notes, setNotes] = useState(MOCK_NOTES)
  const [newNote, setNewNote] = useState('')

  // Load person data on mount
  useEffect(() => {
    async function loadPessoa() {
      setIsLoading(true)
      try {
        const result = await getPessoaById(pessoaId)
        if (result.success && result.data) {
          setPessoa(result.data as PessoaData)
          // Check if salary data is present (means user has permission)
          setCanViewSalary('salario_atual' in result.data)
        } else {
          toast.error(result.error || 'Erro ao carregar pessoa')
          router.push('/pessoas')
        }
      } catch (error) {
        console.error('Erro ao carregar pessoa:', error)
        toast.error('Erro inesperado ao carregar pessoa')
        router.push('/pessoas')
      } finally {
        setIsLoading(false)
      }
    }

    loadPessoa()
  }, [pessoaId, router])

  const calculateTimeInCompany = (dataEntrada: string | null) => {
    if (!dataEntrada) return '-'
    const start = new Date(dataEntrada)
    const now = new Date()
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'hoje'
    if (days === 1) return 'há 1 dia'
    if (days < 30) return `há ${days} dias`
    const months = Math.floor(days / 30)
    if (months === 1) return 'há 1 mês'
    return `há ${months} meses`
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    
    const note = {
      id: Date.now().toString(),
      autor: 'Você',
      autorAvatar: '/avatar-current-user.jpg',
      data: new Date().toISOString(),
      conteudo: newNote
    }
    
    setNotes([note, ...notes])
    setNewNote('')
    toast.success('Anotação adicionada com sucesso!')
  }

  const getEventIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return '🎉'
      case 'promocao': return '⬆️'
      case 'mudanca_time': return '👥'
      case 'projeto': return '📁'
      default: return '●'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800'
      case 'Férias': return 'bg-blue-100 text-blue-800'
      case 'Licença': return 'bg-orange-100 text-orange-800'
      case 'Afastamento': return 'bg-yellow-100 text-yellow-800'
      case 'Desligado': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  // Error state (pessoa not found)
  if (!pessoa) {
    return (
      <DashboardShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold">Pessoa não encontrada</p>
            <Button onClick={() => router.push('/pessoas')}>Voltar para a lista</Button>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="flex-1 space-y-6 p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <Link href="/pessoas" className="hover:text-foreground">Pessoas</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{pessoa.nome}</span>
        </div>

        {/* Header Section */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={pessoa.foto_url || "/placeholder.svg"} alt={pessoa.nome} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
                  {pessoa.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and Status */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#1A2734]">{pessoa.nome}</h1>
              {pessoa.nome_social && (
                <p className="text-sm text-muted-foreground mt-1">(Nome social: {pessoa.nome_social})</p>
              )}
              <Badge className={`mt-2 ${getStatusColor(pessoa.status)}`}>
                {pessoa.status}
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-2 text-sm">
              <a href={`mailto:${pessoa.email_corporativo}`} className="flex items-center gap-2 text-accent hover:underline">
                <Mail className="h-4 w-4" />
                {pessoa.email_corporativo}
              </a>
              {pessoa.telefone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {pessoa.telefone}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href={`/pessoas/${pessoa.id}/editar`}>
                <Button>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log('Mover para outro time')}>
                    Mover para Outro Time
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Adicionar a projeto')}>
                    Adicionar a Projeto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Alterar status')}>
                    Alterar Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Ver histórico completo')}>
                    Ver Histórico Completo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Profile Summary Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Position */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Posição Atual</p>
              {pessoa.cargo ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">{pessoa.cargo.nome}</p>
                    {pessoa.cargo.nivel && (
                      <Badge variant="secondary" className="bg-primary text-white">
                        {pessoa.cargo.nivel.nome}
                      </Badge>
                    )}
                  </div>
                  {pessoa.data_inicio_cargo_atual && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Desde {formatDateShort(pessoa.data_inicio_cargo_atual)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sem cargo definido</p>
              )}
            </div>

            {/* Team */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Time</p>
              {pessoa.time ? (
                <>
                  <p className="text-lg font-semibold">{pessoa.time.nome}</p>
                  <Link href={`/times/${pessoa.time.id}`} className="text-xs text-accent hover:underline">
                    Ver time
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sem time definido</p>
              )}
            </div>

            {/* Time in Company */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tempo de Casa</p>
              <p className="text-lg font-semibold">{calculateTimeInCompany(pessoa.data_entrada)}</p>
              {pessoa.data_entrada && (
                <p className="text-xs text-muted-foreground mt-1">
                  Entrada: {formatDateShort(pessoa.data_entrada)}
                </p>
              )}
            </div>

            {/* Career Track */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trilha</p>
              {pessoa.cargo?.trilha ? (
                <div className="flex items-center gap-2">
                  <p className="text-lg">{pessoa.cargo.trilha.nome}</p>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem trilha definida</p>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
            <TabsTrigger value="historico">Histórico Profissional</TabsTrigger>
            <TabsTrigger value="salarial">Histórico Salarial</TabsTrigger>
            <TabsTrigger value="projetos">Projetos</TabsTrigger>
            <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
          </TabsList>

          {/* TAB 1: General Information */}
          <TabsContent value="geral" className="space-y-4">
            {/* Personal Data */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Dados Pessoais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{pessoa.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome Social</p>
                  <p className="font-medium">{pessoa.nome_social || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Corporativo</p>
                  <a href={`mailto:${pessoa.email_corporativo}`} className="font-medium text-accent hover:underline">
                    {pessoa.email_corporativo}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Pessoal</p>
                  <p className="font-medium">{pessoa.email_pessoal || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{pessoa.telefone || '-'}</p>
                </div>
              </div>
            </Card>

            {/* Professional Data */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Dados Profissionais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cargo Atual</p>
                  <p className="font-medium">{pessoa.cargo?.nome || 'Sem cargo definido'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nível</p>
                  {pessoa.cargo?.nivel ? (
                    <Badge variant="secondary" className="bg-primary text-white">{pessoa.cargo.nivel.nome}</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trilha de Carreira</p>
                  <p className="font-medium">{pessoa.cargo?.trilha?.nome || 'Sem trilha definida'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  {pessoa.time ? (
                    <Link href={`/times/${pessoa.time.id}`} className="font-medium text-accent hover:underline">
                      {pessoa.time.nome}
                    </Link>
                  ) : (
                    <p className="font-medium">Sem time definido</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gestor Direto</p>
                  {pessoa.time?.gestor ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{pessoa.time.gestor.nome[0]}</AvatarFallback>
                      </Avatar>
                      <Link href={`/pessoas/${pessoa.time.gestor.id}`} className="font-medium text-accent hover:underline">
                        {pessoa.time.gestor.nome}
                      </Link>
                    </div>
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Entrada</p>
                  <p className="font-medium">{pessoa.data_entrada ? formatDate(pessoa.data_entrada) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Início Cargo Atual</p>
                  <p className="font-medium">{pessoa.data_inicio_cargo_atual ? formatDate(pessoa.data_inicio_cargo_atual) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(pessoa.status)}>{pessoa.status}</Badge>
                </div>
              </div>
            </Card>

            {/* Current Projects */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Projetos Atuais</h3>
                <Button variant="link" onClick={() => setActiveTab('projetos')}>
                  Ver Todos os Projetos
                </Button>
              </div>
              {PERSON_DATA.projetosAtivos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Não está alocado em projetos atualmente
                </p>
              ) : (
                <div className="space-y-3">
                  {PERSON_DATA.projetosAtivos.map(projeto => (
                    <div key={projeto.id} className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <Link href={`/projetos/${projeto.id}`} className="font-medium text-accent hover:underline">
                          {projeto.nome}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Desde: {formatDateShort(projeto.dataInicio)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(projeto.status)}>{projeto.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Tags */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tags</h3>
              {PERSON_DATA.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem tags</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {PERSON_DATA.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-sm text-white">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* TAB 2: Professional History */}
          <TabsContent value="historico">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Linha do Tempo Profissional</h3>
              <div className="space-y-6">
                {TIMELINE_DATA.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                        {getEventIcon(event.tipo)}
                      </div>
                      {index < TIMELINE_DATA.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="font-semibold">{event.titulo}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(event.data)}</p>
                      <p className="text-sm mt-2">{event.detalhes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: Salary History */}
          <TabsContent value="salarial">
            {!canViewSalary ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Informações Restritas</h3>
                  <p className="text-muted-foreground">
                    Informações financeiras disponíveis apenas para gestores da hierarquia
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Current Salary */}
                <Card className="bg-gray-50 p-6">
                  <p className="text-sm text-muted-foreground mb-2">Salário Atual</p>
                  <p className="text-3xl font-bold">
                    {pessoa.salario_atual
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pessoa.salario_atual)
                      : 'Não informado'
                    }
                  </p>
                  {pessoa.data_ultimo_reajuste && (
                    <>
                      <p className="text-sm text-muted-foreground mt-2">
                        Último reajuste: {formatDateShort(pessoa.data_ultimo_reajuste)}
                      </p>
                      {pessoa.motivo_ultimo_reajuste && (
                        <p className="text-sm font-medium mt-1">{pessoa.motivo_ultimo_reajuste}</p>
                      )}
                    </>
                  )}
                </Card>

                {/* Placeholder for future history */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Histórico de Reajustes</h3>
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Histórico de reajustes será implementado em breve
                  </p>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: Projects */}
          <TabsContent value="projetos" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Total Projetos</p>
                <p className="text-2xl font-bold">
                  {PERSON_DATA.projetosAtivos.length + PERSON_DATA.projetosAnteriores.length}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Projetos Ativos</p>
                <p className="text-2xl font-bold">{PERSON_DATA.projetosAtivos.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Tempo Médio por Projeto</p>
                <p className="text-2xl font-bold">6 meses</p>
              </Card>
            </div>

            {/* Active Projects */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Projetos Ativos</h3>
              {PERSON_DATA.projetosAtivos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Não está alocado em projetos atualmente
                </p>
              ) : (
                <div className="space-y-3">
                  {PERSON_DATA.projetosAtivos.map(projeto => (
                    <div key={projeto.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-lg font-bold">{projeto.nome}</p>
                        <Badge className={getStatusColor(projeto.status)}>{projeto.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Desde {formatDate(projeto.dataInicio)}
                      </p>
                      <Link href={`/projetos/${projeto.id}`}>
                        <Button variant="link" className="p-0 h-auto">Ver Projeto</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Past Projects */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Projetos Anteriores</h3>
              {PERSON_DATA.projetosAnteriores.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sem projetos anteriores
                </p>
              ) : (
                <div className="space-y-3">
                  {PERSON_DATA.projetosAnteriores.map(projeto => (
                    <div key={projeto.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-lg font-bold">{projeto.nome}</p>
                        <Badge className={getStatusColor(projeto.status)}>{projeto.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDateShort(projeto.dataInicio)} até {formatDateShort(projeto.dataFim!)} (5 meses)
                      </p>
                      <Link href={`/projetos/${projeto.id}`}>
                        <Button variant="link" className="p-0 h-auto">Ver Projeto</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* TAB 5: Notes */}
          <TabsContent value="anotacoes" className="space-y-4">
            {/* Add Note */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Adicionar Nova Anotação</h3>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Adicionar nova anotação..."
                rows={4}
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">{newNote.length}/1000 caracteres</p>
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                  Salvar Anotação
                </Button>
              </div>
            </Card>

            {/* Notes List */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Anotações</h3>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma anotação ainda. Adicione a primeira!
                </p>
              ) : (
                <div className="space-y-4">
                  {notes.map(note => (
                    <div key={note.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={note.autorAvatar || "/placeholder.svg"} />
                          <AvatarFallback>{note.autor[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold">{note.autor}</p>
                            <p className="text-sm text-muted-foreground">{getTimeAgo(note.data)}</p>
                          </div>
                          <p className="text-sm">{note.conteudo}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
