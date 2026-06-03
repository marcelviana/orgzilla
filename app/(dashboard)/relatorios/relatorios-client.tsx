'use client'

import { DashboardShell } from '@/components/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Download, Lock } from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Treemap,
} from 'recharts'
import { toast } from '@/lib/ui/toast-config'
import type {
  DistribuicaoItem,
  TopTimeItem,
  PessoaPorCargoItem,
  MetricasVagasItem,
  MetricasProjetosData,
  DadosFinanceiros,
} from '@/app/actions/relatorios.actions'

interface RelatoriosClientProps {
  isGestor: boolean
  distribuicaoPorNivel: DistribuicaoItem[]
  distribuicaoPorStatus: DistribuicaoItem[]
  topTimes: TopTimeItem[]
  pessoasPorCargo: PessoaPorCargoItem[]
  metricasVagas: MetricasVagasItem[]
  metricasProjetos: MetricasProjetosData
  dadosFinanceiros: DadosFinanceiros | null
}

// Cor da barra de ocupação
function ocupacaoCor(rate: number): string {
  if (rate >= 90) return '#10b981'
  if (rate >= 70) return '#f59e0b'
  return '#ef4444'
}

// Formata moeda BRL
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function RelatoriosClient({
  isGestor,
  distribuicaoPorNivel,
  distribuicaoPorStatus,
  topTimes,
  pessoasPorCargo,
  metricasVagas,
  metricasProjetos,
  dadosFinanceiros,
}: RelatoriosClientProps) {
  const handleExport = (widgetName: string) => {
    toast.successDino(`Exportação de "${widgetName}" será implementada em breve!`)
  }

  // Dados de tamanho de times para treemap (top 8)
  const teamSizeData = metricasVagas
    .slice(0, 8)
    .map((t, i) => ({
      name: t.team,
      size: t.current,
      fill: ['#FF7A00', '#FF9A33', '#00C8FF', '#33D4FF', '#66E0FF', '#1A2734', '#FF5A5F', '#10b981'][i % 8],
    }))

  // Taxa de ocupação (top 5 times com mais vagas abertas)
  const ocupacaoData = metricasVagas
    .slice(0, 5)
    .map((t) => ({ team: t.team, rate: t.rate, color: ocupacaoCor(t.rate) }))

  // Projetos para gráfico de pizza
  const projectPieData = [
    { name: 'Ativos', value: metricasProjetos.totalAtivos, color: '#10b981' },
    { name: 'Inativos', value: metricasProjetos.totalInativos, color: '#6b7280' },
  ].filter((d) => d.value > 0)

  const totalPessoas = distribuicaoPorStatus.reduce((s, d) => s + d.value, 0)
  const totalProjetos = metricasProjetos.totalAtivos + metricasProjetos.totalInativos

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
            <Button onClick={() => handleExport('Todos')} className="bg-primary hover:bg-primary/90">
              <Download className="h-4 w-4 mr-2" />
              Exportar Todos
            </Button>
          </div>
        </div>

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
              Financeiro {!isGestor && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Projetos
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribuição por nível */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Distribuição por Nível</CardTitle>
                    <CardDescription>{totalPessoas} pessoas no total</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Níveis')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {distribuicaoPorNivel.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">Nenhum dado encontrado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={distribuicaoPorNivel}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {distribuicaoPorNivel.map((entry, index) => (
                            <Cell key={`cell-nivel-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Distribuição por status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Distribuição por Status</CardTitle>
                    <CardDescription>{totalPessoas} pessoas no total</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Status')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {distribuicaoPorStatus.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">Nenhum dado encontrado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={distribuicaoPorStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                          innerRadius={60}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {distribuicaoPorStatus.map((entry, index) => (
                            <Cell key={`cell-status-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top 5 Times */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top 5 Times</CardTitle>
                  <CardDescription>Por número de pessoas</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('Top Times')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {topTimes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhum dado encontrado.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topTimes} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis dataKey="name" type="category" stroke="#6b7280" width={120} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#FF7A00" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: PESSOAS */}
          <TabsContent value="people" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pessoas por Cargo</CardTitle>
                  <CardDescription>Top 10 cargos</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('Cargos')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {pessoasPorCargo.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhum cargo encontrado.</p>
                ) : (
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
                        {pessoasPorCargo.map((item, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{item.cargo}</td>
                            <td className="text-right py-3 px-4">{item.count}</td>
                            <td className="text-right py-3 px-4">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: TIMES */}
          <TabsContent value="teams" className="space-y-6 mt-6">
            {/* Treemap tamanho dos times */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tamanho dos Times</CardTitle>
                  <CardDescription>Representação visual proporcional</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('Tamanho Times')}>
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {teamSizeData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhum time encontrado.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <Treemap
                      data={teamSizeData}
                      dataKey="size"
                      stroke="#fff"
                      fill="#FF7A00"
                      content={(props: {
                        x?: number
                        y?: number
                        width?: number
                        height?: number
                        name?: string
                        size?: number
                      }) => {
                        const x = props.x ?? 0
                        const y = props.y ?? 0
                        const width = props.width ?? 0
                        const height = props.height ?? 0
                        const { name, size } = props
                        return (
                          <g>
                            <rect x={x} y={y} width={width} height={height} fill={teamSizeData.find(t => t.name === name)?.fill ?? '#FF7A00'} />
                            {width > 40 && height > 30 && (
                              <>
                                <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
                                  {name}
                                </text>
                                <text x={x + width / 2} y={y + height / 2 + 16} textAnchor="middle" fill="#fff" fontSize={10}>
                                  {size} pessoas
                                </text>
                              </>
                            )}
                          </g>
                        )
                      }}
                    />
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Taxa de ocupação */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Taxa de Ocupação</CardTitle>
                    <CardDescription>Pessoas atuais vs capacidade total (pessoas + vagas)</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Ocupação')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {ocupacaoData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">Nenhum dado encontrado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={ocupacaoData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="team" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" domain={[0, 100]} unit="%" />
                        <Tooltip formatter={(v) => `${String(v ?? 0)}%`} />
                        <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                          {ocupacaoData.map((entry, index) => (
                            <Cell key={`cell-ocup-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Times com vagas */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Times com Vagas</CardTitle>
                    <CardDescription>Posições abertas</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Vagas')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {metricasVagas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">Nenhum dado encontrado.</p>
                  ) : (
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
                          {metricasVagas.map((item, idx) => (
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
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: FINANCEIRO */}
          <TabsContent value="financial" className="space-y-6 mt-6">
            {!isGestor ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Lock className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Relatórios financeiros disponíveis apenas para gestores
                  </p>
                </CardContent>
              </Card>
            ) : dadosFinanceiros === null || dadosFinanceiros.salariosPorNivel.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum dado salarial encontrado na sua hierarquia.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Folha total */}
                <Card>
                  <CardHeader>
                    <CardTitle>Folha Salarial Total</CardTitle>
                    <CardDescription>Mensal — sua hierarquia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-4xl font-bold">{formatBRL(dadosFinanceiros.totalFolha)}</div>
                        <p className="text-sm text-muted-foreground mt-1">Total mensal das pessoas com salário cadastrado</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleExport('Folha')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Distribuição salarial por nível */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Distribuição Salarial por Nível</CardTitle>
                        <CardDescription>Min · Mediana · Max</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleExport('Salário por Nível')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dadosFinanceiros.salariosPorNivel.map((item) => (
                          <div key={item.level} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{item.level}</span>
                              <span className="text-muted-foreground">
                                {formatBRL(item.min)} – {formatBRL(item.max)}
                              </span>
                            </div>
                            <div className="relative h-8 bg-muted rounded">
                              <div
                                className="absolute h-full bg-primary/30 rounded"
                                style={{
                                  left: `${((item.q1 - item.min) / Math.max(item.max - item.min, 1)) * 100}%`,
                                  width: `${((item.q3 - item.q1) / Math.max(item.max - item.min, 1)) * 100}%`,
                                }}
                              />
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-primary"
                                style={{ left: `${((item.median - item.min) / Math.max(item.max - item.min, 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Média salarial por time */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Média Salarial por Time</CardTitle>
                        <CardDescription>Valor mensal</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleExport('Média Salarial por Time')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dadosFinanceiros.mediaSalarioPorTime} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" stroke="#6b7280" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                          <YAxis dataKey="team" type="category" stroke="#6b7280" width={110} />
                          <Tooltip formatter={(v) => formatBRL(Number(v))} />
                          <Bar dataKey="avg" fill="#FF7A00" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* TAB 5: PROJETOS */}
          <TabsContent value="projects" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Projetos por status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Projetos por Status</CardTitle>
                    <CardDescription>{totalProjetos} projetos no total</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Status Projetos')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {projectPieData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">Nenhum projeto encontrado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={projectPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                          innerRadius={60}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {projectPieData.map((entry, index) => (
                            <Cell key={`cell-proj-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Projetos ativos com mais pessoas */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Projetos com Mais Pessoas</CardTitle>
                    <CardDescription>Top 5 projetos ativos</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('Top Projetos')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {metricasProjetos.topProjetos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">Nenhum projeto com alocação encontrado.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={metricasProjetos.topProjetos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#6b7280" />
                        <Tooltip />
                        <Bar dataKey="people" fill="#00C8FF" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
