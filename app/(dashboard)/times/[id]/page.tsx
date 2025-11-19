'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ChevronRight, Home, Users, MoreVertical, Loader2, TrendingUp, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { getTimeById } from '@/app/actions/times.actions'

type TimeData = {
  id: string
  nome: string
  descricao: string | null
  time_pai: {
    id: string
    nome: string
  } | null
  gestor: {
    id: string
    nome: string
  } | null
  membros?: Array<{
    id: string
    nome: string
    cargo?: { nome: string }
  }>
  ativo: boolean
  created_at: string
}

export default function TimeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const timeId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [time, setTime] = useState<TimeData | null>(null)

  useEffect(() => {
    loadTime()
  }, [timeId])

  async function loadTime() {
    setIsLoading(true)
    try {
      const result = await getTimeById(timeId)
      if (result.success && result.data) {
        setTime(result.data as TimeData)
      } else {
        toast.error(result.error || 'Erro ao carregar time')
        router.push('/times')
      }
    } catch (error) {
      console.error('Erro ao carregar time:', error)
      toast.error('Erro inesperado ao carregar time')
      router.push('/times')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getStatusColor = (ativo: boolean) => {
    return ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando dados do time...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  // Error state
  if (!time) {
    return (
      <DashboardShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold">Time não encontrado</p>
            <Button onClick={() => router.push('/times')}>Voltar para a lista</Button>
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
          <Link href="/times" className="hover:text-foreground">Times</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{time.nome}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#1A2734]">{time.nome}</h1>
            {time.descricao && (
              <p className="text-muted-foreground max-w-2xl">{time.descricao}</p>
            )}
            <Badge className={getStatusColor(time.ativo)}>
              {time.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/times/${time.id}/editar`)}>
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log('Ver organograma')}>
                  Ver Organograma
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Adicionar pessoa')}>
                  Adicionar Pessoa ao Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Alterar status')}>
                  Alterar Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Team Info */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Time Pai</p>
                {time.time_pai ? (
                  <Link href={`/times/${time.time_pai.id}`} className="font-medium text-accent hover:underline">
                    {time.time_pai.nome}
                  </Link>
                ) : (
                  <p className="font-medium">Time raiz</p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Gestor</p>
                {time.gestor ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{time.gestor.nome[0]}</AvatarFallback>
                    </Avatar>
                    <Link href={`/pessoas/${time.gestor.id}`} className="font-medium text-accent hover:underline">
                      {time.gestor.nome}
                    </Link>
                  </div>
                ) : (
                  <p className="font-medium">Sem gestor definido</p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Criado em</p>
                <p className="font-medium">{formatDate(time.created_at)}</p>
              </div>
            </div>
          </Card>

          {/* Members Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Membros</h3>
            </div>
            <p className="text-3xl font-bold">{time.membros?.length || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {time.membros?.length === 1 ? 'pessoa no time' : 'pessoas no time'}
            </p>
          </Card>

          {/* Sub-teams Card */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Times Filhos</h3>
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-muted-foreground mt-1">sub-times diretos</p>
          </Card>
        </div>

        {/* Members List */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Membros do Time</h3>
          {time.membros && time.membros.length > 0 ? (
            <div className="space-y-3">
              {time.membros.map(membro => (
                <div key={membro.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{membro.nome[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/pessoas/${membro.id}`} className="font-medium text-accent hover:underline">
                        {membro.nome}
                      </Link>
                      {membro.cargo && (
                        <p className="text-sm text-muted-foreground">{membro.cargo.nome}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum membro no time ainda
            </p>
          )}
        </Card>
      </div>
    </DashboardShell>
  )
}
