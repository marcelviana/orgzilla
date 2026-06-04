import { ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "./breadcrumb"

/**
 * PageHeader - Consistent page headers throughout app
 * 
 * @example
 * <PageHeader
 *   title="Gestão de Pessoas"
 *   breadcrumb={[
 *     { label: "Dashboard", href: "/" },
 *     { label: "Pessoas" }
 *   ]}
 *   badge={{ label: "Admin Only", variant: "admin" }}
 *   actions={
 *     <>
 *       <Button variant="outline">Exportar</Button>
 *       <Button>Adicionar Pessoa</Button>
 *     </>
 *   }
 * />
 */

interface PageHeaderProps {
  title: string
  breadcrumb?: Array<{ label: string; href?: string }>
  description?: string
  badge?: { label: string; variant: "default" | "admin" }
  actions?: React.ReactNode
  backButton?: boolean
}

export function PageHeader({
  title,
  breadcrumb,
  description,
  badge,
  actions,
  backButton = false,
}: PageHeaderProps) {
  return (
    <div className="border-b border-border pb-6 mb-6">
      {breadcrumb && <Breadcrumb items={breadcrumb} className="mb-4" />}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {backButton && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Voltar"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
              {badge && (
                <Badge
                  variant={badge.variant === "admin" ? "secondary" : "default"}
                  className={
                    badge.variant === "admin"
                      ? "bg-primary-strong text-white"
                      : ""
                  }
                >
                  {badge.label}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
