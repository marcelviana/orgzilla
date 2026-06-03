"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

/**
 * ConfirmDialog - Standard confirmation dialog for destructive actions
 * 
 * @example
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Excluir Projeto?"
 *   description="8 pessoas estão alocadas e serão desalocadas."
 *   variant="danger"
 *   confirmText="Excluir"
 *   onConfirm={handleDelete}
 * />
 */

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant: "danger" | "warning" | "info"
  onConfirm: () => void
  onCancel?: () => void
  requiresTypedConfirmation?: boolean
  confirmationWord?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant,
  onConfirm,
  onCancel,
  requiresTypedConfirmation = false,
  confirmationWord = "EXCLUIR",
}: ConfirmDialogProps) {
  const [typedConfirmation, setTypedConfirmation] = useState("")

  const isValid = !requiresTypedConfirmation || typedConfirmation === confirmationWord

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTypedConfirmation("")
    }
    onOpenChange(next)
  }

  const handleConfirm = () => {
    if (!isValid) return
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const variantStyles = {
    danger: "bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white",
    warning: "bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white",
    info: "bg-[#00C8FF] hover:bg-[#00C8FF]/90 text-white",
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[450px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requiresTypedConfirmation && (
          <div className="space-y-2 py-4">
            <Label htmlFor="confirmation" className="text-sm text-muted-foreground">
              Digite <span className="font-bold">{confirmationWord}</span> para confirmar
            </Label>
            <Input
              id="confirmation"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder={confirmationWord}
              className="font-mono"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isValid}
            className={variantStyles[variant]}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
