'use client'

import { ErrorPage } from '@/components/shared/error-page'
import { Home, Mail, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'

export default function Unauthorized() {
  const router = useRouter()

  // Mock current user info
  const currentUser = {
    name: 'João Silva',
    role: 'Visualizador',
  }

  const additionalInfo = (
    <div className="space-y-4">
      {/* Permission Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200 text-left">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Por que estou vendo isso?
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Esta página requer permissões de administrador ou gestor</li>
              <li>• Seu perfil atual: {currentUser.role}</li>
              <li>
                • Entre em contato com:{' '}
                <a
                  href="mailto:admin@orgzilla.com"
                  className="text-primary hover:underline"
                >
                  admin@orgzilla.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Current User Info */}
      <Card className="p-3 bg-gray-50 border-gray-200">
        <div className="text-sm text-muted-foreground text-left">
          <p>
            <span className="font-medium">Logado como:</span> {currentUser.name}
          </p>
          <p>
            <span className="font-medium">Perfil:</span> {currentUser.role}
          </p>
        </div>
      </Card>
    </div>
  )

  return (
    <ErrorPage
      code={403}
      title="Você não tem permissão para acessar esta página"
      description="Esta área é restrita. Se você acredita que deveria ter acesso, entre em contato com um administrador."
      illustration="/orange-dinosaur-in-front-of-closed-door-with-lock-.jpg"
      primaryAction={{
        label: 'Voltar ao Dashboard',
        icon: <Home className="h-5 w-5 mr-2" />,
        onClick: () => router.push('/'),
      }}
      secondaryAction={{
        label: 'Solicitar acesso',
        icon: <Mail className="h-5 w-5 mr-2" />,
        onClick: () => {
          window.location.href = 'mailto:admin@orgzilla.com?subject=Solicitação de Acesso - Orgzilla'
        },
      }}
      additionalInfo={additionalInfo}
      supportEmail="admin@orgzilla.com"
    />
  )
}
