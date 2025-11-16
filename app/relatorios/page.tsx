'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Calendar, Download, Lock, TrendingUp, TrendingDown } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Treemap,
  ScatterChart,
  Scatter,
} from 'recharts'
import { toast } from 'sonner'

// Mock data
const growthData = [
  { month: 'Jan', count: 95 },
  { month: 'Fev', count: 98 },
  { month: 'Mar', count: 102 },
  { month: 'Abr', count: 105 },
  { month: 'Mai', count: 108 },
  { month: 'Jun', count: 112 },
  { month: 'Jul', count: 115 },
  { month: 'Ago', count: 118 },
  { month: 'Set', count: 121 },
  { month: 'Out', count: 124 },
  { month: 'Nov', count: 127 },
]

const levelDistribution = [
  { name: 'L1', value: 15, color: '#FF7A00' },
  { name: 'L2', value: 32, color: '#FF9A33' },
  { name: 'L3', value: 45, color: '#00C8FF' },
  { name: 'L4', value: 25, color: '#33D4FF' },
  { name: 'L5', value: 10, color: '#66E0FF' },
]

const statusDistribution = [
  { name: 'Ativo', value: 115, color: '#10b981' },
  { name: 'Férias', value: 8, color: '#3b82f6' },
  { name: 'Licença', value: 3, color: '#FF7A00' },
  { name: 'Afastamento', value: 1, color: '#ef4444' },
]

const topTeams = [
  { name: 'Engenharia', value: 35 },
  { name: 'Produto', value: 22 },
  { name: 'Design', value: 18 },
  { name: 'Dados', value: 15 },
  { name: 'Marketing', value: 12 },
]

const hiringData = [
  { month: 'Jun', count: 5 },
  { month: 'Jul', count: 8 },
  { month: 'Ago', count: 6 },
  { month: 'Set', count: 10 },
  { month: 'Out', count: 7 },
  { month: 'Nov', count: 5 },
]

const positionData = [
  { position: 'Software Engineer', count: 28, percentage: 22 },
  { position: 'Product Manager', count: 15, percentage: 12 },
  { position: 'Designer', count: 18, percentage: 14 },
  { position: 'Data Scientist', count: 12, percentage: 9 },
  { position: 'Engineering Manager', count: 8, percentage: 6 },
  { position: 'QA Engineer', count: 10, percentage: 8 },
  { position: 'DevOps Engineer', count: 7, percentage: 6 },
  { position: 'UX Researcher', count: 5, percentage: 4 },
  { position: 'Product Designer', count: 9, percentage: 7 },
  { position: 'Backend Engineer', count: 15, percentage: 12 },
]

const teamSizeData = [
  { name: 'Engenharia', size: 35, fill: '#FF7A00' },
  { name: 'Produto', size: 22, fill: '#FF9A33' },
  { name: 'Design', size: 18, fill: '#00C8FF' },
  { name: 'Dados', size: 15, fill: '#33D4FF' },
  { name: 'Marketing', size: 12, fill: '#66E0FF' },
  { name: 'Vendas', size: 10, fill: '#FF7A00' },
  { name: 'Suporte', size: 8, fill: '#FF9A33' },
  { name: 'RH', size: 7, fill: '#00C8FF' },
]

const occupancyRate = [
  { team: 'Engenharia', rate: 88, color: '#f59e0b' },
  { team: 'Produto', rate: 95, color: '#10b981' },
  { team: 'Design', rate: 90, color: '#10b981' },
  { team: 'Dados', rate: 75, color: '#f59e0b' },
  { team: 'Marketing', rate: 100, color: '#10b981' },
]

const teamsWithOpenings = [
  { team: 'Engenharia', openings: 5, current: 35, rate: 88 },
  { team: 'Dados', openings: 5, current: 15, rate: 75 },
  { team: 'Design', openings: 2, current: 18, rate: 90 },
  { team: 'Produto', openings: 1, current: 22, rate: 95 },
  { team: 'Marketing', openings: 0, current: 12, rate: 100 },
]

