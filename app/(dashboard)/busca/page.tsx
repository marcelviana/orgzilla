"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import Link from "next/link"
import { DashboardShell } from "@/components/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, X, Users, Network, Briefcase, ChevronDown, ChevronUp, Star, Clock, Filter, SlidersHorizontal } from 'lucide-react'

// Mock data types
type SearchResultType = "pessoa" | "time" | "projeto" | "cargo"

interface PessoaResult {
  id: string
  tipo: "pessoa"
  nome: string
  cargo: string
  nivel: string
  time: string
  timeBreadcrumb: string
  email: string
  avatar?: string
  tags: string[]
  matchedField: string
  relevance: number
}

interface TimeResult {
  id: string
  tipo: "time"
  nome: string
  descricao: string
  gestor: { nome: string; avatar?: string }
  pessoas: number
  vagas: number
  breadcrumb: string
  matchedField: string
  relevance: number
}

interface ProjetoResult {
  id: string
  tipo: "projeto"
  nome: string
  status: string
  pessoasAlocadas: number
  equipe: Array<{ nome: string; avatar?: string }>
  matchedField: string
  relevance: number
}

interface CargoResult {
  id: string
  tipo: "cargo"
  nome: string
  trilha: string
  nivel: string
  pessoas: number
  matchedField: string
  relevance: number
}

// Mock data
const mockPeople: PessoaResult[] = [
  {
    id: "p1",
    tipo: "pessoa",
    nome: "Maria Santos",
    cargo: "Senior Engineer",
    nivel: "L4",
    time: "Engenharia",
    timeBreadcrumb: "Tecnologia > Engenharia",
    email: "maria.santos@orgzilla.com",
    avatar: "/diverse-woman-portrait.png",
    tags: ["Frontend", "React", "Leadership"],
    matchedField: "nome",
    relevance: 0.95,
  },
  {
    id: "p2",
    tipo: "pessoa",
    nome: "João Silva",
    cargo: "Backend Developer",
    nivel: "L3",
    time: "Engenharia",
    timeBreadcrumb: "Tecnologia > Engenharia",
    email: "joao.silva@orgzilla.com",
    avatar: "/man.jpg",
    tags: ["Backend", "Node.js", "PostgreSQL"],
    matchedField: "nome",
    relevance: 0.90,
  },
  {
    id: "p3",
    tipo: "pessoa",
    nome: "Ana Costa",
    cargo: "Frontend Developer",
    nivel: "L2",
    time: "Engenharia",
    timeBreadcrumb: "Tecnologia > Engenharia",
    email: "ana.costa@orgzilla.com",
    tags: ["Frontend", "Vue.js", "CSS"],
    matchedField: "nome",
    relevance: 0.85,
  },
]

const mockTeams: TimeResult[] = [
  {
    id: "t1",
    tipo: "time",
    nome: "Engenharia de Software",
    descricao: "Time responsável pelo desenvolvimento de software e manutenção de sistemas",
    gestor: { nome: "João Silva", avatar: "/man.jpg" },
    pessoas: 15,
    vagas: 2,
    breadcrumb: "Tecnologia > Engenharia",
    matchedField: "nome",
    relevance: 0.88,
  },
  {
    id: "t2",
    tipo: "time",
    nome: "Tecnologia",
    descricao: "Toda área de tecnologia e engenharia",
    gestor: { nome: "Carlos Silva" },
    pessoas: 28,
    vagas: 3,
    breadcrumb: "Tecnologia",
    matchedField: "nome",
    relevance: 0.82,
  },
]

const mockProjects: ProjetoResult[] = [
  {
    id: "proj1",
    tipo: "projeto",
    nome: "Projeto Alpha",
    status: "Ativo",
    pessoasAlocadas: 8,
    equipe: [
      { nome: "Maria", avatar: "/diverse-woman-portrait.png" },
      { nome: "João", avatar: "/man.jpg" },
      { nome: "Ana" },
    ],
    matchedField: "nome",
    relevance: 0.75,
  },
]

const mockPositions: CargoResult[] = [
  {
    id: "c1",
    tipo: "cargo",
    nome: "Senior Engineer",
    trilha: "Engenharia de Software",
    nivel: "L4",
    pessoas: 12,
    matchedField: "nome",
    relevance: 0.70,
  },
]

