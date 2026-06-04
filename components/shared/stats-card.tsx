"use client"

import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * StatsCard - Display metrics/stats consistently
 *
 * @example
 * <StatsCard
 *   title="Total de Pessoas"
 *   value={127}
 *   icon={<Users className="h-6 w-6" />}
 *   iconWrapperClassName="bg-primary/10 text-primary"
 *   trend={{ value: "+5", direction: "up" }}
 *   subtext="este mês"
 *   href="/pessoas"
 * />
 */

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: string; direction: "up" | "down" | "neutral" }
  subtext?: string
  onClick?: () => void
  /** Navega como link real (preserva semântica de âncora — §7). Tem precedência sobre onClick. */
  href?: string
  /** Classe do círculo do ícone — permite diferenciar métricas por cor (§6.7). Padrão: bg-primary/10. */
  iconWrapperClassName?: string
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  subtext,
  onClick,
  href,
  iconWrapperClassName = "bg-primary/10",
}: StatsCardProps) {
  const trendIcons = {
    up: <TrendingUp className="h-4 w-4" />,
    down: <TrendingDown className="h-4 w-4" />,
    neutral: <Minus className="h-4 w-4" />,
  }

  const trendColors = {
    up: "text-success bg-success/10",
    down: "text-danger bg-danger/10",
    neutral: "text-muted-foreground bg-muted",
  }

  const interactive = Boolean(href || onClick)

  const containerClassName = `
    block bg-white rounded-lg shadow-sm p-6 border border-gray-100
    transition-all duration-200
    ${interactive ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""}
  `

  const content = (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="font-heading text-3xl font-bold text-foreground mb-2">{value}</p>

        <div className="flex items-center gap-2">
          {trend && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                trendColors[trend.direction]
              }`}
            >
              {trendIcons[trend.direction]}
              {trend.value && <span>{trend.value}</span>}
            </div>
          )}
          {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
        </div>
      </div>

      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${iconWrapperClassName}`}>
        {icon}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className={containerClassName}>
        {content}
      </Link>
    )
  }

  return (
    <div onClick={onClick} className={containerClassName}>
      {content}
    </div>
  )
}
