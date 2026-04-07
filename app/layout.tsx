import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SentryUserContext } from '@/components/SentryUserContext'
import { getUser } from '@/lib/auth'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-main',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StockPro - Gestão de Estoque Inteligente para Empresas B2B',
  description: 'Controle de entradas, saídas, alertas e previsão de estoque em tempo real. Para empresas que não improvisam.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getUser().catch(() => null)

  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable}`}>
        {/* Sets Sentry.setUser on the client after hydration */}
        {user && (
          <SentryUserContext userId={user.id} userEmail={user.email ?? undefined} />
        )}
        {children}
      </body>
    </html>
  )
}
