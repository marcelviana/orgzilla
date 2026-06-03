"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Shield, Bell, Users, BarChart3, TrendingUp, Briefcase, Tag, Network, Palette, Globe, Info, HelpCircle, Lock, ChevronRight, Eye, EyeOff, Check, X, Upload, Edit, Trash2, Plus } from 'lucide-react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import type { NivelComEstatisticas } from "@/app/actions/niveis.actions"
import type { TrilhaComEstatisticas } from "@/app/actions/trilhas.actions"
import type { TagComEstatisticas } from "@/app/actions/tags.actions"

// Mock current user (perfil ainda não migrado)
const currentUser = {
  nome: "João Silva",
  email: "joao@orgzilla.com",
  avatar: "/avatar.jpg",
  tipoPerfil: "admin" as "admin" | "gestor" | "visualizador",
  pessoaVinculada: {
    id: "p1",
    nome: "João Silva",
    cargo: "Engineering Manager",
    time: "Engenharia",
    telefone: "(11) 98765-4321",
  },
}

type Section =
  | "perfil"
  | "seguranca"
  | "notificacoes"
  | "usuarios"
  | "niveis"
  | "trilhas"
  | "cargos"
  | "tags"
  | "times-config"
  | "aparencia"
  | "idioma"
  | "sobre"
  | "ajuda"

interface Props {
  niveis: NivelComEstatisticas[]
  trilhas: TrilhaComEstatisticas[]
  tags: TagComEstatisticas[]
}

