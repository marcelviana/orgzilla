"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, ShieldAlert, Network, Plus, Search, MoreVertical, Eye, EyeOff, Filter, ChevronDown, LinkIcon, Unlink, Trash2, CheckCircle2, XCircle, Download, X, Loader2 } from 'lucide-react'
import { TableSkeleton } from '@/components/shared/loading-state'
import Link from "next/link"
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  softDeleteUsuario,
  reactivateUsuario,
  getPessoasSemUsuario,
  type UsuarioListItem
} from '@/app/actions/usuarios.actions'
import { handleError } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `há ${diffMins} minutos`
  if (diffHours < 24) return `há ${diffHours} horas`
  if (diffDays === 1) return "há 1 dia"
  if (diffDays < 30) return `há ${diffDays} dias`
  return date.toLocaleDateString("pt-BR")
}

export default function UsuariosPage() {
  // Data state
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<UsuarioListItem[]>([])
  const [availablePessoas, setAvailablePessoas] = useState<Array<{ id: string; nome: string; email_corporativo: string | null }>>([])

  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filterProfile, setFilterProfile] = useState("todos")
  const [filterStatus, setFilterStatus] = useState("todos")
  const [filterLinked, setFilterLinked] = useState("todos")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false)
  const [_passwordModalOpen, _setPasswordModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UsuarioListItem | null>(null)
  const [selectedPessoaId, setSelectedPessoaId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    tipoPerfil: "visualizador" as "admin" | "gestor" | "visualizador",
    senha: "",
    ativo: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load data on mount
  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const [usuariosResult, pessoasResult] = await Promise.all([
        getUsuarios(),
        getPessoasSemUsuario()
      ])

      if (usuariosResult.success && usuariosResult.data) {
        setUsers(usuariosResult.data)
      } else if (!usuariosResult.success) {
        toast.error(String(usuariosResult.error))
      }

      if (pessoasResult.success && pessoasResult.data) {
        setAvailablePessoas(pessoasResult.data)
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    } finally {
      setIsLoading(false)
    }
  }

  // Filter and search users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesProfile =
      filterProfile === "todos" || user.tipo_perfil === filterProfile

    const matchesStatus =
      filterStatus === "todos" ||
      (filterStatus === "ativos" && user.ativo) ||
      (filterStatus === "inativos" && !user.ativo)

    const matchesLinked =
      filterLinked === "todos" ||
      (filterLinked === "vinculados" && user.pessoa !== undefined && user.pessoa !== null) ||
      (filterLinked === "sem-vinculo" && (user.pessoa === undefined || user.pessoa === null))

    return matchesSearch && matchesProfile && matchesStatus && matchesLinked
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.ativo).length
  const inactiveUsers = users.filter((u) => !u.ativo).length
  const admins = users.filter((u) => u.tipo_perfil === "admin").length
  const gestores = users.filter((u) => u.tipo_perfil === "gestor").length

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const result = currentStatus
        ? await softDeleteUsuario(userId)
        : await reactivateUsuario(userId)

      if (result.success) {
        toast.success(currentStatus ? 'Usuário desativado' : 'Usuário reativado')
        await loadData()
      } else {
        toast.error(handleError(new Error(result.error ?? 'Erro ao alterar status'), 'database'))
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    }
  }

  const handleCreateUser = async () => {
    if (!formData.nome || !formData.email) {
      toast.error({ type: 'validation', message: 'Preencha nome e email' })
      return
    }

    setIsSaving(true)
    try {
      const result = await createUsuario({
        email: formData.email,
        nome: formData.nome,
        tipo_perfil: formData.tipoPerfil,
        pessoa_id: selectedPessoaId,
        ativo: formData.ativo
      })

      if (result.success) {
        toast.successDino('Usuário criado com sucesso!')
        setCreateModalOpen(false)
        setFormData({
          nome: "",
          email: "",
          tipoPerfil: "visualizador",
          senha: "",
          ativo: true,
        })
        setSelectedPessoaId(null)
        await loadData()
      } else {
        toast.error(handleError(new Error(result.error ?? 'Erro ao criar usuário'), 'database'))
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditUser = async () => {
    if (!currentUser) return

    setIsSaving(true)
    try {
      const result = await updateUsuario(currentUser.id, {
        nome: formData.nome,
        tipo_perfil: formData.tipoPerfil,
        ativo: formData.ativo
      })

      if (result.success) {
        toast.successDino('Usuário atualizado com sucesso!')
        setEditModalOpen(false)
        await loadData()
      } else {
        toast.error(handleError(new Error(result.error ?? 'Erro ao atualizar usuário'), 'database'))
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirmed || !currentUser) return

    try {
      const result = await softDeleteUsuario(currentUser.id)

      if (result.success) {
        toast.success('Usuário desativado com sucesso')
        setDeleteModalOpen(false)
        setDeleteConfirmed(false)
        await loadData()
      } else {
        toast.error(handleError(new Error(result.error ?? 'Erro ao desativar usuário'), 'database'))
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    }
  }

  const handleLinkPessoa = async () => {
    if (!currentUser || !selectedPessoaId) return

    try {
      const result = await updateUsuario(currentUser.id, {
        pessoa_id: selectedPessoaId
      })

      if (result.success) {
        toast.success('Pessoa vinculada com sucesso')
        setLinkModalOpen(false)
        setSelectedPessoaId(null)
        await loadData()
      } else {
        toast.error(handleError(new Error(result.error ?? 'Erro ao vincular pessoa'), 'database'))
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    }
  }

  const handleUnlinkPessoa = async () => {
    if (!currentUser) return

    try {
      const result = await updateUsuario(currentUser.id, {
        pessoa_id: null
      })

      if (result.success) {
        toast.success('Pessoa desvinculada com sucesso')
        setUnlinkModalOpen(false)
        await loadData()
      } else {
        toast.error(handleError(new Error(result.error ?? 'Erro ao desvincular pessoa'), 'database'))
      }
    } catch (error) {
      toast.error(handleError(error, 'database'))
    }
  }

  const handleBulkAction = (action: string) => {
    toast.info('Ação em massa: ' + action)
    setSelectedUsers([])
  }

  const getProfileBadge = (tipo: string) => {
    switch (tipo) {
      case "admin":
        return (
          <Badge className="bg-error text-white">
            Admin
          </Badge>
        )
      case "gestor":
        return (
          <Badge className="bg-primary-strong text-white">
            Gestor
          </Badge>
        )
      case "visualizador":
        return (
          <Badge className="bg-accent text-white">
            Visualizador
          </Badge>
        )
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="p-6">
          <TableSkeleton rows={8} />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">
                Dashboard
              </Link>
              <span>&gt;</span>
              <Link href="/configuracoes" className="hover:text-primary">
                Configurações
              </Link>
              <span>&gt;</span>
              <span className="text-foreground">Usuários</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-secondary">
                Usuários
              </h1>
              <ShieldAlert className="h-5 w-5 text-error" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-primary-strong hover:bg-primary-strong/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Usuário
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="mt-2 text-3xl font-bold text-secondary">{totalUsers}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeUsers} ativos, {inactiveUsers} inativos
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="mt-2 text-3xl font-bold text-secondary">{admins}</p>
                <p className="mt-1 text-sm text-muted-foreground">acesso total</p>
              </div>
              <div className="rounded-lg bg-error/10 p-3">
                <ShieldAlert className="h-6 w-6 text-error" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gestores</p>
                <p className="mt-2 text-3xl font-bold text-secondary">{gestores}</p>
                <p className="mt-1 text-sm text-muted-foreground">gerenciam equipes</p>
              </div>
              <div className="rounded-lg bg-accent/10 p-3">
                <Network className="h-6 w-6 text-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border bg-white">
          <Button
            variant="ghost"
            className="w-full justify-between p-4"
            onClick={() => setShowFilters(!showFilters)}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filtros</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </Button>

          {showFilters && (
            <div className="border-t p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Tipo de Perfil</Label>
                  <Select value={filterProfile} onValueChange={setFilterProfile}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="visualizador">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativos">Ativos</SelectItem>
                      <SelectItem value="inativos">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Pessoa Vinculada</Label>
                  <Select value={filterLinked} onValueChange={setFilterLinked}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="vinculados">Com Pessoa Vinculada</SelectItem>
                      <SelectItem value="sem-vinculo">Sem Vínculo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterProfile("todos")
                    setFilterStatus("todos")
                    setFilterLinked("todos")
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedUsers.length === paginatedUsers.length &&
                      paginatedUsers.length > 0
                    }
                    onCheckedChange={(checked) => {
                      setSelectedUsers(
                        checked ? paginatedUsers.map((u) => u.id) : []
                      )
                    }}
                  />
                </TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo de Perfil</TableHead>
                <TableHead>Pessoa Vinculada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        setSelectedUsers((prev) =>
                          checked
                            ? [...prev, user.id]
                            : prev.filter((id) => id !== user.id)
                        )
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>
                          {user.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>{getProfileBadge(user.tipo_perfil)}</TableCell>
                  <TableCell>
                    {user.pessoa ? (
                      <Link
                        href={`/pessoas/${user.pessoa.id}`}
                        className="text-primary hover:underline"
                      >
                        {user.pessoa.nome}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Sem vínculo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.ativo}
                      onCheckedChange={() => { void handleToggleStatus(user.id, user.ativo) }}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelativeTime(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setCurrentUser(user)
                            setFormData({
                              nome: user.nome,
                              email: user.email,
                              tipoPerfil: user.tipo_perfil,
                              senha: "",
                              ativo: user.ativo,
                            })
                            setEditModalOpen(true)
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        {user.pessoa ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentUser(user)
                              setUnlinkModalOpen(true)
                            }}
                          >
                            <Unlink className="mr-2 h-4 w-4" />
                            Desvincular Pessoa
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentUser(user)
                              setLinkModalOpen(true)
                            }}
                          >
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Vincular Pessoa
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-error"
                          onClick={() => {
                            setCurrentUser(user)
                            setDeleteModalOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1}-
              {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length}{" "}
              usuários
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="fixed bottom-0 left-60 right-0 border-t bg-secondary p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {selectedUsers.length} usuários selecionados
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleBulkAction("ativar")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Ativar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleBulkAction("desativar")}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Desativar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleBulkAction("exportar")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-secondary/80"
                  onClick={() => setSelectedUsers([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit User Modal */}
        <Dialog
          open={createModalOpen || editModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setCreateModalOpen(false)
              setEditModalOpen(false)
              setFormData({
                nome: "",
                email: "",
                tipoPerfil: "visualizador",
                senha: "",
                ativo: true,
              })
            }
          }}
        >
          <DialogContent 
            className="p-0"
            onInteractOutside={(_e) => {
              setCreateModalOpen(false)
              setEditModalOpen(false)
              setFormData({
                nome: "",
                email: "",
                tipoPerfil: "visualizador",
                senha: "",
                ativo: true,
              })
            }}
            onEscapeKeyDown={(_e) => {
              setCreateModalOpen(false)
              setEditModalOpen(false)
              setFormData({
                nome: "",
                email: "",
                tipoPerfil: "visualizador",
                senha: "",
                ativo: true,
              })
            }}
          >
            <div className="p-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle>
                  {createModalOpen ? "Novo Usuário" : "Editar Usuário"}
                </DialogTitle>
                <DialogDescription>
                  {createModalOpen
                    ? "Preencha as informações para criar um novo usuário"
                    : "Atualize as informações do usuário"}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <Label htmlFor="nome">
                  Nome Completo <span className="text-error">*</span>
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Nome completo do usuário"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">
                  Email <span className="text-error">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                  className="mt-1"
                  disabled={editModalOpen}
                />
              </div>

              <div>
                <Label>
                  Tipo de Perfil <span className="text-error">*</span>
                </Label>
                <div className="mt-2 space-y-3">
                  <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/5">
                    <input
                      type="radio"
                      name="tipoPerfil"
                      value="admin"
                      checked={formData.tipoPerfil === "admin"}
                      onChange={(e) =>
                        setFormData({ ...formData, tipoPerfil: e.target.value as 'admin' | 'gestor' | 'visualizador' })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-error" />
                        <span className="font-medium">Admin</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Acesso total ao sistema e configurações
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/5">
                    <input
                      type="radio"
                      name="tipoPerfil"
                      value="gestor"
                      checked={formData.tipoPerfil === "gestor"}
                      onChange={(e) =>
                        setFormData({ ...formData, tipoPerfil: e.target.value as 'admin' | 'gestor' | 'visualizador' })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-primary" />
                        <span className="font-medium">Gestor</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Gerencia sua equipe e hierarquia
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/5">
                    <input
                      type="radio"
                      name="tipoPerfil"
                      value="visualizador"
                      checked={formData.tipoPerfil === "visualizador"}
                      onChange={(e) =>
                        setFormData({ ...formData, tipoPerfil: e.target.value as 'admin' | 'gestor' | 'visualizador' })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-accent" />
                        <span className="font-medium">Visualizador</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Apenas visualização, sem edições
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {createModalOpen && (
                <div>
                  <Label htmlFor="senha">
                    Senha <span className="text-error">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      value={formData.senha}
                      onChange={(e) =>
                        setFormData({ ...formData, senha: e.target.value })
                      }
                      placeholder="Mínimo 8 caracteres"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {formData.senha && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Força:{" "}
                      {formData.senha.length < 8
                        ? "Fraca"
                        : formData.senha.length < 12
                          ? "Média"
                          : "Forte"}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Status do Usuário</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuários inativos não podem fazer login
                  </p>
                </div>
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: checked })
                  }
                />
              </div>

              {formData.tipoPerfil === "admin" && (
                <div className="rounded-lg border border-error/20 bg-error/5 p-4">
                  <p className="text-sm text-error">
                    Administradores têm acesso total ao sistema
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 pt-4 border-t">
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateModalOpen(false)
                    setEditModalOpen(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => { void (createModalOpen ? handleCreateUser() : handleEditUser()) }}
                  className="bg-primary-strong hover:bg-primary-strong/90 text-white"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Usuário'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete User Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent 
            className="sm:max-w-md"
            onInteractOutside={() => {
              setDeleteModalOpen(false)
              setDeleteConfirmed(false)
            }}
            onEscapeKeyDown={() => {
              setDeleteModalOpen(false)
              setDeleteConfirmed(false)
            }}
          >
            <DialogHeader>
              <DialogTitle>Excluir Usuário?</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. O usuário perderá acesso ao
                sistema.
                {currentUser?.pessoa && (
                  <span className="mt-2 block">
                    A pessoa {currentUser.pessoa.nome} permanecerá no
                    sistema, apenas o acesso será removido.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-2 py-4">
              <Checkbox
                id="confirm"
                checked={deleteConfirmed}
                onCheckedChange={(checked) =>
                  setDeleteConfirmed(checked as boolean)
                }
              />
              <label
                htmlFor="confirm"
                className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Entendo as consequências
              </label>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setDeleteConfirmed(false)
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={!deleteConfirmed}
                onClick={() => { void handleDeleteUser() }}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link Person Modal */}
        <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
          <DialogContent
            className="sm:max-w-md"
            onInteractOutside={() => {
              setLinkModalOpen(false)
              setSelectedPessoaId(null)
            }}
            onEscapeKeyDown={() => {
              setLinkModalOpen(false)
              setSelectedPessoaId(null)
            }}
          >
            <DialogHeader>
              <DialogTitle>Vincular Pessoa</DialogTitle>
              <DialogDescription>
                Selecione a pessoa para vincular ao usuário {currentUser?.nome}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Pessoa</Label>
              <Select value={selectedPessoaId || ''} onValueChange={setSelectedPessoaId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione uma pessoa" />
                </SelectTrigger>
                <SelectContent>
                  {availablePessoas.map((pessoa) => (
                    <SelectItem key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome} {pessoa.email_corporativo ? `(${pessoa.email_corporativo})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setLinkModalOpen(false)
                  setSelectedPessoaId(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => { void handleLinkPessoa() }}
                disabled={!selectedPessoaId}
              >
                Vincular
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unlink Person Modal */}
        <Dialog open={unlinkModalOpen} onOpenChange={setUnlinkModalOpen}>
          <DialogContent
            className="sm:max-w-md"
            onInteractOutside={() => setUnlinkModalOpen(false)}
            onEscapeKeyDown={() => setUnlinkModalOpen(false)}
          >
            <DialogHeader>
              <DialogTitle>Desvincular Pessoa?</DialogTitle>
              <DialogDescription>
                Usuário continuará existindo mas sem vínculo com a pessoa{" "}
                {currentUser?.pessoa?.nome}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUnlinkModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => { void handleUnlinkPessoa() }}>
                Desvincular
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
