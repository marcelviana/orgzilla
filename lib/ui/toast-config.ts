/**
 * Configuração centralizada do Toast (Sonner)
 */

import { toast as sonnerToast, ExternalToast } from 'sonner'
import { AppError } from '@/lib/errors/error-handler'

// Estilos customizados seguindo marca Orgzilla
const toastStyles = {
  success: {
    style: {
      background: '#1A2734',
      color: '#fff',
      border: '2px solid #00C8FF',
    },
  },
  error: {
    style: {
      background: '#1A2734',
      color: '#fff',
      border: '2px solid #FF5A5F',
    },
  },
  info: {
    style: {
      background: '#1A2734',
      color: '#fff',
      border: '2px solid #00C8FF',
    },
  },
  warning: {
    style: {
      background: '#1A2734',
      color: '#fff',
      border: '2px solid #FF7A00',
    },
  },
}

export const toast = {
  success: (message: string, options?: ExternalToast) => {
    return sonnerToast.success(message, {
      ...toastStyles.success,
      ...options,
    })
  },

  error: (error: string | AppError, options?: ExternalToast) => {
    const message = typeof error === 'string' ? error : error.message
    return sonnerToast.error(message, {
      ...toastStyles.error,
      ...options,
    })
  },

  info: (message: string, options?: ExternalToast) => {
    return sonnerToast.info(message, {
      ...toastStyles.info,
      ...options,
    })
  },

  warning: (message: string, options?: ExternalToast) => {
    return sonnerToast.warning(message, {
      ...toastStyles.warning,
      ...options,
    })
  },

  // Toast especial de sucesso com dinossauro
  successDino: (message: string, options?: ExternalToast) => {
    return sonnerToast.success(`🦖 ${message}`, {
      ...toastStyles.success,
      ...options,
    })
  },
}
