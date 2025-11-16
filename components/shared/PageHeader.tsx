import Link from "next/link"
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
    <div className="border-b border-gray-200 pb-6 mb-6">
      {breadcrumb && (
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          {breadcrumb.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-[#FF7A00] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
              {index < breadcrumb.length - 1 && (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {backButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {badge && (
                <Badge
                  variant={badge.variant === "admin" ? "secondary" : "default"}
                  className={
                    badge.variant === "admin"
                      ? "bg-[#FF7A00] text-white"
                      : ""
                  }
                >
                  {badge.label}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
