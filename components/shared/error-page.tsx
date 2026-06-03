'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

interface ErrorPageProps {
  code: number
  title: string
  description: string
  illustration: string
  primaryAction: { label: string; icon?: React.ReactNode; onClick: () => void }
  secondaryAction?: { label: string; icon?: React.ReactNode; onClick: () => void }
  additionalInfo?: React.ReactNode
  supportEmail?: string
  showQuickLinks?: boolean
}

export function ErrorPage({
  code,
  title,
  description,
  illustration,
  primaryAction,
  secondaryAction,
  additionalInfo,
  supportEmail = 'suporte@orgzilla.com',
  showQuickLinks = false,
}: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-[600px] w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/images/logo-fundo-claro.png"
              alt="Orgzilla"
              width={80}
              height={80}
              className="mx-auto"
            />
          </Link>
        </div>

        {/* Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]">
            <Image
              src={illustration || "/placeholder.svg"}
              alt={`Error ${code}`}
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Error Code */}
        <div
          className={`text-8xl sm:text-9xl font-bold mb-6 ${
            code === 500 ? 'text-danger' : 'text-foreground'
          }`}
        >
          {code}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          {title}
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          {description}
        </p>

        {/* Additional Info */}
        {additionalInfo && <div className="mb-8">{additionalInfo}</div>}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            size="lg"
            className="bg-primary-strong hover:bg-primary-strong/90 text-white"
            onClick={primaryAction.onClick}
          >
            {primaryAction.icon}
            {primaryAction.label}
          </Button>

          {secondaryAction && (
            <Button
              size="lg"
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
        </div>

        {/* Quick Links */}
        {showQuickLinks && (
          <Card className="p-4 mb-6 bg-white/50 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground mb-3 font-medium">
              Páginas mais acessadas:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                href="/pessoas"
                className="text-sm text-primary hover:underline"
              >
                Ver Pessoas
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/times"
                className="text-sm text-primary hover:underline"
              >
                Ver Times
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/projetos"
                className="text-sm text-primary hover:underline"
              >
                Ver Projetos
              </Link>
            </div>
          </Card>
        )}

        {/* Support */}
        <p className="text-sm text-muted-foreground">
          Precisa de ajuda?{' '}
          <a
            href={`mailto:${supportEmail}`}
            className="text-primary hover:underline"
          >
            Contate o suporte
          </a>
        </p>
      </div>
    </div>
  )
}
