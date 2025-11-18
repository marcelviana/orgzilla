/**
 * Sistema centralizado de tratamento de erros do Orgzilla
 */

export type ErrorType =
  | 'auth'           // Erros de autenticação
  | 'validation'     // Erros de validação de formulário
  | 'permission'     // Erros de permissão
  | 'not_found'      // Recurso não encontrado
  | 'database'       // Erros do Supabase/banco
  | 'network'        // Erros de rede
  | 'unknown'        // Erros desconhecidos

export interface AppError {
  type: ErrorType
  message: string
  originalError?: any
  field?: string  // Para erros de validação específicos de campo
}

// Mapeamento de erros do Supabase Auth
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
  'User not found': 'Usuário não encontrado',
  'Invalid email': 'Email inválido',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
  'User already registered': 'Este email já está cadastrado',
  'Signup not allowed for this instance': 'Cadastro desabilitado. Entre em contato com o administrador.',
}

// Mapeamento de erros do Supabase Database
const DATABASE_ERROR_MESSAGES: Record<string, string> = {
  'duplicate key value violates unique constraint': 'Este registro já existe no sistema',
  'foreign key violation': 'Não é possível excluir. Este registro está sendo usado.',
  'null value in column': 'Preencha todos os campos obrigatórios',
  'invalid input syntax': 'Dados inválidos. Verifique os campos.',
}

// Mensagens amigáveis por tipo de erro
const ERROR_TYPE_MESSAGES: Record<ErrorType, string> = {
  auth: 'Ops! Orgzilla tropeçou na autenticação. Tente novamente.',
  validation: 'Ops! Alguns campos precisam de atenção.',
  permission: 'Ops! Você não tem permissão para fazer isso.',
  not_found: 'Ops! Orgzilla não encontrou o que você procura.',
  database: 'Ops! Orgzilla tropeçou ao salvar os dados. Tente novamente.',
  network: 'Ops! Orgzilla perdeu a conexão. Verifique sua internet.',
  unknown: 'Ops! Algo inesperado aconteceu. Tente novamente.',
}

/**
 * Processa um erro e retorna uma mensagem amigável
 */
export function handleError(error: any, type: ErrorType = 'unknown'): AppError {
  console.error(`[${type.toUpperCase()}]`, error)

  // Se já é um AppError, retornar
  if (error?.type && error?.message) {
    return error as AppError
  }

  let message = ERROR_TYPE_MESSAGES[type]

  // Processar erros do Supabase Auth
  if (type === 'auth' && error?.message) {
    for (const [key, value] of Object.entries(AUTH_ERROR_MESSAGES)) {
      if (error.message.includes(key)) {
        message = value
        break
      }
    }
  }

  // Processar erros do Supabase Database
  if (type === 'database' && error?.message) {
    const dbError = Object.keys(DATABASE_ERROR_MESSAGES).find(key =>
      error.message.toLowerCase().includes(key.toLowerCase())
    )
    if (dbError) {
      message = DATABASE_ERROR_MESSAGES[dbError]
    }
  }

  // Processar erros de rede
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    message = ERROR_TYPE_MESSAGES.network
  }

  return {
    type,
    message,
    originalError: error,
  }
}

/**
 * Valida email
 */
export function validateEmail(email: string): AppError | null {
  if (!email) {
    return {
      type: 'validation',
      message: 'Email é obrigatório',
      field: 'email',
    }
  }

  if (!email.includes('@') || !email.includes('.')) {
    return {
      type: 'validation',
      message: 'Digite um email válido',
      field: 'email',
    }
  }

  return null
}

/**
 * Valida senha
 */
export function validatePassword(password: string, minLength: number = 6): AppError | null {
  if (!password) {
    return {
      type: 'validation',
      message: 'Senha é obrigatória',
      field: 'password',
    }
  }

  if (password.length < minLength) {
    return {
      type: 'validation',
      message: `A senha deve ter pelo menos ${minLength} caracteres`,
      field: 'password',
    }
  }

  return null
}

/**
 * Valida campo obrigatório
 */
export function validateRequired(value: any, fieldName: string): AppError | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      type: 'validation',
      message: `${fieldName} é obrigatório`,
      field: fieldName.toLowerCase(),
    }
  }

  return null
}
