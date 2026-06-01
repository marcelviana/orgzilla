"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, Calendar, Check, ExternalLink, Eye, EyeOff, Info, Lock, Loader2 } from 'lucide-react'
import Link from "next/link"
import { getUsuarioLogado, type UsuarioLogado } from "@/lib/middleware/auth.middleware"
import { updateUsuario } from "@/app/actions/usuarios.actions"
import { atualizarSenhaAction } from "@/app/actions/auth.actions"
import { toast } from "@/lib/ui/toast-config"

const getProfileBadgeColor = (tipo: string) => {
  switch (tipo) {
    case "admin":
      return "bg-error text-white hover:bg-error/90"
    case "gestor":
      return "bg-primary text-white hover:bg-primary/90"
    case "visualizador":
      return "bg-blue-500 text-white hover:bg-blue-600"
    default:
      return "bg-gray-500 text-white"
  }
}

const getProfileLabel = (tipo: string) => {
  switch (tipo) {
    case "admin":
      return "Administrador"
    case "gestor":
      return "Gestor"
    case "visualizador":
      return "Visualizador"
    default:
      return tipo
  }
}

export default function ProfilePage() {

  // Data state
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UsuarioLogado | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    email: ""
  })
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Password modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      try {
        const userData = await getUsuarioLogado()
        if (userData) {
          setUser(userData)
          setFormData({
            nome: userData.nome,
            email: userData.email
          })
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        toast.error('Erro ao carregar perfil')
      } finally {
        setIsLoading(false)
      }
    }
    void loadUserData()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleCancel = () => {
    if (!user) return
    setFormData({
      nome: user.nome,
      email: user.email
    })
    setIsDirty(false)
  }

  const handleSave = async () => {
    if (!user) return

    // Validation
    if (formData.nome.length < 3) {
      toast.error("Nome deve ter pelo menos 3 caracteres")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Email inválido")
      return
    }

    setIsSaving(true)

    try {
      const result = await updateUsuario(user.id, {
        nome: formData.nome
      })

      if (result.success) {
        toast.successDino("Perfil atualizado com sucesso!")
        setIsDirty(false)
        setUser((prev) => (prev ? { ...prev, nome: formData.nome, email: formData.email } : prev))
      } else {
        toast.error(result.error ?? "Erro ao atualizar perfil")
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast.error("Ops! Orgzilla tropeçou ao salvar o perfil. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length < 8) return { label: "Fraca", color: "bg-red-500", width: "33%" }
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    if (hasUppercase && hasNumber) return { label: "Forte", color: "bg-green-500", width: "100%" }
    return { label: "Média", color: "bg-orange-500", width: "66%" }
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)

  const passwordRequirements = [
    { label: "Mínimo 8 caracteres", met: passwordData.newPassword.length >= 8 },
    { label: "Pelo menos uma letra maiúscula", met: /[A-Z]/.test(passwordData.newPassword) },
    { label: "Pelo menos um número", met: /[0-9]/.test(passwordData.newPassword) }
  ]

  const isPasswordValid = 
    passwordData.currentPassword.length > 0 &&
    passwordData.newPassword.length >= 8 &&
    passwordData.newPassword === passwordData.confirmPassword &&
    passwordData.newPassword !== passwordData.currentPassword

  const handleChangePassword = async () => {
    setIsChangingPassword(true)
    try {
      const result = await atualizarSenhaAction(passwordData.newPassword)
      if (result.success) {
        setPasswordModalOpen(false)
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        toast.successDino("Senha alterada com sucesso!")
      } else {
        toast.error(result.error ?? "Erro ao alterar senha. Tente novamente.")
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error("Ops! Orgzilla tropeçou ao alterar a senha. Tente novamente.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  // No user data
  if (!user) {
    return (
      <DashboardShell>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-error mx-auto" />
            <p className="text-muted-foreground">Erro ao carregar dados do usuário</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-[600px] space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Dashboard</Link>
          <span>{'>'}</span>
          <span className="text-foreground">Meu Perfil</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 pb-6 text-center">
          <Avatar className="h-[120px] w-[120px] border-4 border-accent">
            <AvatarImage src="/placeholder.svg" alt={user.nome} />
            <AvatarFallback className="bg-primary text-4xl font-bold text-white">
              {user.nome.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-secondary">{user.nome}</h1>
            <Badge className={`mt-2 ${getProfileBadgeColor(user.tipo_perfil)}`}>
              {getProfileLabel(user.tipo_perfil)}
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Section 1: Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Seu nome completo"
                className="h-11"
              />
              {formData.nome.length > 0 && formData.nome.length < 3 && (
                <p className="text-sm text-error">Nome deve ter pelo menos 3 caracteres</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="seu@email.com"
                className="h-11"
              />
              {formData.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                <p className="text-sm text-error">Email inválido</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={!isDirty || isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => { void handleSave() }}
                disabled={!isDirty || isSaving}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: System Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Perfil de Acesso</Label>
              <div className="mt-2">
                <Badge className={getProfileBadgeColor(user.tipo_perfil)}>
                  {getProfileLabel(user.tipo_perfil)}
                </Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  Apenas administradores podem alterar perfis de acesso
                </p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-2">
                <Badge className={user.ativo ? "bg-green-500 text-white" : "bg-gray-500 text-white"}>
                  {user.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Membro desde</Label>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Organizational Link */}
        {user.pessoa ? (
          <Card>
            <CardHeader>
              <CardTitle>Dados Organizacionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4">
                <Info className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <p className="text-sm text-blue-900">
                  Sua conta está vinculada a uma pessoa no sistema
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-lg border p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary text-white">
                    {user.pessoa.nome.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-lg font-semibold">{user.pessoa.nome}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {user.pessoa.cargo && (
                      <>
                        <Badge variant="secondary" className="text-white">{user.pessoa.cargo.nome}</Badge>
                        {user.pessoa.cargo.nivel && (
                          <Badge className="bg-primary text-white">{user.pessoa.cargo.nivel.nome}</Badge>
                        )}
                      </>
                    )}
                  </div>
                  {user.pessoa.time && (
                    <p className="mt-1 text-sm text-muted-foreground">{user.pessoa.time.nome}</p>
                  )}
                </div>
                <Link href={`/pessoas/${user.pessoa.id}`}>
                  <Button variant="ghost" size="sm">
                    Ver Perfil Completo
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground">
                Seus dados organizacionais (cargo, time, salário, projetos) são gerenciados por gestores e administradores na página de Pessoa.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Dados Organizacionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Conta não vinculada</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Sua conta de usuário não está vinculada a uma pessoa no sistema organizacional
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Entre em contato com um administrador para vincular sua conta
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 4: Security */}
        <Card>
          <CardHeader>
            <CardTitle>Segurança da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Senha</p>
                  <p className="text-sm text-muted-foreground">
                    Altere sua senha regularmente para manter sua conta segura
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => setPasswordModalOpen(true)}
                className="text-white"
              >
                <Lock className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Modal */}
        <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
          <DialogContent className="sm:max-w-md w-full p-0">
            <DialogHeader className="border-b p-6 pb-4">
              <DialogTitle>Alterar Senha</DialogTitle>
              <DialogDescription>
                Digite sua senha atual e escolha uma nova senha segura
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 p-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual *</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha *</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordData.newPassword.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Força da senha:</span>
                      <span className={`font-medium ${
                        passwordStrength.label === "Forte" ? "text-green-600" :
                        passwordStrength.label === "Média" ? "text-orange-600" :
                        "text-red-600"
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full transition-all ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>
                )}

                {/* Requirements Checklist */}
                <div className="space-y-1.5 pt-2">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {req.met ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={req.met ? "text-green-600" : "text-muted-foreground"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha *</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-sm text-error">As senhas não coincidem</p>
                )}
              </div>
            </div>

            <DialogFooter className="border-t p-6 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setPasswordModalOpen(false)
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                }}
                disabled={isChangingPassword}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => { void handleChangePassword() }}
                disabled={!isPasswordValid || isChangingPassword}
                className="bg-primary hover:bg-primary/90"
              >
                {isChangingPassword ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Alterando...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
