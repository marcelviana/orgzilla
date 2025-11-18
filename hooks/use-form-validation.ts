/**
 * Hook customizado para validação de formulários
 */

import { useState } from 'react'
import { AppError } from '@/lib/errors/error-handler'

interface FieldError {
  [key: string]: string | null
}

export function useFormValidation() {
  const [errors, setErrorsState] = useState<FieldError>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Define erro para um campo específico
   */
  const setFieldError = (field: string, message: string | null) => {
    setErrorsState(prev => ({
      ...prev,
      [field]: message,
    }))
  }

  /**
   * Limpa erro de um campo
   */
  const clearFieldError = (field: string) => {
    setErrorsState(prev => ({
      ...prev,
      [field]: null,
    }))
  }

  /**
   * Limpa todos os erros
   */
  const clearErrors = () => {
    setErrorsState({})
  }

  /**
   * Define múltiplos erros de uma vez
   */
  const setErrors = (errorList: AppError[]) => {
    const fieldErrors: FieldError = {}
    errorList.forEach(error => {
      if (error.field) {
        fieldErrors[error.field] = error.message
      }
    })
    setErrorsState(fieldErrors)
  }

  /**
   * Verifica se um campo tem erro
   */
  const hasError = (field: string): boolean => {
    return !!errors[field]
  }

  /**
   * Retorna mensagem de erro de um campo
   */
  const getError = (field: string): string | null => {
    return errors[field] || null
  }

  /**
   * Verifica se há algum erro
   */
  const hasAnyError = (): boolean => {
    return Object.values(errors).some(error => error !== null)
  }

  return {
    errors,
    isSubmitting,
    setIsSubmitting,
    setFieldError,
    clearFieldError,
    clearErrors,
    setErrors,
    hasError,
    getError,
    hasAnyError,
  }
}
