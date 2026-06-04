"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useState, type ReactNode } from "react"

/**
 * ConfirmDialog - Standard confirmation dialog for destructive actions
 *
 * @example
 * // Uso síncrono (fecha imediatamente ao confirmar)
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Excluir projeto?"
 *   description="8 pessoas estão alocadas e serão desalocadas."
 *   variant="danger"
 *   confirmText="Excluir"
 *   onConfirm={handleDelete}
 * />
 *
 * @example
 * // Uso assíncrono (loading interno + trava de fechamento até a Promise resolver)
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Excluir nível?"
 *   description={<NivelDescricaoComMarkup />}
 *   variant="danger"
 *   confirmDisabled={pessoas > 0}
 *   onConfirm={async () => { await softDeleteNivel(id); await loadNiveis() }}
 * />
 */

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** String → renderiza num `<p>`. ReactNode → renderiza via `asChild` (o conteúdo define seu próprio elemento raiz, evitando `<div>`/`<p>` aninhado). */
  description: string | ReactNode
  confirmText?: string
  cancelText?: string
  variant: "danger" | "warning" | "info"
  /** Síncrono → fecha na hora. Retornando Promise → loading interno até resolver. */
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  requiresTypedConfirmation?: boolean
  confirmationWord?: string
  /** Desabilita o botão de confirmar por condição externa (combina com `requiresTypedConfirmation`). */
  confirmDisabled?: boolean
  /** Slot opcional renderizado no corpo, entre a descrição e os botões (ex.: checkbox de confirmação). */
  children?: ReactNode
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
  confirmDisabled = false,
  children,
}: ConfirmDialogProps) {
  const [typedConfirmation, setTypedConfirmation] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)

  const isValid = !requiresTypedConfirmation || typedConfirmation === confirmationWord
  const canConfirm = isValid && !confirmDisabled

  const handleOpenChange = (next: boolean) => {
    // Trava o fechamento (ESC/clique-fora) enquanto a ação async roda.
    if (isConfirming) return
    if (!next) {
      setTypedConfirmation("")
    }
    onOpenChange(next)
  }

  const handleConfirm = () => {
    if (!canConfirm || isConfirming) return

    const maybePromise = onConfirm()

    // Caminho síncrono (usos legados): fecha imediatamente — comportamento idêntico ao anterior.
    if (!(maybePromise instanceof Promise)) {
      onOpenChange(false)
      return
    }

    // Caminho assíncrono: loading interno; só fecha quando a Promise resolve.
    setIsConfirming(true)
    void maybePromise
      .then(() => {
        onOpenChange(false)
      })
      .catch(() => {
        // Erro já tratado dentro do onConfirm (toast); mantém o dialog aberto.
      })
      .finally(() => {
        setIsConfirming(false)
      })
  }

  const handleCancel = () => {
    if (isConfirming) return
    onCancel?.()
    onOpenChange(false)
  }

  // Texto escuro (secondary) sobre a cor semântica: passa WCAG AA em todas as
  // variantes (ex.: navy sobre coral ~5:1). Branco sobre essas cores reprovaria
  // (DESIGN_SYSTEM.md §3.1/§7).
  const variantStyles = {
    danger: "bg-danger hover:bg-danger/90 text-secondary",
    warning: "bg-warning hover:bg-warning/90 text-secondary",
    info: "bg-info hover:bg-info/90 text-secondary",
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className="sm:max-w-[450px]"
        onEscapeKeyDown={(event) => {
          if (isConfirming) event.preventDefault()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">{title}</AlertDialogTitle>
          {typeof description === "string" ? (
            <AlertDialogDescription className="text-base">
              {description}
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription asChild className="text-base">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {children}

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
          <AlertDialogCancel onClick={handleCancel} disabled={isConfirming}>
            {cancelText}
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isConfirming}
            className={variantStyles[variant]}
          >
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
