"use client"

import { Users, Network, Briefcase, FolderKanban, Plus, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { EmptyState } from '@/components/shared'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import Link from "next/link"

type DashboardMetrics = {
  totalPessoas: number
  totalTimes: number
  totalVagas: number
  totalProjetos: number
  tendenciaPessoas: number
  tendenciaTimes: number
  tendenciaVagas: number
  tendenciaProjetos: number
}

type NivelDistribution = {
  nome: string
  value: number
  color: string
}

type TimeDistribution = {
  team: string
  count: number
}

type RecentActivity = {
  text: string
  time: string
  icon: string
  color: string
}

type DashboardContentProps = {
  userName: string
  currentDate: string
  metrics: DashboardMetrics
  nivelDistribution: NivelDistribution[]
  timeDistribution: TimeDistribution[]
  recentActivities: RecentActivity[]
}

const ICON_MAP = {
  Users,
  Network,
  Briefcase,
  FolderKanban,
  TrendingUp,
  Activity,
}

export function DashboardContent({
  userName,
  currentDate,
  metrics,
  nivelDistribution,
  timeDistribution,
  recentActivities,
}: DashboardContentProps) {
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3" />
    if (trend < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "bg-success/10 text-success"
    if (trend < 0) return "bg-danger/10 text-danger"
    return "bg-muted text-muted-foreground"
  }

  const METRIC_CARDS = [
    {
      title: "Total de Pessoas",
      value: metrics.totalPessoas,
      trend: metrics.tendenciaPessoas,
      trendLabel: "este mês",
      icon: Users,
      color: "bg-primary/10 text-primary",
      href: "/pessoas"
    },
    {
      title: "Times Ativos",
      value: metrics.totalTimes,
      trend: metrics.tendenciaTimes,
      trendLabel: "sem mudanças",
      icon: Network,
      color: "bg-accent/10 text-accent",
      href: "/times"
    },
    {
      title: "Vagas Abertas",
      value: metrics.totalVagas,
      trend: metrics.tendenciaVagas,
      trendLabel: "esta semana",
      icon: Briefcase,
      color: "bg-warning/10 text-warning",
      href: "/times" // Link para times onde as vagas são gerenciadas
    },
    {
      title: "Projetos Ativos",
      value: metrics.totalProjetos,
      trend: metrics.tendenciaProjetos,
      trendLabel: "desde último mês",
      icon: FolderKanban,
      color: "bg-success/10 text-success",
      href: "/projetos"
    },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      {/* Header de boas-vindas */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-secondary">
          Olá, {userName}! 🦖
        </h1>
        <p className="mt-1 text-muted-foreground">Aqui está o resumo da sua organização hoje</p>
        <p className="mt-2 text-sm text-muted-foreground">{currentDate}</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {METRIC_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-lg bg-white p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-2 font-heading text-3xl font-bold text-secondary">{card.value}</p>
                  <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getTrendColor(card.trend)}`}>
                    {getTrendIcon(card.trend)}
                    {card.trend !== 0 && <span>{Math.abs(card.trend)}</span>}
                    <span className="ml-1">{card.trendLabel}</span>
                  </div>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Pizza - Distribuição por Nível */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-heading text-lg font-semibold text-secondary">
            Distribuição por Nível
          </h3>
          {nivelDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={nivelDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="var(--chart-1)"
                  dataKey="value"
                >
                  {nivelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <EmptyState
                icon={<Briefcase className="h-12 w-12" />}
                title="Nenhum dado disponível"
                description="Adicione pessoas com cargos para ver a distribuição."
              />
            </div>
          )}
        </div>

        {/* Gráfico de Barras - Pessoas por Time */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-heading text-lg font-semibold text-secondary">
            Pessoas por Time (Top 5)
          </h3>
          {timeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="team" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <EmptyState
                icon={<Network className="h-12 w-12" />}
                title="Nenhum dado disponível"
                description="Adicione pessoas aos times para ver a distribuição."
              />
            </div>
          )}
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-heading text-lg font-semibold text-secondary">
          Atividade Recente
        </h3>
        {recentActivities.length > 0 ? (
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = ICON_MAP[activity.icon as keyof typeof ICON_MAP] || Activity
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${activity.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-secondary">{activity.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Activity className="h-12 w-12" />}
            title="Nenhuma atividade recente"
            description="As alterações no sistema aparecerão aqui."
          />
        )}
      </div>

      {/* Botões de ação flutuantes */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3">
        <Link
          href="/times/novo"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl"
          title="Criar Time"
        >
          <Plus className="h-6 w-6 text-white" />
        </Link>
        <Link
          href="/pessoas/novo"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl"
          title="Adicionar Pessoa"
        >
          <Plus className="h-7 w-7 text-white" />
        </Link>
      </div>
    </div>
  )
}
