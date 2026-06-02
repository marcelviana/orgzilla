"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * FilterPanel - Consistent filter UI
 * 
 * @example
 * <FilterPanel
 *   filters={[
 *     { id: "time", label: "Time", type: "select", options: teams },
 *     { id: "nivel", label: "Nível", type: "select", options: levels }
 *   ]}
 *   values={filterValues}
 *   onChange={setFilterValues}
 *   onClear={clearFilters}
 * />
 */

interface FilterConfig {
  id: string
  label: string
  type: "select" | "multiselect" | "date" | "range"
  options?: Array<{ label: string; value: string }>
  placeholder?: string
}

interface FilterPanelProps {
  filters: FilterConfig[]
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  onClear: () => void
  onApply?: () => void
}

export function FilterPanel({
  filters,
  values,
  onChange,
  onClear,
  onApply,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const activeFiltersCount = Object.values(values).filter(Boolean).length

  const handleFilterChange = (id: string, value: unknown) => {
    onChange({ ...values, [id]: value })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-[#FF7A00] text-white text-xs rounded-full font-medium">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <Label htmlFor={filter.id} className="text-sm font-medium">
                  {filter.label}
                </Label>
                {filter.type === "select" && (
                  <Select
                    value={(values[filter.id] as string) || ""}
                    onValueChange={(value) => handleFilterChange(filter.id, value)}
                  >
                    <SelectTrigger id={filter.id}>
                      <SelectValue placeholder={filter.placeholder || "Selecione..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={onClear}
              disabled={activeFiltersCount === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            {onApply && (
              <Button
                onClick={onApply}
                className="bg-[#FF7A00] hover:bg-[#FF7A00]/90"
              >
                Aplicar {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
