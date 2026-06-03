import { Badge } from "@/components/ui/badge"

/**
 * StatusBadge — badge de status padronizado (DESIGN_SYSTEM.md §6.9).
 *
 * Paleta semântica, mesma cor para o mesmo significado em todo o produto:
 *   ativo → success · férias → info · licença/afastamento → warning ·
 *   desligado → danger · inativo/encerrado/desconhecido → neutro.
 *
 * Rótulo em texto escuro (foreground) sobre tinta clara da cor semântica + um
 * "dot" na cor cheia: legível (§7) e com o significado carregado pela cor.
 *
 * Aceita o status em qualquer caixa/acentuação ('ativo', 'Ativo', 'Férias',
 * 'Ativo'/'Inativo' de projeto/time): normaliza internamente.
 *
 * @example
 * <StatusBadge status="ativo" />
 * <StatusBadge status={projeto.ativo ? "Ativo" : "Inativo"} />
 */

interface StatusBadgeProps {
  status: string
  size?: "sm" | "md"
}

interface StatusStyle {
  label: string
  tint: string
  dot: string
}

const NEUTRAL: StatusStyle = {
  label: "",
  tint: "bg-muted border-border",
  dot: "bg-muted-foreground",
}

function styleFor(status: string): StatusStyle {
  const key = status.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
  switch (key) {
    case "ativo":
      return { label: "Ativo", tint: "bg-success/10 border-success/30", dot: "bg-success" }
    case "ferias":
      return { label: "Férias", tint: "bg-info/10 border-info/30", dot: "bg-info" }
    case "licenca":
      return { label: "Licença", tint: "bg-warning/10 border-warning/30", dot: "bg-warning" }
    case "afastamento":
      return { label: "Afastamento", tint: "bg-warning/10 border-warning/30", dot: "bg-warning" }
    case "desligado":
      return { label: "Desligado", tint: "bg-danger/10 border-danger/30", dot: "bg-danger" }
    default:
      // inativo, encerrado, ou qualquer valor não mapeado → neutro, rótulo original
      return { ...NEUTRAL, label: status }
  }
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = styleFor(status)
  const sizeClasses = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5"

  return (
    <Badge
      variant="outline"
      className={`${style.tint} text-foreground ${sizeClasses} font-medium rounded-full inline-flex items-center gap-1.5`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </Badge>
  )
}
