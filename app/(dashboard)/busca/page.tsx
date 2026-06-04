"use client"

import { useState, useEffect } from "react"
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
import { PageHeader, EmptyState } from '@/components/shared'
import { buscarEntidades, type BuscaEntidadesResult, type BuscaPessoaItem } from "@/app/actions/busca.actions"
import { toast } from "@/lib/ui/toast-config"

type SearchResultType = "pessoa" | "time" | "projeto" | "cargo"

const EMPTY_RESULTS: BuscaEntidadesResult = { pessoas: [], times: [], projetos: [], cargos: [] }

export default function BuscaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryParam = searchParams?.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [searchTerm, setSearchTerm] = useState(queryParam)
  const [showFilters, setShowFilters] = useState(false)
  // fetchedTerm rastreia qual termo já foi buscado; isLoading é derivado da diferença
  const [fetchedTerm, setFetchedTerm] = useState('')
  const [results, setResults] = useState<BuscaEntidadesResult>(EMPTY_RESULTS)
  const isLoading = !!searchTerm && searchTerm !== fetchedTerm
  // displayResults evita mostrar resultados obsoletos quando searchTerm foi limpo
  const displayResults = searchTerm ? results : EMPTY_RESULTS

  const [selectedTypes, setSelectedTypes] = useState<SearchResultType[]>([
    "pessoa", "time", "projeto", "cargo",
  ])
  const [expandedGroups, setExpandedGroups] = useState<SearchResultType[]>([
    "pessoa", "time", "projeto", "cargo",
  ])

  // Sincroniza estado quando o ?q= muda (ex.: nova busca disparada pelo header)
  useEffect(() => {
    void Promise.resolve().then(() => {
      setSearchQuery(queryParam)
      setSearchTerm(queryParam)
    })
  }, [queryParam])

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

  // Fetch results when searchTerm changes — sem setState síncrono no corpo do efeito
  useEffect(() => {
    if (!searchTerm) return
    let cancelled = false
    void buscarEntidades(searchTerm).then(res => {
      if (!cancelled) {
        if (!res.success) {
          toast.error(res.error ?? 'Ops! Orgzilla tropeçou ao buscar. Tente novamente.')
          setResults(EMPTY_RESULTS)
        } else {
          setResults(res.data ?? EMPTY_RESULTS)
        }
        setFetchedTerm(searchTerm)
      }
    })
    return () => { cancelled = true }
  }, [searchTerm])

  const totalResults =
    displayResults.pessoas.length +
    displayResults.times.length +
    displayResults.projetos.length +
    displayResults.cargos.length

  const toggleGroup = (tipo: SearchResultType) => {
    setExpandedGroups(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    )
  }

  const toggleType = (tipo: SearchResultType) => {
    setSelectedTypes(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
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
            <mark key={i} className="bg-primary/20 font-semibold">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  const getPessoaInitials = (nome: string) =>
    nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title={searchTerm ? `Resultados para "${searchTerm}"` : "Buscar no Orgzilla"}
          breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Busca" }]}
        />

        {/* Search Bar */}
        <Card className="p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
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
                  onClick={() => { setSearchQuery(""); setSearchTerm("") }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            Dica: Use <kbd className="rounded border px-1.5 py-0.5">/</kbd> para focar na busca
          </p>
        </Card>

        {!searchTerm ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Search className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold text-secondary">Buscar no Orgzilla</h2>
            <p className="mb-6 text-muted-foreground">Encontre pessoas, times, projetos e cargos</p>
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
        ) : isLoading ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Search className="mb-4 h-16 w-16 animate-pulse text-muted-foreground" />
            <p className="text-muted-foreground">Buscando...</p>
          </Card>
        ) : (
          <>
            {/* Stats Bar */}
            {totalResults > 0 && (
              <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{totalResults}</span>
                  <span className="text-sm text-muted-foreground">
                    {totalResults === 1 ? "resultado encontrado" : "resultados encontrados"}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                {displayResults.pessoas.length > 0 && (
                  <Badge variant="secondary" className="text-white">{displayResults.pessoas.length} Pessoas</Badge>
                )}
                {displayResults.times.length > 0 && (
                  <Badge variant="secondary" className="text-white">{displayResults.times.length} Times</Badge>
                )}
                {displayResults.projetos.length > 0 && (
                  <Badge variant="secondary" className="text-white">{displayResults.projetos.length} Projetos</Badge>
                )}
                {displayResults.cargos.length > 0 && (
                  <Badge variant="secondary" className="text-white">{displayResults.cargos.length} Cargos</Badge>
                )}
                <div className="ml-auto text-xs text-muted-foreground">
                  <Clock className="mr-1 inline h-3 w-3" />
                  via servidor
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
                  {showFilters ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
                </Button>

                <Card className={`space-y-6 p-4 ${showFilters ? "block" : "hidden lg:block"}`}>
                  <div>
                    <h3 className="mb-3 font-semibold text-secondary">Tipo de Resultado</h3>
                    <div className="space-y-2">
                      {([
                        { type: "pessoa" as SearchResultType, label: "Pessoas", count: displayResults.pessoas.length },
                        { type: "time" as SearchResultType, label: "Times", count: displayResults.times.length },
                        { type: "projeto" as SearchResultType, label: "Projetos", count: displayResults.projetos.length },
                        { type: "cargo" as SearchResultType, label: "Cargos", count: displayResults.cargos.length },
                      ]).map(({ type, label, count }) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedTypes.includes(type)}
                            onCheckedChange={() => toggleType(type)}
                          />
                          <Label htmlFor={type} className="flex-1 cursor-pointer text-sm font-normal">
                            {label} <span className="text-muted-foreground">({count})</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => setSelectedTypes(["pessoa", "time", "projeto", "cargo"])}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Results */}
              <div className="space-y-6">
                {totalResults === 0 ? (
                  <Card>
                    <EmptyState
                      illustration="search"
                      title="Nenhum resultado encontrado"
                      description="Tente usar termos diferentes ou verifique a ortografia."
                    />
                    <div className="flex flex-wrap justify-center gap-2 pb-12">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTypes(["pessoa"])}>
                        Buscar apenas em Pessoas
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setSearchTerm("") }}>
                        Limpar busca
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <>
                    {/* Pessoas */}
                    {selectedTypes.includes("pessoa") && displayResults.pessoas.length > 0 && (
                      <div className="space-y-3">
                        <button
                          onClick={() => toggleGroup("pessoa")}
                          className="flex w-full items-center gap-3 rounded-lg border-l-4 border-primary bg-card p-3 hover:bg-muted/50"
                        >
                          <Users className="h-5 w-5 text-primary" />
                          <h2 className="text-lg font-semibold text-secondary">Pessoas</h2>
                          <Badge variant="secondary" className="text-white">{displayResults.pessoas.length}</Badge>
                          {expandedGroups.includes("pessoa")
                            ? <ChevronUp className="ml-auto h-5 w-5" />
                            : <ChevronDown className="ml-auto h-5 w-5" />}
                        </button>

                        {expandedGroups.includes("pessoa") && (
                          <div className="space-y-2">
                            {displayResults.pessoas.map((pessoa: BuscaPessoaItem) => (
                              <Card key={pessoa.id} className="flex items-center gap-4 p-4 transition-all hover:shadow-md">
                                <Avatar className="h-12 w-12">
                                  {pessoa.foto_url && <AvatarImage src={pessoa.foto_url} />}
                                  <AvatarFallback className="bg-primary-strong text-white">
                                    {getPessoaInitials(pessoa.nome)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                  <h3 className="text-lg font-semibold">
                                    {highlightTerm(pessoa.nome, searchTerm)}
                                  </h3>
                                  {pessoa.email_corporativo && (
                                    <p className="text-xs text-muted-foreground">
                                      {highlightTerm(pessoa.email_corporativo, searchTerm)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/pessoas/${pessoa.id}`}>Ver Perfil</Link>
                                  </Button>
                                  <Button variant="ghost" size="icon" aria-label="Favoritar" className="h-8 w-8">
                                    <Star className="h-4 w-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Times */}
                    {selectedTypes.includes("time") && displayResults.times.length > 0 && (
                      <div className="space-y-3">
                        <button
                          onClick={() => toggleGroup("time")}
                          className="flex w-full items-center gap-3 rounded-lg border-l-4 border-accent bg-card p-3 hover:bg-muted/50"
                        >
                          <Network className="h-5 w-5 text-accent" />
                          <h2 className="text-lg font-semibold text-secondary">Times</h2>
                          <Badge variant="secondary" className="text-white">{displayResults.times.length}</Badge>
                          {expandedGroups.includes("time")
                            ? <ChevronUp className="ml-auto h-5 w-5" />
                            : <ChevronDown className="ml-auto h-5 w-5" />}
                        </button>

                        {expandedGroups.includes("time") && (
                          <div className="space-y-2">
                            {displayResults.times.map(time => (
                              <Card key={time.id} className="flex items-center gap-4 p-4 transition-all hover:shadow-md">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                                  <Network className="h-6 w-6 text-accent" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold">
                                    {highlightTerm(time.nome, searchTerm)}
                                  </h3>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/times/${time.id}`}>Ver Time</Link>
                                </Button>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Projetos */}
                    {selectedTypes.includes("projeto") && displayResults.projetos.length > 0 && (
                      <div className="space-y-3">
                        <button
                          onClick={() => toggleGroup("projeto")}
                          className="flex w-full items-center gap-3 rounded-lg border-l-4 border-primary bg-card p-3 hover:bg-muted/50"
                        >
                          <Briefcase className="h-5 w-5 text-primary" />
                          <h2 className="text-lg font-semibold text-secondary">Projetos</h2>
                          <Badge variant="secondary" className="text-white">{displayResults.projetos.length}</Badge>
                          {expandedGroups.includes("projeto")
                            ? <ChevronUp className="ml-auto h-5 w-5" />
                            : <ChevronDown className="ml-auto h-5 w-5" />}
                        </button>

                        {expandedGroups.includes("projeto") && (
                          <div className="space-y-2">
                            {displayResults.projetos.map(projeto => (
                              <Card key={projeto.id} className="flex items-center gap-4 p-4 transition-all hover:shadow-md">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                  <Briefcase className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold">
                                    {highlightTerm(projeto.nome, searchTerm)}
                                  </h3>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/projetos/${projeto.id}`}>Ver Projeto</Link>
                                </Button>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cargos */}
                    {selectedTypes.includes("cargo") && displayResults.cargos.length > 0 && (
                      <div className="space-y-3">
                        <button
                          onClick={() => toggleGroup("cargo")}
                          className="flex w-full items-center gap-3 rounded-lg border-l-4 border-accent bg-card p-3 hover:bg-muted/50"
                        >
                          <Briefcase className="h-5 w-5 text-accent" />
                          <h2 className="text-lg font-semibold text-secondary">Cargos</h2>
                          <Badge variant="secondary" className="text-white">{displayResults.cargos.length}</Badge>
                          {expandedGroups.includes("cargo")
                            ? <ChevronUp className="ml-auto h-5 w-5" />
                            : <ChevronDown className="ml-auto h-5 w-5" />}
                        </button>

                        {expandedGroups.includes("cargo") && (
                          <div className="space-y-2">
                            {displayResults.cargos.map(cargo => (
                              <Card key={cargo.id} className="flex items-center gap-4 p-4 transition-all hover:shadow-md">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                                  <Briefcase className="h-6 w-6 text-accent" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold">
                                    {highlightTerm(cargo.nome, searchTerm)}
                                  </h3>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/configuracoes/cargos?id=${cargo.id}`}>Ver Cargo</Link>
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
