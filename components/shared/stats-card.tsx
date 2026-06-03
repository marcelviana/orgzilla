"use client"

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * StatsCard - Display metrics/stats consistently
 * 
 * @example
 * <StatsCard
 *   title="Total de Pessoas"
 *   value={127}
 *   icon={<Users className="text-primary" />}
 *   trend={{ value: "+5", direction: "up" }}
 *   subtext="este mês"
 *   onClick={() => navigate('/pessoas')}
 * />
 */

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: string; direction: "up" | "down" | "neutral" }
  subtext?: string
  onClick?: () => void
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  subtext,
  onClick,
}: StatsCardProps) {
  const trendIcons = {
    up: <TrendingUp className="h-4 w-4" />,
    down: <TrendingDown className="h-4 w-4" />,
    neutral: <Minus className="h-4 w-4" />,
  }

  const trendColors = {
    up: "text-green-600 bg-green-50",
    down: "text-red-600 bg-red-50",
    neutral: "text-gray-600 bg-gray-50",
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm p-6 border border-gray-100
        transition-all duration-200
        ${onClick ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>

          <div className="flex items-center gap-2">
            {trend && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  trendColors[trend.direction]
                }`}
              >
                {trendIcons[trend.direction]}
                <span>{trend.value}</span>
              </div>
            )}
            {subtext && <span className="text-xs text-gray-500">{subtext}</span>}
          </div>
        </div>

        <div className="h-12 w-12 rounded-full bg-[#FF7A00]/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  )
}
