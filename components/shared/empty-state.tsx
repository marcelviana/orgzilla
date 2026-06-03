import { Button } from "@/components/ui/button"

/**
 * EmptyState - Show when lists/tables are empty
 * 
 * @example
 * <EmptyState
 *   icon={<Users size={64} />}
 *   title="Nenhuma pessoa encontrada"
 *   description="Comece adicionando a primeira pessoa ao sistema"
 *   action={{ label: "Adicionar Pessoa", onClick: () => {} }}
 * />
 */

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  illustration?: "default" | "search" | "filter" | "error"
}

const dinoIllustrations = {
  default: (
    <div className="text-6xl mb-4">🦕</div>
  ),
  search: (
    <div className="text-6xl mb-4">🦖🔍</div>
  ),
  filter: (
    <div className="text-6xl mb-4">🦕🔽</div>
  ),
  error: (
    <div className="text-6xl mb-4">😢🦖</div>
  ),
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {illustration ? (
        dinoIllustrations[illustration]
      ) : icon ? (
        <div className="text-gray-400 mb-4">{icon}</div>
      ) : (
        dinoIllustrations.default
      )}

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-md">{description}</p>
      )}

      {action && (
        <Button onClick={action.onClick} className="bg-primary-strong hover:bg-primary-strong/90">
          {action.label}
        </Button>
      )}
    </div>
  )
}