const managerData = [
  { name: 'Gerente A', directReports: 5, total: 15 },
  { name: 'Gerente B', directReports: 8, total: 35 },
  { name: 'Gerente C', directReports: 6, total: 22 },
  { name: 'Gerente D', directReports: 4, total: 12 },
  { name: 'Gerente E', directReports: 7, total: 18 },
  { name: 'Gerente F', directReports: 3, total: 8 },
]

const salaryByLevel = [
  { level: 'L1', min: 3000, q1: 3500, median: 4000, q3: 4500, max: 5000 },
  { level: 'L2', min: 5000, q1: 6000, median: 7000, q3: 8000, max: 9000 },
  { level: 'L3', min: 8000, q1: 10000, median: 12000, q3: 14000, max: 16000 },
  { level: 'L4', min: 15000, q1: 18000, median: 22000, q3: 26000, max: 30000 },
  { level: 'L5', min: 28000, q1: 32000, median: 38000, q3: 44000, max: 50000 },
]

const avgSalaryByTeam = [
  { team: 'Engenharia', avg: 12500 },
  { team: 'Produto', avg: 14200 },
  { team: 'Design', avg: 9800 },
  { team: 'Dados', avg: 13500 },
  { team: 'Marketing', avg: 8200 },
  { team: 'Vendas', avg: 9500 },
]

const topSalaries = [
  { position: 'VP Engineering', level: 'L5', salary: 48000 },
  { position: 'VP Product', level: 'L5', salary: 45000 },
  { position: 'Director of Engineering', level: 'L4', salary: 35000 },
  { position: 'Senior Engineering Manager', level: 'L4', salary: 32000 },
  { position: 'Principal Engineer', level: 'L4', salary: 30000 },
  { position: 'Senior Product Manager', level: 'L3', salary: 18000 },
  { position: 'Staff Engineer', level: 'L4', salary: 28000 },
  { position: 'Engineering Manager', level: 'L3', salary: 22000 },
  { position: 'Senior Data Scientist', level: 'L3', salary: 20000 },
  { position: 'Lead Designer', level: 'L3', salary: 16000 },
]

const projectStatus = [
  { name: 'Ativo', value: 8, color: '#10b981' },
  { name: 'Planejamento', value: 3, color: '#3b82f6' },
  { name: 'Pausado', value: 1, color: '#f59e0b' },
  { name: 'Concluído', value: 15, color: '#6b7280' },
]

const projectAllocation = [
  { month: 'Jun', alpha: 15, core: 25, mobile: 8, portal: 12, gateway: 10 },
  { month: 'Jul', alpha: 18, core: 22, mobile: 10, portal: 15, gateway: 8 },
  { month: 'Ago', alpha: 20, core: 20, mobile: 12, portal: 14, gateway: 12 },
  { month: 'Set', alpha: 22, core: 25, mobile: 10, portal: 18, gateway: 10 },
  { month: 'Out', alpha: 25, core: 28, mobile: 8, portal: 16, gateway: 15 },
  { month: 'Nov', alpha: 28, core: 30, mobile: 10, portal: 20, gateway: 12 },
]

const topProjects = [
  { name: 'Sistema Core', people: 30 },
  { name: 'Projeto Alpha', people: 28 },
  { name: 'Portal do Cliente', people: 20 },
  { name: 'API Gateway', people: 12 },
  { name: 'App Mobile', people: 10 },
]

