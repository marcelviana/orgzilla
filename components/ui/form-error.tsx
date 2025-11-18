/**
 * Componente para mostrar erros de formulário inline
 * Usar apenas quando necessário - o padrão é usar apenas toast
 */

interface FormErrorProps {
  error?: string | null
  className?: string
}

export function FormError({ error, className = '' }: FormErrorProps) {
  if (!error) return null

  return (
    <p className={`text-sm text-error mt-1 animate-in fade-in slide-in-from-top-1 duration-200 ${className}`}>
      {error}
    </p>
  )
}
