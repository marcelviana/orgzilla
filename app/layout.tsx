import { Outfit, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  title: 'Orgzilla - Team management made roarsome',
  description: 'The friendly corporate kaiju that organizes everything. Smart team management with a playful dinosaur mascot theme.',
  keywords: ['team management', 'project management', 'organization', 'collaboration'],
  authors: [{ name: 'Orgzilla Team' }],
  themeColor: '#FF7A00',
    generator: 'v0.app'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF7A00',
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
