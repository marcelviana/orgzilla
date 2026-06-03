'use client'

import { ErrorPage } from '@/components/shared/error-page'
import { Home, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <ErrorPage
      code={404}
      title="Página não encontrada"
      description="A página que você está procurando não existe ou foi movida. Que tal voltar para o início?"
      illustration="/friendly-orange-dinosaur-with-magnifying-glass-loo.jpg"
      primaryAction={{
        label: 'Voltar ao Dashboard',
        icon: <Home className="h-5 w-5 mr-2" />,
        onClick: () => router.push('/'),
      }}
      secondaryAction={{
        label: 'Ver Todas as Pessoas',
        icon: <Users className="h-5 w-5 mr-2" />,
        onClick: () => router.push('/pessoas'),
      }}
      showQuickLinks
    />
  )
}
