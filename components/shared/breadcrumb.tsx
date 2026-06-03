import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// TODO: migrar cores hardcoded (#FF7A00, text-gray-900) para tokens de design

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  /**
   * Lista de itens do breadcrumb.
   * Convenção: primeiro item sempre `{ label: "Dashboard", href: "/" }`.
   * Último item é a página atual — exibido sem link e em destaque.
   */
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumb — navegação contextual padronizada.
 * Fonte única de breadcrumb; usada internamente pelo PageHeader e diretamente
 * por telas de detalhe com header rico.
 *
 * @example
 * <Breadcrumb
 *   items={[
 *     { label: "Dashboard", href: "/" },
 *     { label: "Pessoas", href: "/pessoas" },
 *     { label: pessoa.nome },
 *   ]}
 * />
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 text-sm text-gray-600", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <div key={index} className="flex items-center gap-2">
            {!isLast && item.href ? (
              <Link
                href={item.href}
                className="hover:text-[#FF7A00] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? "text-gray-900 font-medium" : "text-gray-600")}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
          </div>
        )
      })}
    </nav>
  )
}
