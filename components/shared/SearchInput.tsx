"use client"

import { Search, X } from 'lucide-react'
import { Input } from "@/components/ui/input"

/**
 * SearchInput - Consistent search inputs
 * 
 * @example
 * <SearchInput
 *   placeholder="Buscar pessoas..."
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   onClear={() => setSearchTerm("")}
 * />
 */

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onClear?: () => void
}

export function SearchInput({
  placeholder = "Buscar...",
  value,
  onChange,
  onClear,
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