export default function RelatoriosPage() {
  const [dateRange, setDateRange] = useState('Últimos 30 dias')
  const [isManager] = useState(true) // Mock: change to false to see locked state

  const handleExport = (widgetName: string, format: string) => {
    console.log('[v0] Exporting widget:', widgetName, 'as', format)
    toast.success('🦖 Relatório exportado com sucesso!')
  }

  const handleExportAll = () => {
    console.log('[v0] Exporting all reports')
    toast.success('🦖 Todos os relatórios exportados com sucesso!')
  }

  const handleDateChange = () => {
    console.log('[v0] Date range changed')
    toast.info('Período atualizado')
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>Dashboard</span>
              <span>›</span>
              <span>Relatórios</span>
            </div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDateChange}>
              <Calendar className="h-4 w-4 mr-2" />
              {dateRange}
            </Button>
            <Button onClick={handleExportAll} className="bg-primary hover:bg-primary/90">
              <Download className="h-4 w-4 mr-2" />
              Exportar Todos
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="people" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Pessoas
            </TabsTrigger>
            <TabsTrigger value="teams" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Times
            </TabsTrigger>
            <TabsTrigger value="financial" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Financeiro {!isManager && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Projetos
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Growth Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Crescimento da Organização</CardTitle>
                  <CardDescription>Últimos 12 meses</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('Crescimento', 'PNG')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#FF7A00" strokeWidth={2} dot={{ fill: '#FF7A00' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Level and Status Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Distribuição por Nível</CardTitle>
                    <CardDescription>127 pessoas no total</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Níveis', 'PNG')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={levelDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {levelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Distribuição por Status</CardTitle>
                    <CardDescription>127 pessoas no total</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Status', 'PNG')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Teams */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top 5 Times</CardTitle>
                  <CardDescription>Por número de pessoas</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('Top Times', 'PNG')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topTeams} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF7A00" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: PESSOAS */}
          <TabsContent value="people" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Hiring Chart */}
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Novas Contratações</CardTitle>
                    <CardDescription>Últimos 6 meses</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Contratações', 'PNG')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={hiringData}>
                      <defs>
                        <linearGradient id="colorHiring" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#FF7A00" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#FF7A00" fillOpacity={1} fill="url(#colorHiring)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Retention & Tenure */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Taxa de Retenção</CardTitle>
                    <CardDescription>Últimos 12 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="text-5xl font-bold text-green-600">94%</div>
                      <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>+2% vs ano passado</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tempo Médio na Empresa</CardTitle>
                    <CardDescription>Todas as pessoas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="text-5xl font-bold text-primary">2.3</div>
                      <div className="text-sm text-muted-foreground">anos</div>
                      <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>+0.3 vs ano passado</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Position Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pessoas por Cargo</CardTitle>
                  <CardDescription>Top 10 posições</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('Cargos', 'CSV')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Cargo</th>
                        <th className="text-right py-3 px-4 font-medium">Quantidade</th>
                        <th className="text-right py-3 px-4 font-medium">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positionData.map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{item.position}</td>
                          <td className="text-right py-3 px-4">{item.count}</td>
                          <td className="text-right py-3 px-4">{item.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: TIMES */}
          <TabsContent value="teams" className="space-y-6 mt-6">
            {/* Team Size Treemap */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tamanho dos Times</CardTitle>
                  <CardDescription>Representação visual proporcional</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('Tamanho Times', 'PNG')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <Treemap
                    data={teamSizeData}
                    dataKey="size"
                    stroke="#fff"
                    fill="#FF7A00"
                    content={({ x, y, width, height, name, size }: any) => (
                      <g>
                        <rect x={x} y={y} width={width} height={height} fill={teamSizeData.find(t => t.name === name)?.fill} />
                        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
                          {name}
                        </text>
                        <text x={x + width / 2} y={y + height / 2 + 16} textAnchor="middle" fill="#fff" fontSize={10}>
                          {size} pessoas
                        </text>
                      </g>
                    )}
                  />
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Occupancy Rate */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Taxa de Ocupação</CardTitle>
                    <CardDescription>Por time</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Ocupação', 'PNG')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={occupancyRate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="team" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                        {occupancyRate.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Teams with Openings Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Times com Vagas</CardTitle>
                    <CardDescription>Posições abertas</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Vagas', 'CSV')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 text-sm font-medium">Time</th>
                          <th className="text-right py-2 px-2 text-sm font-medium">Vagas</th>
                          <th className="text-right py-2 px-2 text-sm font-medium">Atual</th>
                          <th className="text-right py-2 px-2 text-sm font-medium">Taxa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamsWithOpenings.map((item, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2 text-sm">{item.team}</td>
                            <td className="text-right py-2 px-2 text-sm">{item.openings}</td>
                            <td className="text-right py-2 px-2 text-sm">{item.current}</td>
                            <td className="text-right py-2 px-2 text-sm">{item.rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Manager Scatter Plot */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestores e Subordinados</CardTitle>
                  <CardDescription>Reportes diretos vs total na hierarquia</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('Gestores', 'PNG')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" dataKey="directReports" name="Reportes Diretos" stroke="#6b7280" />
                    <YAxis type="number" dataKey="total" name="Total Hierarquia" stroke="#6b7280" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Gestores" data={managerData} fill="#FF7A00" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: FINANCEIRO */}
          <TabsContent value="financial" className="space-y-6 mt-6">
            {!isManager ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Lock className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Relatórios financeiros disponíveis apenas para gestores
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Total Payroll */}
                <Card>
                  <CardHeader>
                    <CardTitle>Folha Salarial Total</CardTitle>
                    <CardDescription>Mensal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-4xl font-bold">R$ 1.245.000</div>
                        <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>+5.2% vs mês passado</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleExport('Folha', 'PDF')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Salary by Level & Team */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Distribuição Salarial por Nível</CardTitle>
                        <CardDescription>Min, Mediana, Max</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleExport('Salário Nível', 'PNG')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {salaryByLevel.map((item) => (
                          <div key={item.level} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{item.level}</span>
                              <span className="text-muted-foreground">R$ {item.min.toLocaleString()} - R$ {item.max.toLocaleString()}</span>
                            </div>
                            <div className="relative h-8 bg-muted rounded">
                              <div
                                className="absolute h-full bg-primary/30 rounded"
                                style={{
                                  left: `${((item.q1 - item.min) / (item.max - item.min)) * 100}%`,
                                  width: `${((item.q3 - item.q1) / (item.max - item.min)) * 100}%`,
                                }}
                              />
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-primary"
                                style={{ left: `${((item.median - item.min) / (item.max - item.min)) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Média Salarial por Time</CardTitle>
                        <CardDescription>Valor mensal</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleExport('Salário Time', 'PNG')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={avgSalaryByTeam} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" stroke="#6b7280" />
                          <YAxis dataKey="team" type="category" stroke="#6b7280" width={100} />
                          <Tooltip formatter={(value: any) => `R$ ${value.toLocaleString()}`} />
                          <Bar dataKey="avg" fill="#FF7A00" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Salaries */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Top Salários</CardTitle>
                      <CardDescription>Top 10 posições (dados anonimizados)</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleExport('Top Salários', 'CSV')}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Cargo</th>
                            <th className="text-left py-3 px-4 font-medium">Nível</th>
                            <th className="text-right py-3 px-4 font-medium">Salário</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topSalaries.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">{item.position}</td>
                              <td className="py-3 px-4">{item.level}</td>
                              <td className="text-right py-3 px-4">R$ {item.salary.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TAB 5: PROJETOS */}
          <TabsContent value="projects" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Projetos por Status</CardTitle>
                    <CardDescription>27 projetos no total</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Status Projetos', 'PNG')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={projectStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {projectStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Completion Rate & Duration */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Taxa de Conclusão Média</CardTitle>
                    <CardDescription>Projetos ativos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="text-5xl font-bold text-accent">68%</div>
                      <div className="w-full bg-muted rounded-full h-3 mt-4">
                        <div className="bg-accent h-3 rounded-full" style={{ width: '68%' }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Duração Média dos Projetos</CardTitle>
                    <CardDescription>Por status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Ativos</span>
                          <span className="font-medium">8.5 meses</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '71%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Concluídos</span>
                          <span className="font-medium">11.2 meses</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-gray-500 h-2 rounded-full" style={{ width: '93%' }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Project Allocation */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Alocação de Pessoas</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('Alocação', 'PNG')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={projectAllocation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="alpha" stackId="1" stroke="#FF7A00" fill="#FF7A00" />
                    <Area type="monotone" dataKey="core" stackId="1" stroke="#FF9A33" fill="#FF9A33" />
                    <Area type="monotone" dataKey="mobile" stackId="1" stroke="#00C8FF" fill="#00C8FF" />
                    <Area type="monotone" dataKey="portal" stackId="1" stroke="#33D4FF" fill="#33D4FF" />
                    <Area type="monotone" dataKey="gateway" stackId="1" stroke="#66E0FF" fill="#66E0FF" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Projetos com Mais Pessoas</CardTitle>
                  <CardDescription>Top 5 projetos</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('Top Projetos', 'PNG')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProjects}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Bar dataKey="people" fill="#00C8FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
