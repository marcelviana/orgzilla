"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { Users, Network, Briefcase, FolderKanban, Plus, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

const METRIC_CARDS = [
  { 
    title: "Total de Pessoas", 
    value: 127, 
    trend: 5, 
    trendLabel: "este mês", 
    icon: Users,
    color: "bg-orange-100 text-primary"
  },
  { 
    title: "Times Ativos", 
    value: 18, 
    trend: 0, 
    trendLabel: "sem mudanças", 
    icon: Network,
    color: "bg-orange-100 text-primary"
  },
  { 
    title: "Vagas Abertas", 
    value: 8, 
    trend: 2, 
    trendLabel: "esta semana", 
    icon: Briefcase,
    color: "bg-orange-100 text-primary"
  },
  { 
    title: "Projetos Ativos", 
    value: 12, 
    trend: -1, 
    trendLabel: "desde último mês", 
    icon: FolderKanban,
    color: "bg-orange-100 text-primary"
  },
]

const LEVEL_DISTRIBUTION = [
  { name: "L1", value: 15, color: "#FF7A00" },
  { name: "L2", value: 32, color: "#FF9533" },
  { name: "L3", value: 45, color: "#FFB066" },
  { name: "L4", value: 25, color: "#66D4FF" },
  { name: "L5", value: 10, color: "#00C8FF" },
]

const TEAM_DATA = [
  { team: "Engenharia", count: 35 },
  { team: "Produto", count: 22 },
  { team: "Design", count: 18 },
  { team: "Dados", count: 15 },
  { team: "Marketing", count: 12 },
]

const RECENT_ACTIVITIES = [
  { 
    text: "Maria Santos entrou no Time de Engenharia", 
    time: "2h atrás",
    icon: Users,
    color: "bg-blue-100 text-blue-600"
  },
  { 
    text: "Nova vaga aberta: Designer Sênior", 
    time: "5h atrás",
    icon: Briefcase,
    color: "bg-green-100 text-green-600"
  },
  { 
    text: "João Silva foi promovido no Time de Produto", 
    time: "1d atrás",
    icon: TrendingUp,
    color: "bg-purple-100 text-purple-600"
  },
  { 
    text: "Time de Marketing criou novo projeto", 
    time: "2d atrás",
    icon: FolderKanban,
    color: "bg-orange-100 text-primary"
  },
  { 
    text: "Ana Costa mudou para Time de Dados", 
    time: "3d atrás",
    icon: Activity,
    color: "bg-cyan-100 text-accent"
  },
]

export default function Page() {
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3" />
    if (trend < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "bg-green-100 text-green-700"
    if (trend < 0) return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6 p-8">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-secondary">Olá, João! 🦖</h1>
          <p className="mt-1 text-gray-600">Aqui está o resumo da sua organização hoje</p>
          <p className="mt-2 text-sm text-gray-500">15 de Novembro, 2025</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {METRIC_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div 
                key={card.title}
                className="rounded-lg bg-white p-6 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
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
              </div>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Pie Chart */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-heading text-lg font-semibold text-secondary">Distribuição por Nível</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={LEVEL_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {LEVEL_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Bar Chart */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-heading text-lg font-semibold text-secondary">Pessoas por Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={TEAM_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="team" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#FF7A00" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-heading text-lg font-semibold text-secondary">Atividade Recente</h3>
          <div className="space-y-4">
            {RECENT_ACTIVITIES.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${activity.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-secondary">{activity.text}</p>
                    <p className="mt-1 text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="fixed bottom-8 right-8 flex flex-col gap-3">
          <button 
            onClick={() => console.log("Criar Time clicked")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl"
            title="Criar Time"
          >
            <Plus className="h-6 w-6 text-white" />
          </button>
          <button 
            onClick={() => console.log("Adicionar Pessoa clicked")}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl"
            title="Adicionar Pessoa"
          >
            <Plus className="h-7 w-7 text-white" />
          </button>
        </div>
      </div>
    </DashboardShell>
  )
}
