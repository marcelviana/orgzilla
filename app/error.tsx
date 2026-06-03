'use client'

import { ErrorPage } from '@/components/shared/error-page'
import { RefreshCw, Home, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    console.error(error)
  }, [error])

  const errorRef = `ERR-500-${error.digest ?? 'unknown'}`

  const handleCopyError = () => {
    void navigator.clipboard.writeText(errorRef)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const additionalInfo = (
    <div className="space-y-4">
      {/* Error Reference */}
      <Card className="p-4 bg-gray-100 border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs text-gray-500 mb-1">Referência do erro:</p>
            <code className="text-sm font-mono text-gray-700">{errorRef}</code>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyError}
            className="ml-2"
          >
            <Copy className="h-4 w-4 mr-1" />
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>
      </Card>

      {/* Support Prompt */}
      <p className="text-sm text-gray-600">
        Problema persistindo?{' '}
        <a
          href="mailto:suporte@orgzilla.com"
          className="text-[#FF7A00] hover:underline font-medium"
        >
          Abrir chamado de suporte
        </a>
      </p>
    </div>
  )

  return (
    <ErrorPage
      code={500}
      title="Algo deu errado"
      description="Nossos servidores estão com dificuldades no momento. Já estamos trabalhando para resolver. Por favor, tente novamente em alguns instantes."
      illustration="/worried-orange-dinosaur-surrounded-by-error-symbol.jpg"
      primaryAction={{
        label: 'Tentar Novamente',
        icon: <RefreshCw className="h-5 w-5 mr-2" />,
        onClick: reset,
      }}
      secondaryAction={{
        label: 'Voltar ao Dashboard',
        icon: <Home className="h-5 w-5 mr-2" />,
        onClick: () => router.push('/'),
      }}
      additionalInfo={additionalInfo}
    />
  )
}
