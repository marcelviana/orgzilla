'use client'

import { createContext, useContext } from 'react'

type Usuario = {
  id: string
  nome: string
  email: string
  tipo_perfil: 'admin' | 'gestor' | 'visualizador'
  ativo: boolean
  pessoa?: {
    id: string
    nome: string
    foto_url: string | null
    cargo?: {
      id: string
      nome: string
    } | null
    time?: {
      id: string
      nome: string
    } | null
  } | null
}

const UserContext = createContext<Usuario | null>(null)

export function UserProvider({
  children,
  usuario,
}: {
  children: React.ReactNode
  usuario: Usuario | null
}) {
  return <UserContext.Provider value={usuario}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  return context
}
