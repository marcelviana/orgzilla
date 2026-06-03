import { Badge } from "@/components/ui/badge"

/**
 * StatusBadge - Consistent status badges
 * 
 * @example
 * <StatusBadge status="ativo" />
 * <StatusBadge status="ferias" size="md" />
 */

interface StatusBadgeProps {
  status: "ativo" | "ferias" | "licenca" | "afastamento" | "desligado"
  size?: "sm" | "md"
}

const statusConfig = {
  ativo: {
    label: "Ativo",
    color: "bg-green-100 text-green-800 border-green-200",
    dotColor: "bg-green-500",
  },
  ferias: {
    label: "Férias",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    dotColor: "bg-blue-500",
  },
  licenca: {
    label: "Licença",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    dotColor: "bg-orange-500",
  },
  afastamento: {
    label: "Afastamento",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dotColor: "bg-yellow-500",
  },
  desligado: {
    label: "Desligado",
    color: "bg-gray-100 text-foreground border-gray-200",
    dotColor: "bg-gray-500",
  },
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status]
  const sizeClasses = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5"

  return (
    <Badge
      variant="outline"
      className={`${config.color} ${sizeClasses} font-medium rounded-full inline-flex items-center gap-1.5`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </Badge>
  )
}
