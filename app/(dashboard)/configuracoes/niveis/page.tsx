'use client'

import { useState, Fragment, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Layers, Users, Briefcase, Plus, Info, MoreVertical, ChevronRight, ChevronDown, Eye, Edit, Trash2, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react'
import { TableSkeleton, PageHeader, EmptyState, StatsCard } from '@/components/shared'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { toast } from '@/lib/ui/toast-config'
import { handleError, validateRequired } from '@/lib/errors/error-handler'
import {
  getNiveisComEstatisticas,
  createNivel,
  updateNivel,
  softDeleteNivel,
  type NivelComEstatisticas
} from '@/app/actions/niveis.actions'
import { getCurrentUser, checkIsAdmin } from '@/app/actions/auth.actions'

export default function NiveisPage() {
  // Data state
  const [levels, setLevels] = useState<NivelComEstatisticas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [, setCurrentUser] = useState<string | null>(null)

  // UI state
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [peopleModalOpen, setPeopleModalOpen] = useState(false)
  const [positionsModalOpen, setPositionsModalOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<NivelComEstatisticas | null>(null)

  // Form state
  const [formNome, setFormNome] = useState('')
  const [formNivelAnterior, setFormNivelAnterior] = useState<string | null>(null)
  const [formAtivo, setFormAtivo] = useState(true)

  // Mutation state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load data and check permissions on mount
  useEffect(() => {
    void loadNiveis()
    void checkPermissions()
  }, [])

  async function checkPermissions() {
    try {
      const user = await getCurrentUser()
      if (user) {
        setCurrentUser(user.nome)
        const adminStatus = await checkIsAdmin()
        setIsAdmin(adminStatus)

        if (!adminStatus) {
          const error = {
            type: 'permission' as const,
            message: 'Ops! Você não tem permissão para gerenciar níveis.',
          }
          toast.error(error)
        }
      }
    } catch (err) {
      console.error('[checkPermissions] Erro:', err)
    }
  }

  async function loadNiveis() {
    try {
      setLoading(true)
      setError(null)

      const result = await getNiveisComEstatisticas()

      if (result.success && result.data) {
        setLevels(result.data)
      } else {
        const errorMsg = result.error || 'Não foi possível carregar os níveis'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      const appError = handleError(err, 'database')
      setError(appError.message)
      toast.error(appError)
    } finally {
      setLoading(false)
    }
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const scrollToLevel = (levelId: string) => {
    const element = document.getElementById(`level-row-${levelId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleCreateLevel = async () => {
    // Validar usando helper
    const nomeError = validateRequired(formNome, 'Nome do nível')
    if (nomeError) {
      toast.error(nomeError)
      return
    }

    try {
      setIsSubmitting(true)

      const result = await createNivel({
        nome: formNome.trim(),
        nivel_anterior_id: formNivelAnterior === 'null' ? null : formNivelAnterior,
        ativo: formAtivo,
      })

      if (result.success) {
        toast.successDino(`Nível ${formNome} criado com sucesso!`)

        // Recarrega dados
        await loadNiveis()

        // Fecha modal e reseta form
        setCreateModalOpen(false)
        setFormNome('')
        setFormNivelAnterior(null)
        setFormAtivo(true)
      } else {
        toast.error(result.error || 'Não foi possível criar o nível')
      }
    } catch (err) {
      const appError = handleError(err, 'database')
      toast.error(appError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditLevel = async () => {
    if (!selectedLevel) return

    try {
      setIsSubmitting(true)

      const result = await updateNivel(selectedLevel.id, {
        nivel_anterior_id: formNivelAnterior === 'null' ? null : formNivelAnterior,
        ativo: formAtivo,
      })

      if (result.success) {
        toast.successDino(`Nível ${selectedLevel.nome} atualizado com sucesso!`)

        // Recarrega dados
        await loadNiveis()

        // Fecha modal
        setEditModalOpen(false)
      } else {
        toast.error(result.error || 'Não foi possível atualizar o nível')
      }
    } catch (err) {
      const appError = handleError(err, 'database')
      toast.error(appError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLevel = async () => {
    if (!selectedLevel) return

    try {
      setIsSubmitting(true)

      const result = await softDeleteNivel(selectedLevel.id)

      if (result.success) {
        toast.successDino(`Nível ${selectedLevel.nome} desativado com sucesso!`)

        // Recarrega dados
        await loadNiveis()

        // Fecha modal
        setDeleteModalOpen(false)
      } else {
        toast.error(result.error || 'Não foi possível desativar o nível')
      }
    } catch (err) {
      const appError = handleError(err, 'database')
      toast.error(appError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (levelId: string, currentStatus: boolean) => {
    try {
      const result = await updateNivel(levelId, {
        ativo: !currentStatus,
      })

      if (result.success) {
        const action = !currentStatus ? 'ativado' : 'desativado'
        toast.successDino(`Nível ${action} com sucesso!`)

        // Recarrega dados
        await loadNiveis()
      } else {
        toast.error(result.error || 'Não foi possível atualizar o status')
      }
    } catch (err) {
      const appError = handleError(err, 'database')
      toast.error(appError)
    }
  }

  const getHierarchyChain = (levelId: string): string[] => {
    const chain: string[] = []
    let current = levels.find((l) => l.id === levelId)
    while (current) {
      chain.unshift(current.nome)
      if (!current.nivel_anterior_id) break
      current = levels.find((l) => l.id === current!.nivel_anterior_id)
    }
    return chain
  }

  const niveisEmUso = levels.filter((l) => l.pessoas > 0).length
  const totalCargos = levels.reduce((acc, l) => acc + l.cargos, 0)

  // Loading state
  if (loading) {
    return (
      <DashboardShell>
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-6 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <TableSkeleton rows={5} />
        </div>
      </DashboardShell>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar níveis</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => { void loadNiveis() }} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Níveis"
          breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Configurações", href: "/configuracoes" }, { label: "Níveis" }]}
          badge={{ label: "Admin", variant: "admin" }}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Sobre os níveis"
                onClick={() => setInfoModalOpen(true)}
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCreateModalOpen(true)}
                disabled={!isAdmin}
                title={!isAdmin ? 'Apenas administradores podem criar níveis' : ''}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar nível
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total de Níveis"
            value={levels.length}
            icon={<Layers className="h-6 w-6" />}
            iconWrapperClassName="bg-primary/10 text-primary"
            subtext="L1 até L16"
          />
          <StatsCard
            title="Níveis em Uso"
            value={niveisEmUso}
            icon={<Users className="h-6 w-6" />}
            iconWrapperClassName="bg-accent/10 text-accent"
            subtext="com pessoas alocadas"
          />
          <StatsCard
            title="Cargos por Nível"
            value={totalCargos}
            icon={<Briefcase className="h-6 w-6" />}
            iconWrapperClassName="bg-success/10 text-success"
            subtext="cargos criados"
          />
        </div>

        {/* Visual Hierarchy */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Hierarquia de Níveis</h2>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 pb-4 min-w-max">
              {levels.slice(0, 8).map((level, index) => (
                <div key={level.id} className="flex items-center">
                  <button
                    onClick={() => scrollToLevel(level.id)}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      level.pessoas > 0
                        ? 'border-primary bg-primary/5 hover:bg-primary/10'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-bold">{level.nome}</span>
                    <Badge
                      variant={level.pessoas > 0 ? 'default' : 'secondary'}
                      className={
                        level.pessoas > 0
                          ? 'bg-primary-strong hover:bg-primary-strong'
                          : 'text-white'
                      }
                    >
                      {level.pessoas}
                    </Badge>
                  </button>
                  {index < 7 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground mx-1" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 min-w-max">
              {levels.slice(8).map((level, index) => (
                <div key={level.id} className="flex items-center">
                  <button
                    onClick={() => scrollToLevel(level.id)}
                    className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-bold text-muted-foreground">
                      {level.nome}
                    </span>
                    <Badge variant="secondary" className="text-white">
                      0
                    </Badge>
                  </button>
                  {index < 7 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Nível Anterior</TableHead>
                <TableHead>Pessoas</TableHead>
                <TableHead>Cargos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((level) => (
                <Fragment key={level.id}>
                  <TableRow
                    id={`level-row-${level.id}`}
                    className={
                      level.pessoas > 0 ? 'bg-primary/5' : undefined
                    }
                  >
                    <TableCell>
                      {level.cargos > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Expandir detalhes do nível"
                          onClick={() => toggleRow(level.id)}
                        >
                          {expandedRows.includes(level.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={level.pessoas > 0 ? 'default' : 'secondary'}
                        className={
                          level.pessoas > 0
                            ? 'bg-primary-strong hover:bg-primary-strong'
                            : 'text-white'
                        }
                      >
                        {level.nome}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {level.nivelAnterior ? (
                        <span className="text-sm text-muted-foreground">
                          {level.nivelAnterior} → {level.nome}
                        </span>
                      ) : (
                        <Badge variant="outline">Inicial</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {level.pessoas > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedLevel(level)
                            setPeopleModalOpen(true)
                          }}
                          className="text-accent hover:underline"
                        >
                          {level.pessoas} pessoas
                        </button>
                      ) : (
                        <span className="text-muted-foreground">
                          0 pessoas
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {level.cargos > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedLevel(level)
                            setPositionsModalOpen(true)
                          }}
                          className="text-accent hover:underline"
                        >
                          {level.cargos} cargos
                        </button>
                      ) : (
                        <span className="text-muted-foreground">0 cargos</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={level.ativo}
                        onCheckedChange={() => {
                          void handleToggleStatus(level.id, level.ativo)
                        }}
                        disabled={!isAdmin}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações do nível">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLevel(level)
                              setDetailsModalOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLevel(level)
                              setFormNome(level.nome)
                              setFormNivelAnterior(level.nivel_anterior_id)
                              setFormAtivo(level.ativo)
                              setEditModalOpen(true)
                            }}
                            disabled={!isAdmin}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLevel(level)
                              setPeopleModalOpen(true)
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Ver pessoas
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLevel(level)
                              setPositionsModalOpen(true)
                            }}
                          >
                            <Briefcase className="h-4 w-4 mr-2" />
                            Ver cargos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLevel(level)
                              setDeleteModalOpen(true)
                            }}
                            className="text-red-600"
                            disabled={!isAdmin || level.pessoas > 0 || level.cargos > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedRows.includes(level.id) && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-gray-50">
                        <div className="py-2 px-4">
                          <p className="text-sm font-medium mb-2">
                            Cargos neste nível:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {level.cargosLista.map((cargo, idx) => (
                              <Badge key={idx} variant="outline">
                                {cargo}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent 
          className="p-0"
          onInteractOutside={() => setCreateModalOpen(false)}
          onEscapeKeyDown={() => setCreateModalOpen(false)}
        >
          <div className="p-6 border-b">
            <DialogHeader>
              <DialogTitle>Novo nível</DialogTitle>
              <DialogDescription>
                Crie um novo nível na hierarquia
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome do Nível <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Ex: L9"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Convenção: L1 (júnior) até L16 (executivo)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivelAnterior">Nível Anterior</Label>
              <Select
                value={formNivelAnterior || ''}
                onValueChange={setFormNivelAnterior}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível anterior (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum (nível inicial)</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Define a sequência na hierarquia
              </p>
            </div>

            {formNivelAnterior && formNivelAnterior !== 'null' && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-sm font-medium mb-2">
                  Visualização da hierarquia:
                </p>
                <div className="flex items-center gap-2 text-sm">
                  {getHierarchyChain(formNivelAnterior).map((l, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Badge variant="outline">{l}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                  <Badge className="bg-primary-strong hover:bg-primary-strong">
                    {formNome || 'Novo nível'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ativo">Status</Label>
                <p className="text-sm text-muted-foreground">
                  Nível ativo pode ser usado em novos cargos
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formAtivo}
                onCheckedChange={setFormAtivo}
              />
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-primary-strong hover:bg-primary-strong/90 text-white"
              onClick={() => { void handleCreateLevel() }}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Salvando...' : 'Salvar Nível'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent 
          className="p-0"
          onInteractOutside={() => setEditModalOpen(false)}
          onEscapeKeyDown={() => setEditModalOpen(false)}
        >
          <div className="p-6 border-b">
            <DialogHeader>
              <DialogTitle>Editar nível</DialogTitle>
              <DialogDescription>
                Atualize as informações do nível {selectedLevel?.nome}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome do Nível</Label>
              <Input
                id="edit-nome"
                value={formNome}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-muted-foreground">
                O nome do nível não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nivelAnterior">Nível Anterior</Label>
              <Select
                value={formNivelAnterior || ''}
                onValueChange={setFormNivelAnterior}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível anterior" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum (nível inicial)</SelectItem>
                  {levels
                    .filter((l) => l.id !== selectedLevel?.id)
                    .map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedLevel != null && (selectedLevel.pessoas ?? 0) > 0 && (
                <div className="flex items-start gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Alterar hierarquia afeta progressão de carreira de{' '}
                    {selectedLevel.pessoas} pessoas
                  </span>
                </div>
              )}
            </div>

            {formNivelAnterior && formNivelAnterior !== 'null' && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-sm font-medium mb-2">
                  Visualização da hierarquia:
                </p>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  {getHierarchyChain(formNivelAnterior).map((l, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Badge variant="outline">{l}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                  <Badge className="bg-primary-strong hover:bg-primary-strong">
                    {formNome}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="edit-ativo">Status</Label>
                <p className="text-sm text-muted-foreground">
                  Desativar oculta o nível em seleções de novos cargos
                </p>
              </div>
              <Switch
                id="edit-ativo"
                checked={formAtivo}
                onCheckedChange={setFormAtivo}
              />
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-primary-strong hover:bg-primary-strong/90 text-white"
              onClick={() => { void handleEditLevel() }}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent 
          className="sm:max-w-md"
          onInteractOutside={() => setDeleteModalOpen(false)}
          onEscapeKeyDown={() => setDeleteModalOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>Excluir nível?</DialogTitle>
            <DialogDescription>
              {selectedLevel != null && ((selectedLevel.pessoas ?? 0) > 0 || (selectedLevel.cargos ?? 0) > 0) ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>
                      Não é possível excluir. {selectedLevel.pessoas} pessoas e{' '}
                      {selectedLevel.cargos} cargos neste nível.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>Esta ação não pode ser desfeita.</p>
                  <p className="text-sm text-amber-600">
                    Removerá o nível da hierarquia. Verifique a sequência.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => { void handleDeleteLevel() }}
              disabled={
                isSubmitting ||
                (selectedLevel != null && (selectedLevel.pessoas ?? 0) > 0) ||
                (selectedLevel != null && (selectedLevel.cargos ?? 0) > 0)
              }
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Excluindo...' : 'Excluir nível'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent 
          className="p-0"
          onInteractOutside={() => setDetailsModalOpen(false)}
          onEscapeKeyDown={() => setDetailsModalOpen(false)}
        >
          <div className="p-6 border-b">
            <DialogHeader>
              <DialogTitle>{selectedLevel?.nome} - Detalhes</DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Hierarchy Position */}
            <div>
              <h3 className="font-semibold mb-3">Posição na Hierarquia</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedLevel &&
                  getHierarchyChain(selectedLevel.id).map((l, idx, arr) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Badge
                        variant={l === selectedLevel.nome ? 'default' : 'outline'}
                        className={
                          l === selectedLevel.nome
                            ? 'bg-primary-strong hover:bg-primary-strong'
                            : ''
                        }
                      >
                        {l}
                      </Badge>
                      {idx < arr.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Statistics */}
            <div>
              <h3 className="font-semibold mb-3">Estatísticas</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Total de pessoas
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {selectedLevel?.pessoas || 0}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Total de cargos
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {selectedLevel?.cargos || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Positions */}
            {selectedLevel != null && (selectedLevel.cargos ?? 0) > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Cargos neste Nível</h3>
                <div className="space-y-2">
                  {selectedLevel.cargosLista.map((cargo: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <span>{cargo}</span>
                      <Button variant="ghost" size="sm">
                        Ver cargo
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t flex justify-end">
            <Button onClick={() => setDetailsModalOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* People Modal */}
      <Dialog open={peopleModalOpen} onOpenChange={setPeopleModalOpen}>
        <DialogContent className="p-0">
          <div className="p-6 border-b">
            <DialogHeader>
              <DialogTitle>
                Pessoas no Nível {selectedLevel?.nome}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                {selectedLevel != null && (selectedLevel.pessoas ?? 0) > 0
                  ? `${selectedLevel.pessoas} pessoas neste nível`
                  : 'Nenhuma pessoa neste nível ainda'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Para ver a lista completa, acesse a página de pessoas e filtre por este nível.
              </p>
              <Link href="/pessoas">
                <Button className="mt-4 bg-primary-strong hover:bg-primary-strong/90 text-white">
                  Ir para pessoas
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-6 border-t flex justify-end">
            <Button onClick={() => setPeopleModalOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Positions Modal */}
      <Dialog open={positionsModalOpen} onOpenChange={setPositionsModalOpen}>
        <DialogContent className="p-0">
          <div className="p-6 border-b">
            <DialogHeader>
              <DialogTitle>Cargos no Nível {selectedLevel?.nome}</DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6">
            {selectedLevel != null && (selectedLevel.cargos ?? 0) > 0 ? (
              <div className="space-y-3">
                {selectedLevel.cargosLista.map((cargo: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{cargo}</p>
                      <p className="text-sm text-muted-foreground">
                        Nível {selectedLevel.nome}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Ver cargo
                    </Button>
                  </div>
                ))}
                <Button
                  className="w-full bg-primary-strong hover:bg-primary-strong/90 text-white mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar novo cargo neste nível
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={<Briefcase className="h-12 w-12" />}
                title="Nenhum cargo criado para este nível"
                description="Crie cargos para este nível na seção de Cargos."
              />
            )}
          </div>

          <div className="p-6 border-t flex justify-end">
            <Button onClick={() => setPositionsModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Modal */}
      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent 
          onInteractOutside={() => setInfoModalOpen(false)}
          onEscapeKeyDown={() => setInfoModalOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>Como funcionam os níveis?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="font-semibold mb-2">O que são níveis?</h4>
              <p className="text-sm text-muted-foreground">
                Níveis representam senioridade e progressão de carreira na
                organização.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Hierarquia</h4>
              <p className="text-sm text-muted-foreground">
                L1 (júnior) até L16 (executivo/C-level), formando uma cadeia
                sequencial.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Como usar</h4>
              <p className="text-sm text-muted-foreground">
                Cada nível aponta para o anterior, formando uma cadeia. São
                usados em definição de cargos e promoções.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="font-semibold mb-2">Exemplo de Progressão</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">L2</Badge>
                  <span>Engineer I</span>
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">promoção</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">L3</Badge>
                  <span>Engineer II</span>
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">promoção</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">L4</Badge>
                  <span>Senior Engineer</span>
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">promoção</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">L5</Badge>
                  <span>Staff Engineer</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setInfoModalOpen(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
