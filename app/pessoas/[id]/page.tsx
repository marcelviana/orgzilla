'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { ArrowLeft, Mail, Phone, Pencil, MoreVertical, TrendingUp, Briefcase, Calendar, Users, Lock, MessageSquare, ChevronRight, Home } from 'lucide-react'
import { toast } from 'sonner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data for the person
const PERSON_DATA = {
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
  const [activeTab, setActiveTab] = useState('geral')
  const [isManager] = useState(true) // Mock: user is manager
  const [notes, setNotes] = useState(MOCK_NOTES)
  const [newNote, setNewNote] = useState('')

  const calculateTimeInCompany = () => {
    const start = new Date(PERSON_DATA.dataEntrada)
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

  return (
    <DashboardShell>
      <div className="flex-1 space-y-6 p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <Link href="/pessoas" className="hover:text-foreground">Pessoas</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{PERSON_DATA.nome}</span>
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
                <AvatarImage src={PERSON_DATA.avatar || "/placeholder.svg"} alt={PERSON_DATA.nome} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
                  {PERSON_DATA.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and Status */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#1A2734]">{PERSON_DATA.nome}</h1>
              {PERSON_DATA.nomeSocial && (
                <p className="text-sm text-muted-foreground mt-1">(Nome social: {PERSON_DATA.nomeSocial})</p>
              )}
              <Badge className={`mt-2 ${getStatusColor(PERSON_DATA.status)}`}>
                {PERSON_DATA.status}
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-2 text-sm">
              <a href={`mailto:${PERSON_DATA.emailCorporativo}`} className="flex items-center gap-2 text-accent hover:underline">
                <Mail className="h-4 w-4" />
                {PERSON_DATA.emailCorporativo}
              </a>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {PERSON_DATA.telefone}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href={`/pessoas/${PERSON_DATA.id}/editar`}>
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
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{PERSON_DATA.cargo.nome}</p>
                <Badge variant="secondary" className="bg-primary text-white">
                  {PERSON_DATA.cargo.nivel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Desde {formatDateShort(PERSON_DATA.cargo.dataInicio)}
              </p>
            </div>

            {/* Team */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Time</p>
              <p className="text-lg font-semibold">{PERSON_DATA.time.nome}</p>
              <Link href={`/times/${PERSON_DATA.time.id}`} className="text-xs text-accent hover:underline">
                Ver time
              </Link>
              <p className="text-xs text-muted-foreground mt-1">{PERSON_DATA.time.breadcrumb}</p>
            </div>

            {/* Time in Company */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tempo de Casa</p>
              <p className="text-lg font-semibold">{calculateTimeInCompany()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Entrada: {formatDateShort(PERSON_DATA.dataEntrada)}
              </p>
            </div>

            {/* Career Track */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trilha</p>
              <div className="flex items-center gap-2">
                <p className="text-lg">{PERSON_DATA.cargo.trilha}</p>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
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
                  <p className="font-medium">{PERSON_DATA.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome Social</p>
                  <p className="font-medium">{PERSON_DATA.nomeSocial || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Corporativo</p>
                  <a href={`mailto:${PERSON_DATA.emailCorporativo}`} className="font-medium text-accent hover:underline">
                    {PERSON_DATA.emailCorporativo}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Pessoal</p>
                  <p className="font-medium">{PERSON_DATA.emailPessoal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{PERSON_DATA.telefone}</p>
                </div>
              </div>
            </Card>

            {/* Professional Data */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Dados Profissionais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cargo Atual</p>
                  <p className="font-medium">{PERSON_DATA.cargo.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nível</p>
                  <Badge variant="secondary" className="bg-primary text-white">{PERSON_DATA.cargo.nivel}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trilha de Carreira</p>
                  <p className="font-medium">{PERSON_DATA.cargo.trilha}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <Link href={`/times/${PERSON_DATA.time.id}`} className="font-medium text-accent hover:underline">
                    {PERSON_DATA.time.nome}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gestor Direto</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={PERSON_DATA.gestorDireto.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{PERSON_DATA.gestorDireto.nome[0]}</AvatarFallback>
                    </Avatar>
                    <Link href={`/pessoas/${PERSON_DATA.gestorDireto.id}`} className="font-medium text-accent hover:underline">
                      {PERSON_DATA.gestorDireto.nome}
                    </Link>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Entrada</p>
                  <p className="font-medium">{formatDate(PERSON_DATA.dataEntrada)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Início Cargo Atual</p>
                  <p className="font-medium">{formatDate(PERSON_DATA.cargo.dataInicio)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(PERSON_DATA.status)}>{PERSON_DATA.status}</Badge>
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
            {!isManager ? (
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
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(PERSON_DATA.salarioAtual)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Último reajuste: há 5 meses ({formatDateShort(PERSON_DATA.dataUltimoReajuste)})
                  </p>
                  <p className="text-sm font-medium mt-1">{PERSON_DATA.motivoUltimoReajuste}</p>
                </Card>

                {/* Salary Chart */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Evolução Salarial</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={SALARY_CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => 
                          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                        }
                      />
                      <Line type="monotone" dataKey="salario" stroke="#FF7A00" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Salary History Table */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Histórico de Reajustes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="pb-3">Data</th>
                          <th className="pb-3">Salário Anterior</th>
                          <th className="pb-3">Salário Novo</th>
                          <th className="pb-3">Variação</th>
                          <th className="pb-3">Motivo</th>
                          <th className="pb-3">Registrado por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SALARY_HISTORY.map((item, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3">{formatDateShort(item.data)}</td>
                            <td className="py-3">
                              {item.anterior > 0 
                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.anterior)
                                : '-'
                              }
                            </td>
                            <td className="py-3">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.novo)}
                            </td>
                            <td className="py-3">
                              <span className={item.variacao !== 'Inicial' ? 'text-green-600 font-medium' : ''}>
                                {item.variacao} {item.variacaoValor !== '-' && `(${item.variacaoValor})`}
                              </span>
                            </td>
                            <td className="py-3">{item.motivo}</td>
                            <td className="py-3">{item.registradoPor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
