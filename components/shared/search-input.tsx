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
  /** Disparado a cada tecla — usado p.ex. para Enter→aplicar busca server-side. */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  /** Classes aplicadas ao wrapper, para controlar largura por tela. */
  className?: string
}

export function SearchInput({
  placeholder = "Buscar...",
  value,
  onChange,
  onClear,
  onKeyDown,
  className,
}: SearchInputProps) {
  return (
    <div className={`relative${className ? ` ${className}` : ""}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="pl-10 pr-10"
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