export default function BuscaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryParam = searchParams?.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [searchTerm, setSearchTerm] = useState(queryParam)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<SearchResultType[]>([
    "pessoa",
    "time",
    "projeto",
    "cargo",
  ])
  const [expandedGroups, setExpandedGroups] = useState<SearchResultType[]>([
    "pessoa",
    "time",
    "projeto",
    "cargo",
  ])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchQuery)
      if (searchQuery) {
        router.push(`/busca?q=${encodeURIComponent(searchQuery)}`)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, router])

  // Perform search
  const searchResults = useMemo(() => {
    if (!searchTerm) return { pessoas: [], times: [], projetos: [], cargos: [] }

    const query = searchTerm.toLowerCase()

    const pessoas = mockPeople.filter(
      (p) =>
        p.nome.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.cargo.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query))
    )

    const times = mockTeams.filter(
      (t) =>
        t.nome.toLowerCase().includes(query) ||
        t.descricao.toLowerCase().includes(query)
    )

    const projetos = mockProjects.filter((p) =>
      p.nome.toLowerCase().includes(query)
    )

    const cargos = mockPositions.filter((c) =>
      c.nome.toLowerCase().includes(query)
    )

    return { pessoas, times, projetos, cargos }
  }, [searchTerm])

  const totalResults =
    searchResults.pessoas.length +
    searchResults.times.length +
    searchResults.projetos.length +
    searchResults.cargos.length

  const toggleGroup = (tipo: SearchResultType) => {
    setExpandedGroups((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    )
  }

  const toggleType = (tipo: SearchResultType) => {
    setSelectedTypes((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    )
  }

  const highlightTerm = (text: string, term: string) => {
    if (!term) return text
    const regex = new RegExp(`(${term})`, "gi")
    const parts = text.split(regex)
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-primary/20 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              Dashboard
            </Link>
            <span>{'>'}</span>
            <span>Busca</span>
          </div>
          <h1 className="text-3xl font-bold text-secondary">
            {searchTerm
              ? `Resultados para "${searchTerm}"`
              : "Buscar no Orgzilla"}
          </h1>
        </div>

        {/* Search Bar */}
        <Card className="p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar pessoas, times, projetos, cargos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-11 pr-10 text-lg"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setSearchTerm("")
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button size="lg" className="px-8">
              <Search className="mr-2 h-5 w-5" />
              Buscar
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Dica: Use <kbd className="rounded border px-1.5 py-0.5">/</kbd> para
            focar na busca
          </p>
        </Card>

        {!searchTerm ? (
          // No search yet - initial state
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Search className="mb-4 h-16 w-16 text-gray-300" />
            <h2 className="mb-2 text-xl font-semibold text-secondary">
              Buscar no Orgzilla
            </h2>
            <p className="mb-6 text-muted-foreground">
              Encontre pessoas, times, projetos e cargos
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/pessoas">Ver Todas as Pessoas</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/times">Ver Todos os Times</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/projetos">Ver Todos os Projetos</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Stats Bar */}
            {totalResults > 0 && (
              <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {totalResults}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {totalResults === 1 ? "resultado encontrado" : "resultados encontrados"}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                {searchResults.pessoas.length > 0 && (
                  <Badge variant="secondary" className="text-white">
                    {searchResults.pessoas.length} Pessoas
                  </Badge>
                )}
                {searchResults.times.length > 0 && (
                  <Badge variant="secondary" className="text-white">
                    {searchResults.times.length} Times
                  </Badge>
                )}
                {searchResults.projetos.length > 0 && (
                  <Badge variant="secondary" className="text-white">
                    {searchResults.projetos.length} Projetos
                  </Badge>
                )}
                {searchResults.cargos.length > 0 && (
                  <Badge variant="secondary" className="text-white">
                    {searchResults.cargos.length} Cargos
                  </Badge>
                )}
                <div className="ml-auto text-xs text-muted-foreground">
                  <Clock className="mr-1 inline h-3 w-3" />
                  0.23s
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              {/* Filters Sidebar */}
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filtros
                  {showFilters ? (
                    <ChevronUp className="ml-auto h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-auto h-4 w-4" />
                  )}
                </Button>

                <Card
                  className={`space-y-6 p-4 ${showFilters ? "block" : "hidden lg:block"}`}
                >
                  <div>
                    <h3 className="mb-3 font-semibold text-secondary">
                      Tipo de Resultado
                    </h3>
                    <div className="space-y-2">
                      {[
                        {
                          type: "pessoa" as SearchResultType,
                          label: "Pessoas",
                          count: searchResults.pessoas.length,
                        },
                        {
                          type: "time" as SearchResultType,
                          label: "Times",
                          count: searchResults.times.length,
                        },
                        {
                          type: "projeto" as SearchResultType,
                          label: "Projetos",
                          count: searchResults.projetos.length,
                        },
                        {
                          type: "cargo" as SearchResultType,
                          label: "Cargos",
                          count: searchResults.cargos.length,
                        },
                      ].map(({ type, label, count }) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedTypes.includes(type)}
                            onCheckedChange={() => toggleType(type)}
                          />
                          <Label
                            htmlFor={type}
                            className="flex-1 cursor-pointer text-sm font-normal"
                          >
                            {label}{" "}
                            <span className="text-muted-foreground">
                              ({count})
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Results */}
              <div className="space-y-6">
                {totalResults === 0 ? (
                  <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 text-6xl">🦖🔍</div>
                    <h2 className="mb-2 text-xl font-semibold text-secondary">
                      Nenhum resultado encontrado
                    </h2>
                    <p className="mb-6 text-muted-foreground">
                      Tente usar termos diferentes ou verifique a ortografia
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTypes(["pessoa"])}
                      >
                        Buscar apenas em Pessoas
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("")
                          setSearchTerm("")
                        }}
                      >
                        Limpar busca
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <>
                    {/* Pessoas Results */}
                    {selectedTypes.includes("pessoa") &&
                      searchResults.pessoas.length > 0 && (
                        <div className="space-y-3">
                          <button
                            onClick={() => toggleGroup("pessoa")}
                            className="flex w-full items-center gap-3 rounded-lg border-l-4 border-primary bg-card p-3 hover:bg-muted/50"
                          >
                            <Users className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold text-secondary">
                              Pessoas
                            </h2>
                            <Badge variant="secondary" className="text-white">
                              {searchResults.pessoas.length}
                            </Badge>
                            {expandedGroups.includes("pessoa") ? (
                              <ChevronUp className="ml-auto h-5 w-5" />
                            ) : (
                              <ChevronDown className="ml-auto h-5 w-5" />
                            )}
                          </button>

                          {expandedGroups.includes("pessoa") && (
                            <div className="space-y-2">
                              {searchResults.pessoas.map((pessoa) => (
                                <Card
                                  key={pessoa.id}
                                  className="flex items-center gap-4 p-4 transition-all hover:shadow-md"
                                >
                                  <Avatar className="h-12 w-12">
                                    {pessoa.avatar && (
                                      <AvatarImage src={pessoa.avatar || "/placeholder.svg"} />
                                    )}
                                    <AvatarFallback className="bg-primary text-white">
                                      {pessoa.nome
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-1">
                                    <h3 className="text-lg font-semibold">
                                      {highlightTerm(pessoa.nome, searchTerm)}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="outline">
                                        {pessoa.cargo}
                                      </Badge>
                                      <Badge variant="secondary" className="text-white">
                                        {pessoa.nivel}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {pessoa.timeBreadcrumb}
                                    </p>
                                    {pessoa.email && (
                                      <p className="text-xs text-muted-foreground">
                                        {highlightTerm(pessoa.email, searchTerm)}
                                      </p>
                                    )}
                                    {pessoa.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {pessoa.tags.map((tag) => (
                                          <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="text-xs text-white"
                                          >
                                            {highlightTerm(tag, searchTerm)}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" asChild>
                                      <Link href={`/pessoas/${pessoa.id}`}>
                                        Ver Perfil
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Star className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    {/* Times Results */}
                    {selectedTypes.includes("time") &&
                      searchResults.times.length > 0 && (
                        <div className="space-y-3">
                          <button
                            onClick={() => toggleGroup("time")}
                            className="flex w-full items-center gap-3 rounded-lg border-l-4 border-accent bg-card p-3 hover:bg-muted/50"
                          >
                            <Network className="h-5 w-5 text-accent" />
                            <h2 className="text-lg font-semibold text-secondary">
                              Times
                            </h2>
                            <Badge variant="secondary" className="text-white">
                              {searchResults.times.length}
                            </Badge>
                            {expandedGroups.includes("time") ? (
                              <ChevronUp className="ml-auto h-5 w-5" />
                            ) : (
                              <ChevronDown className="ml-auto h-5 w-5" />
                            )}
                          </button>

                          {expandedGroups.includes("time") && (
                            <div className="space-y-2">
                              {searchResults.times.map((time) => (
                                <Card
                                  key={time.id}
                                  className="flex items-center gap-4 p-4 transition-all hover:shadow-md"
                                >
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                                    <Network className="h-6 w-6 text-accent" />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <h3 className="text-lg font-semibold">
                                      {highlightTerm(time.nome, searchTerm)}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {highlightTerm(time.descricao, searchTerm)}
                                    </p>
                                    <div className="flex items-center gap-3 text-sm">
                                      <div className="flex items-center gap-1">
                                        <Avatar className="h-5 w-5">
                                          {time.gestor.avatar && (
                                            <AvatarImage
                                              src={time.gestor.avatar || "/placeholder.svg"}
                                            />
                                          )}
                                          <AvatarFallback className="bg-secondary text-[10px] text-white">
                                            {time.gestor.nome
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")
                                              .slice(0, 2)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-muted-foreground">
                                          Gestor: {time.gestor.nome}
                                        </span>
                                      </div>
                                      <Separator
                                        orientation="vertical"
                                        className="h-4"
                                      />
                                      <span className="text-muted-foreground">
                                        {time.pessoas} pessoas
                                        {time.vagas > 0 &&
                                          `, ${time.vagas} vagas abertas`}
                                      </span>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/times/${time.id}`}>
                                      Ver Time
                                    </Link>
                                  </Button>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    {/* Projetos Results */}
                    {selectedTypes.includes("projeto") &&
                      searchResults.projetos.length > 0 && (
                        <div className="space-y-3">
                          <button
                            onClick={() => toggleGroup("projeto")}
                            className="flex w-full items-center gap-3 rounded-lg border-l-4 border-primary bg-card p-3 hover:bg-muted/50"
                          >
                            <Briefcase className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold text-secondary">
                              Projetos
                            </h2>
                            <Badge variant="secondary" className="text-white">
                              {searchResults.projetos.length}
                            </Badge>
                            {expandedGroups.includes("projeto") ? (
                              <ChevronUp className="ml-auto h-5 w-5" />
                            ) : (
                              <ChevronDown className="ml-auto h-5 w-5" />
                            )}
                          </button>

                          {expandedGroups.includes("projeto") && (
                            <div className="space-y-2">
                              {searchResults.projetos.map((projeto) => (
                                <Card
                                  key={projeto.id}
                                  className="flex items-center gap-4 p-4 transition-all hover:shadow-md"
                                >
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Briefcase className="h-6 w-6 text-primary" />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="text-lg font-semibold">
                                        {highlightTerm(projeto.nome, searchTerm)}
                                      </h3>
                                      <Badge
                                        className={
                                          projeto.status === "Ativo"
                                            ? "bg-green-500"
                                            : "bg-gray-500"
                                        }
                                      >
                                        {projeto.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex -space-x-2">
                                        {projeto.equipe
                                          .slice(0, 5)
                                          .map((membro, i) => (
                                            <Avatar
                                              key={i}
                                              className="h-6 w-6 border-2 border-white"
                                            >
                                              {membro.avatar && (
                                                <AvatarImage
                                                  src={membro.avatar || "/placeholder.svg"}
                                                />
                                              )}
                                              <AvatarFallback className="bg-secondary text-[10px] text-white">
                                                {membro.nome[0]}
                                              </AvatarFallback>
                                            </Avatar>
                                          ))}
                                      </div>
                                      <span className="text-sm text-muted-foreground">
                                        {projeto.pessoasAlocadas} pessoas
                                        alocadas
                                      </span>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/projetos/${projeto.id}`}>
                                      Ver Projeto
                                    </Link>
                                  </Button>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    {/* Cargos Results */}
                    {selectedTypes.includes("cargo") &&
                      searchResults.cargos.length > 0 && (
                        <div className="space-y-3">
                          <button
                            onClick={() => toggleGroup("cargo")}
                            className="flex w-full items-center gap-3 rounded-lg border-l-4 border-accent bg-card p-3 hover:bg-muted/50"
                          >
                            <Briefcase className="h-5 w-5 text-accent" />
                            <h2 className="text-lg font-semibold text-secondary">
                              Cargos
                            </h2>
                            <Badge variant="secondary" className="text-white">
                              {searchResults.cargos.length}
                            </Badge>
                            {expandedGroups.includes("cargo") ? (
                              <ChevronUp className="ml-auto h-5 w-5" />
                            ) : (
                              <ChevronDown className="ml-auto h-5 w-5" />
                            )}
                          </button>

                          {expandedGroups.includes("cargo") && (
                            <div className="space-y-2">
                              {searchResults.cargos.map((cargo) => (
                                <Card
                                  key={cargo.id}
                                  className="flex items-center gap-4 p-4 transition-all hover:shadow-md"
                                >
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                                    <Briefcase className="h-6 w-6 text-accent" />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <h3 className="text-lg font-semibold">
                                      {highlightTerm(cargo.nome, searchTerm)}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">
                                        {cargo.trilha}
                                      </Badge>
                                      <Badge variant="secondary" className="text-white">
                                        {cargo.nivel}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {cargo.pessoas} pessoas neste cargo
                                    </p>
                                  </div>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link
                                      href={`/configuracoes/cargos?id=${cargo.id}`}
                                    >
                                      Ver Cargo
                                    </Link>
                                  </Button>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
