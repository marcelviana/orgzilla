"use client"

import { Toaster as Sonner, toast as sonnerToast } from "sonner"
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

/**
 * Toast - Show feedback messages (success, error, warning, info)
 * 
 * @example
 * toast.success("Pessoa salva com sucesso!")
 * toast.error("Erro ao salvar pessoa", { description: "Tente novamente" })
 * toast.info("Nova atualização disponível", { 
 *   action: { label: "Ver", onClick: () => {} }
 * })
 */

interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

const createToast = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  options?: ToastOptions
) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  }

  const colors = {
    success: "text-green-600",
    error: "text-danger",
    warning: "text-primary",
    info: "text-accent",
  }

  return sonnerToast[type](`🦖 ${title}`, {
    description: options?.description,
    duration: options?.duration || 3000,
    icon: icons[type],
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
    classNames: {
      icon: colors[type],
    },
  })
}

export const toast = {
  success: (title: string, options?: ToastOptions) =>
    createToast("success", title, options),
  error: (title: string, options?: ToastOptions) =>
    createToast("error", title, options),
  warning: (title: string, options?: ToastOptions) =>
    createToast("warning", title, options),
  info: (title: string, options?: ToastOptions) =>
    createToast("info", title, options),
}

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      expand={false}
      richColors
      closeButton
    />
  )
}