export default function ConfiguracoesClient({ niveis, trilhas, tags }: Props) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>("perfil")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")

  // Modals
  const [showTagModal, setShowTagModal] = useState(false)
  const [showTrilhaModal, setShowTrilhaModal] = useState(false)
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [editingItem, setEditingItem] = useState<{
    nome?: string
    cor?: string
    descricao?: string
    ativo?: boolean
  } | null>(null)

  const isAdmin = currentUser.tipoPerfil === "admin"
  const isGestor = currentUser.tipoPerfil === "gestor" || isAdmin

  const passwordStrength = () => {
    const hasLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    return { hasLength, hasUpper, hasNumber }
  }

  const strength = passwordStrength()

  const navSections = [
    {
      title: "Conta",
      items: [
        { id: "perfil" as Section, label: "Meu Perfil", icon: User, adminOnly: false },
        { id: "seguranca" as Section, label: "Segurança", icon: Shield, adminOnly: false },
        { id: "notificacoes" as Section, label: "Notificações", icon: Bell, adminOnly: false },
      ],
    },
    {
      title: "Sistema",
      items: [
        { id: "usuarios" as Section, label: "Usuários", icon: Users, adminOnly: true },
        { id: "niveis" as Section, label: "Níveis", icon: BarChart3, adminOnly: true },
        { id: "trilhas" as Section, label: "Trilhas de Carreira", icon: TrendingUp, adminOnly: true },
        { id: "cargos" as Section, label: "Cargos", icon: Briefcase, adminOnly: true },
        { id: "tags" as Section, label: "Tags", icon: Tag, adminOnly: true },
        { id: "times-config" as Section, label: "Times", icon: Network, adminOnly: true },
      ],
    },
    {
      title: "Preferências",
      items: [
        { id: "aparencia" as Section, label: "Aparência", icon: Palette, adminOnly: false },
        { id: "idioma" as Section, label: "Idioma", icon: Globe, adminOnly: false },
      ],
    },
    {
      title: "Sobre",
      items: [
        { id: "sobre" as Section, label: "Sobre o Sistema", icon: Info, adminOnly: false },
        { id: "ajuda" as Section, label: "Ajuda", icon: HelpCircle, adminOnly: false },
      ],
    },
  ]

  const renderSection = () => {
    switch (activeSection) {
      case "perfil":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Meu Perfil</h2>
              <p className="text-sm text-gray-600">Gerencie suas informações pessoais</p>
            </div>

            <Card className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarFallback className="bg-primary text-4xl text-white">JS</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Alterar Foto
                </Button>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-secondary">{currentUser.nome}</h3>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                  <Badge className="mt-2 bg-primary-strong text-white">
                    {currentUser.tipoPerfil === "admin" ? "Administrador" : currentUser.tipoPerfil === "gestor" ? "Gestor" : "Visualizador"}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Informações Pessoais</h3>
              {currentUser.pessoaVinculada ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-accent/10 p-4">
                    <p className="text-sm text-gray-700">
                      Suas informações estão vinculadas a{" "}
                      <Link href={`/pessoas/${currentUser.pessoaVinculada.id}`} className="font-semibold text-accent hover:underline">
                        {currentUser.pessoaVinculada.nome}
                      </Link>
                    </p>
                    <Link href={`/pessoas/${currentUser.pessoaVinculada.id}`} className="mt-2 inline-flex items-center text-sm text-accent hover:underline">
                      Ver perfil completo
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-gray-600">Cargo</Label>
                      <p className="mt-1 font-medium">{currentUser.pessoaVinculada.cargo}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Time</Label>
                      <p className="mt-1 font-medium">{currentUser.pessoaVinculada.time}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Telefone</Label>
                      <p className="mt-1 font-medium">{currentUser.pessoaVinculada.telefone}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm font-medium text-yellow-800">Perfil não vinculado a uma pessoa no sistema</p>
                  <p className="mt-1 text-sm text-yellow-700">Contate um administrador para vincular seu perfil</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Preferências de Email</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Receber notificações por email</p>
                    <p className="text-sm text-gray-600">Receba atualizações por email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Resumo semanal</p>
                    <p className="text-sm text-gray-600">Receba um resumo semanal de atividades</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertas importantes</p>
                    <p className="text-sm text-gray-600">Notificações urgentes e importantes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="mt-6">
                <Button>Salvar Preferências</Button>
              </div>
            </Card>
          </div>
        )

      case "seguranca":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Segurança</h2>
              <p className="text-sm text-gray-600">Gerencie senha e autenticação</p>
            </div>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Alterar Senha</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <div className="relative">
                    <Input id="current-password" type={showPassword ? "text" : "password"} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {strength.hasLength ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-gray-400" />}
                      <span className={strength.hasLength ? "text-green-600" : "text-gray-600"}>Mínimo 8 caracteres</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {strength.hasUpper ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-gray-400" />}
                      <span className={strength.hasUpper ? "text-green-600" : "text-gray-600"}>Pelo menos uma letra maiúscula</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {strength.hasNumber ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-gray-400" />}
                      <span className={strength.hasNumber ? "text-green-600" : "text-gray-600"}>Pelo menos um número</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button>Alterar Senha</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Atividade de Login</h3>
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                Histórico de sessões ainda não disponível nesta versão.
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Autenticação de Dois Fatores</h3>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="mb-2 text-sm font-medium">Status: Não configurado</p>
                <p className="mb-4 text-sm text-gray-600">Adicione uma camada extra de segurança à sua conta</p>
                <Button variant="outline">
                  Ativar 2FA
                </Button>
              </div>
            </Card>
          </div>
        )

      case "notificacoes":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Notificações</h2>
              <p className="text-sm text-gray-600">Escolha como e quando ser notificado</p>
            </div>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Preferências de Notificação</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="mb-3 font-medium text-secondary">Notificações do Sistema</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Atualizações do sistema</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Manutenções programadas</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                {isGestor && (
                  <div>
                    <h4 className="mb-3 font-medium text-secondary">Notificações de Equipe</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Nova pessoa na equipe</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mudança de cargo</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pessoa saiu da equipe</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Vaga preenchida</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="mb-3 font-medium text-secondary">Notificações de Projetos</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Adicionado a projeto</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Removido de projeto</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Projeto concluído</span>
                      <Switch />
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div>
                    <h4 className="mb-3 font-medium text-secondary">Notificações Administrativas</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Novo usuário criado</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Alteração em configurações</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Método de Entrega</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-gray-600">Receba notificações em seu email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações no Aplicativo</p>
                    <p className="text-sm text-gray-600">Veja notificações dentro do Orgzilla</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações Desktop</p>
                    <p className="text-sm text-gray-600">Requer permissão do navegador</p>
                  </div>
                  <Switch />
                </div>
              </div>
              <div className="mt-6">
                <Button>Salvar Preferências</Button>
              </div>
            </Card>
          </div>
        )

      case "usuarios":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Gerenciamento de Usuários</h2>
              <p className="text-sm text-gray-600">Gerencie usuários e permissões do sistema</p>
            </div>

            <Card className="p-6">
              <p className="mb-4 text-gray-700">Para gerenciar usuários completo com criação, edição e exclusão, acesse a página dedicada:</p>
              <Button onClick={() => router.push("/configuracoes/usuarios")}>
                Ver Todos os Usuários
              </Button>
            </Card>
          </div>
        )

      case "niveis":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Níveis Hierárquicos</h2>
              <p className="text-sm text-gray-600">Gerencie os níveis de senioridade (L1-L16)</p>
            </div>

            <Card className="p-6">
              <div className="mb-4 rounded-lg bg-accent/10 p-4">
                <p className="text-sm text-gray-700">Sistema usa 16 níveis nomeados de L1 (júnior) até L16 (executivo)</p>
                <Badge className="mt-2 bg-accent text-white">Faixa em uso: L1 até L{niveis.length}</Badge>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary">Lista de Níveis</h3>
              </div>
              {niveis.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum nível cadastrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-gray-600">
                        <th className="pb-3">Nível</th>
                        <th className="pb-3">Nível Anterior</th>
                        <th className="pb-3">Pessoas</th>
                        <th className="pb-3">Cargos</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {niveis.map((nivel) => (
                        <tr key={nivel.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">{nivel.nome}</td>
                          <td className="py-3">{nivel.nivelAnterior ? `→ ${nivel.nivelAnterior}` : "—"}</td>
                          <td className="py-3">
                            <Badge variant="secondary" className="text-white">{nivel.pessoas} pessoas</Badge>
                          </td>
                          <td className="py-3">
                            <Badge variant="secondary" className="text-white">{nivel.cargos} cargos</Badge>
                          </td>
                          <td className="py-3">
                            <Switch checked={nivel.ativo} disabled />
                          </td>
                          <td className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingItem({ nome: nivel.nome, ativo: nivel.ativo })
                                setShowLevelModal(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )

      case "trilhas":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Trilhas de Carreira</h2>
              <p className="text-sm text-gray-600">Gerencie as trilhas profissionais da organização</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Trilhas</p>
                    <p className="mt-1 text-3xl font-bold text-secondary">{trilhas.length}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cargos Criados</p>
                    <p className="mt-1 text-3xl font-bold text-secondary">
                      {trilhas.reduce((acc, t) => acc + t.cargos, 0)}
                    </p>
                  </div>
                  <Briefcase className="h-10 w-10 text-primary" />
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary">Trilhas</h3>
                <Button
                  onClick={() => {
                    setEditingItem(null)
                    setShowTrilhaModal(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Nova Trilha
                </Button>
              </div>
              {trilhas.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma trilha cadastrada. Adicione a primeira!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-gray-600">
                        <th className="pb-3">Nome da Trilha</th>
                        <th className="pb-3">Descrição</th>
                        <th className="pb-3">Cargos</th>
                        <th className="pb-3">Pessoas</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {trilhas.map((trilha) => (
                        <tr key={trilha.id} className="border-b last:border-0">
                          <td className="py-3 font-medium">{trilha.nome}</td>
                          <td className="py-3 max-w-xs truncate text-gray-600">{trilha.descricao ?? "—"}</td>
                          <td className="py-3">
                            <Badge variant="secondary" className="text-white">{trilha.cargos}</Badge>
                          </td>
                          <td className="py-3">
                            <Badge variant="secondary" className="text-white">{trilha.pessoas}</Badge>
                          </td>
                          <td className="py-3">
                            <Switch checked={trilha.ativo} disabled />
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingItem({ nome: trilha.nome, descricao: trilha.descricao ?? undefined, ativo: trilha.ativo })
                                  setShowTrilhaModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )

      case "tags":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Tags</h2>
              <p className="text-sm text-gray-600">Gerencie tags para categorizar pessoas e projetos</p>
            </div>

            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary">Tags Disponíveis</h3>
                <Button
                  onClick={() => {
                    setEditingItem(null)
                    setShowTagModal(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Nova Tag
                </Button>
              </div>
              {tags.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma tag cadastrada. Adicione a primeira!</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 transition-all hover:scale-105 hover:shadow-lg"
                      style={{ borderColor: tag.cor }}
                    >
                      <div className="mb-2 h-8 w-8 rounded-full" style={{ backgroundColor: tag.cor }} />
                      <p className="font-medium text-secondary">{tag.nome}</p>
                      <p className="text-xs text-gray-600">Usada em {tag.pessoas} pessoas</p>
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingItem({ nome: tag.nome, cor: tag.cor })
                            setShowTagModal(true)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {tag.pessoas === 0 && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )

      case "aparencia":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Aparência</h2>
              <p className="text-sm text-gray-600">Personalize a aparência do sistema</p>
            </div>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Tema</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-white border" />
                    <div>
                      <p className="font-medium">Claro</p>
                      <p className="text-sm text-gray-600">Tema padrão do sistema</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4 opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-gray-900" />
                    <div>
                      <p className="font-medium">Escuro</p>
                      <p className="text-sm text-gray-600">Em breve</p>
                    </div>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Cor de Destaque</h3>
              <p className="mb-4 text-sm text-gray-600">A cor primária do Orgzilla é o Laranja Kaiju (#FF7A00) e não pode ser alterada</p>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-primary" />
                <div>
                  <p className="font-medium text-primary">#FF7A00</p>
                  <p className="text-sm text-gray-600">Laranja Kaiju</p>
                </div>
              </div>
            </Card>
          </div>
        )

      case "idioma":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Idioma</h2>
              <p className="text-sm text-gray-600">Escolha o idioma do sistema</p>
            </div>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Idioma da Interface</h3>
              <Select defaultValue="pt-br">
                <SelectTrigger className="w-full md:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                  <SelectItem value="en" disabled>
                    English (Em breve)
                  </SelectItem>
                  <SelectItem value="es" disabled>
                    Español (Em breve)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-sm text-gray-600">Atualmente, o Orgzilla está disponível apenas em Português (Brasil)</p>
            </Card>
          </div>
        )

      case "sobre":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Sobre o Sistema</h2>
              <p className="text-sm text-gray-600">Informações sobre o Orgzilla</p>
            </div>

            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <Image src="/images/logo-fundo-claro.png" alt="Orgzilla" width={200} height={100} className="mb-4" />
                <h3 className="text-2xl font-bold text-secondary">Orgzilla</h3>
                <p className="mt-2 text-gray-600">Sistema de Gestão de Pessoas e Times</p>
                <Badge className="mt-4 bg-primary-strong text-white">Versão 1.0.0</Badge>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Sobre</h3>
              <p className="text-gray-700">
                O Orgzilla é um sistema completo para gestão de pessoas, times e projetos. Com uma interface intuitiva e recursos poderosos,
                o Orgzilla ajuda sua organização a crescer de forma organizada e eficiente.
              </p>
              <p className="mt-4 text-gray-700">
                Desenvolvido com Next.js, React e Tailwind CSS, o Orgzilla oferece uma experiência moderna e responsiva em todos os dispositivos.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Recursos</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Gestão completa de pessoas e times
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Organograma interativo
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Gestão de projetos e alocações
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Relatórios e dashboards
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Sistema de permissões
                </li>
              </ul>
            </Card>
          </div>
        )

      case "ajuda":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-secondary">Ajuda</h2>
              <p className="text-sm text-gray-600">Central de ajuda e suporte</p>
            </div>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Precisa de Ajuda?</h3>
              <p className="mb-4 text-gray-700">Entre em contato com nosso time de suporte através dos canais abaixo:</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                  <Bell className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">suporte@orgzilla.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Documentação</p>
                    <Link href="#" className="text-sm text-accent hover:underline">
                      Acessar documentação completa
                    </Link>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-secondary">Perguntas Frequentes</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Como adicionar uma nova pessoa?</p>
                  <p className="mt-1 text-sm text-gray-600">Acesse o menu Pessoas e clique em "Adicionar Pessoa"</p>
                </div>
                <div>
                  <p className="font-medium">Como criar um novo time?</p>
                  <p className="mt-1 text-sm text-gray-600">Acesse o menu Times e clique em "Criar Time"</p>
                </div>
                <div>
                  <p className="font-medium">Como gerenciar permissões?</p>
                  <p className="mt-1 text-sm text-gray-600">Apenas administradores podem gerenciar permissões em Configurações &gt; Usuários</p>
                </div>
              </div>
            </Card>
          </div>
        )

      default:
        return <div>Seção em desenvolvimento</div>
    }
  }

  return (
    <DashboardShell>
      <div className="flex gap-6">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden w-72 flex-shrink-0 lg:block">
          <Card className="sticky top-6 p-6">
            <h2 className="mb-6 text-2xl font-bold text-secondary">Configurações</h2>
            <nav className="space-y-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">{section.title}</h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      if (item.adminOnly && !isAdmin) return null
                      const Icon = item.icon
                      const isActive = activeSection === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                            isActive ? "bg-primary-strong text-white" : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span>{item.label}</span>
                          {item.adminOnly && !isAdmin && <Lock className="ml-auto h-3 w-3" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </Card>
        </div>

        {/* Mobile Tabs Navigation */}
        <div className="block w-full lg:hidden">
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as Section)} className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="perfil">Conta</TabsTrigger>
              {isAdmin && <TabsTrigger value="usuarios">Sistema</TabsTrigger>}
              <TabsTrigger value="aparencia">Preferências</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="flex-1">{renderSection()}</div>
      </div>

      {/* Tag Modal */}
      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent className="sm:max-w-md w-full p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Tag" : "Criar Nova Tag"}</DialogTitle>
              <DialogDescription>Configure o nome e a cor da tag</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="tag-name">Nome da Tag *</Label>
                <Input id="tag-name" defaultValue={editingItem?.nome} placeholder="Ex: Frontend" />
              </div>
              <div>
                <Label htmlFor="tag-color">Cor</Label>
                <Input id="tag-color" type="color" defaultValue={editingItem?.cor || "#FF7A00"} />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t p-6">
            <Button variant="outline" onClick={() => setShowTagModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowTagModal(false)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trilha Modal */}
      <Dialog open={showTrilhaModal} onOpenChange={setShowTrilhaModal}>
        <DialogContent className="sm:max-w-lg w-full p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Trilha" : "Criar Nova Trilha"}</DialogTitle>
              <DialogDescription>Configure o nome e descrição da trilha de carreira</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="trilha-name">Nome da Trilha *</Label>
                <Input id="trilha-name" defaultValue={editingItem?.nome} placeholder="Ex: Engenharia de Software" />
              </div>
              <div>
                <Label htmlFor="trilha-desc">Descrição</Label>
                <Textarea id="trilha-desc" defaultValue={editingItem?.descricao} placeholder="Descreva a trilha de carreira" rows={3} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="trilha-status">Status Ativo</Label>
                <Switch id="trilha-status" defaultChecked={editingItem?.ativo ?? true} />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t p-6">
            <Button variant="outline" onClick={() => setShowTrilhaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowTrilhaModal(false)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Modal */}
      <Dialog open={showLevelModal} onOpenChange={setShowLevelModal}>
        <DialogContent className="sm:max-w-lg w-full p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Nível" : "Criar Novo Nível"}</DialogTitle>
              <DialogDescription>Configure os detalhes do nível hierárquico</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="nivel-name">Nome do Nível *</Label>
                <Input id="nivel-name" defaultValue={editingItem?.nome} placeholder="Ex: L9" />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t p-6">
            <Button variant="outline" onClick={() => setShowLevelModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowLevelModal(false)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
