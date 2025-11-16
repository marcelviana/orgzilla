"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Users, Network, Workflow, Briefcase, BarChart3, Settings, LogOut, Bell, Menu, Search, ChevronDown, ChevronRight, Tag, TrendingUp, ShieldAlert } from 'lucide-react'

type NavItem = {
  id: string
  label: string
  icon: React.ElementType
  href: string
}

const mainNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "pessoas", label: "Pessoas", icon: Users, href: "/pessoas" },
  { id: "times", label: "Times", icon: Network, href: "/times" },
  { id: "organograma", label: "Organograma", icon: Workflow, href: "/organograma" },
  { id: "projetos", label: "Projetos", icon: Briefcase, href: "/projetos" },
  { id: "relatorios", label: "Relatórios", icon: BarChart3, href: "/relatorios" },
]

const adminSubmenuItems: NavItem[] = [
  { id: "usuarios", label: "Usuários", icon: Users, href: "/configuracoes/usuarios" },
  { id: "niveis", label: "Níveis", icon: BarChart3, href: "/configuracoes/niveis" },
  { id: "trilhas", label: "Trilhas", icon: TrendingUp, href: "/configuracoes/trilhas" },
  { id: "cargos", label: "Cargos", icon: Briefcase, href: "/configuracoes/cargos" },
  { id: "tags", label: "Tags", icon: Tag, href: "/configuracoes/tags" },
]

export function DashboardShell({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [configExpanded, setConfigExpanded] = useState(pathname?.startsWith('/configuracoes') || false)
  
  const isAdmin = true

  const getActiveRoute = () => {
    if (pathname?.startsWith('/configuracoes')) {
      return 'Configurações'
    }
    return mainNavItems.find(item => item.href === pathname)?.label || "Dashboard"
  }
  
  const activeRoute = getActiveRoute()

  const handleLogout = () => {
    console.log("[v0] User logged out, redirecting to login page")
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-secondary">
      {/* Logo */}
      <div className="flex items-center justify-center px-6 py-6">
        <Image
          src="/images/logo-fundo-escuro.png"
          alt="Orgzilla"
          width={180}
          height={80}
          className="h-auto w-[180px]"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-300 hover:bg-secondary/80 hover:text-white"
              }`}
            >
              {!isActive && (
                <span className="absolute left-0 top-0 h-full w-0 rounded-l-lg bg-accent transition-all group-hover:w-[3px]" />
              )}
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {isAdmin && (
          <div className="mt-2">
            {/* Configurações parent item */}
            <button
              onClick={() => setConfigExpanded(!configExpanded)}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                pathname?.startsWith('/configuracoes')
                  ? "bg-primary text-white"
                  : "text-gray-300 hover:bg-secondary/80 hover:text-white"
              }`}
            >
              {!pathname?.startsWith('/configuracoes') && (
                <span className="absolute left-0 top-0 h-full w-0 rounded-l-lg bg-accent transition-all group-hover:w-[3px]" />
              )}
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">Configurações</span>
              <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0 text-error" />
              {configExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform" />
              )}
            </button>

            {/* Submenu items - shown when expanded */}
            {configExpanded && (
              <div className="mt-1 space-y-1 pl-3">
                {adminSubmenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                        isActive
                          ? "bg-accent/20 text-accent"
                          : "text-gray-400 hover:bg-secondary/60 hover:text-gray-200"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-secondary/80 p-4">
        <Link 
          href="/perfil"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-secondary/60"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-sm font-semibold text-white">
              JS
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white">João Silva</p>
            <Badge className="mt-1 bg-primary text-xs hover:bg-primary">
              Administrador
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:bg-secondary/80 hover:text-white"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleLogout()
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0 lg:hidden">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm lg:px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            {/* Page Title */}
            <h1 className="text-2xl font-bold capitalize text-secondary">
              {activeRoute}
            </h1>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Search Bar - Hidden on Mobile */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar pessoas, times..."
                className="w-64 rounded-full pl-10 lg:w-80"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                3
              </span>
            </Button>

            {/* User Avatar */}
            <Avatar className="h-9 w-9 cursor-pointer border-2 border-transparent transition-all hover:border-accent">
              <AvatarFallback className="bg-primary text-sm font-semibold text-white">
                JS
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-background p-4 lg:p-6">
          {children || (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                Conteúdo do {activeRoute} será exibido aqui
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
