'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { handleError, validateEmail, validatePassword } from '@/lib/errors/error-handler'
import { toast } from '@/lib/ui/toast-config'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false) // Para destacar campos quando houver erro de credenciais
  const [triangles] = useState<Array<{ left: number; top: number; width: number; height: number }>>(() =>
    Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: 20 + Math.random() * 40,
      height: 20 + Math.random() * 40,
    }))
  )

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        console.log('[Login] Usuário já autenticado, redirecionando...')
        router.push('/')
      }
    }

    void checkAuth()
  }, [supabase, router])

  // Verificar erro de OAuth na URL
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'oauth_failed') {
      toast.error('Erro ao fazer login com Google. Tente novamente.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpar erros anteriores
    setHasError(false)

    // Validações ANTES de enviar usando helpers
    const emailError = validateEmail(email)
    if (emailError) {
      toast.error(emailError)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    setIsLoading(true)

    try {
      console.log('[Login] Iniciando autenticação...')

      // Verificar se Supabase está configurado
      // Support both publishable key (new, recommended) and anon key (legacy)
      const hasApiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasApiKey) {
        toast.error('⚠️ Supabase não configurado. Confira as variáveis de ambiente no .env.local (instruções no README).')
        console.error('[Login] Variáveis de ambiente do Supabase não configuradas!')
        setIsLoading(false)
        return
      }

      // Autenticação com Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Usar handleError para processar e traduzir erro
        const appError = handleError(error, 'auth')

        // Destacar campos visualmente
        setHasError(true)

        // Mostrar toast com mensagem traduzida
        toast.error(appError)

        setIsLoading(false)
        return
      }

      // Login bem-sucedido
      console.log('[Login] Login bem-sucedido!')
      toast.successDino('Login realizado com sucesso!')

      // Redirecionar para dashboard
      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      console.error('[Login] Erro não tratado:', error)
      const appError = handleError(error, 'unknown')
      toast.error(appError)
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error('Erro ao conectar com Google')
        setIsLoading(false)
        return
      }

      // O redirect acontecerá automaticamente
    } catch (error: unknown) {
      console.error('[GoogleLogin] Erro:', error)
      toast.error('Ops! Orgzilla tropeçou. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT SIDE - Brand Section */}
      <div className="h-48 md:h-screen md:w-[40%] bg-gradient-to-b from-secondary to-[#0F1419] flex items-center justify-center relative overflow-hidden">
        {/* Decorative triangles pattern */}
        <div className="absolute inset-0 opacity-10">
          {triangles.map((triangle, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${triangle.left}%`,
                top: `${triangle.top}%`,
                width: `${triangle.width}px`,
                height: `${triangle.height}px`,
              }}
            >
              <svg viewBox="0 0 100 100" className="text-accent">
                <polygon points="50,10 90,90 10,90" fill="currentColor" />
              </svg>
            </div>
          ))}
        </div>

        {/* Centered content */}
        <div className="relative z-10 text-center px-6">
          <Image
            src="/images/logo-fundo-escuro.png"
            alt="Orgzilla Logo"
            width={220}
            height={100}
            className="mx-auto"
            priority
          />
          <p className="text-xl text-accent mt-6 font-medium">
            Domando o caos organizacional
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Form Section */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-[420px] p-12 shadow-xl border-0">
          {/* Small logo at top */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/logo-fundo-claro.png"
              alt="Orgzilla"
              width={100}
              height={45}
            />
          </div>

          {/* Title & Subtitle */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-secondary mb-2">
              Bem-vindo de volta!
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre para gerenciar sua equipe
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-6">
            {/* Email Field */}
            <div className="relative">
              <Label htmlFor="email" className="text-sm font-medium text-secondary mb-2 block">
                Email
              </Label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${hasError ? 'text-error' : 'text-muted-foreground'}`} />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setHasError(false)
                  }}
                  className={`pl-10 h-12 transition-colors ${hasError ? 'border-error focus-visible:ring-error' : ''}`}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <Label htmlFor="password" className="text-sm font-medium text-secondary mb-2 block">
                Senha
              </Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${hasError ? 'text-error' : 'text-muted-foreground'}`} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setHasError(false)
                  }}
                  className={`pl-10 pr-10 h-12 transition-colors ${hasError ? 'border-error focus-visible:ring-error' : ''}`}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal text-secondary cursor-pointer"
                >
                  Lembrar de mim
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-accent hover:text-accent-hover transition-colors font-medium"
                onClick={() => toast.info('🦖 Demo mode - Password recovery coming soon!')}
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-all hover:scale-[1.02] hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-white hover:bg-surface border-muted text-secondary font-medium rounded-lg transition-colors"
              onClick={() => { void handleGoogleLogin() }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent hydration mismatches from browser extensions
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
