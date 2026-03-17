import type { Metadata } from 'next'
import { Syne, Figtree, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '800'],
  display: 'swap',
})

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StockPro - Gestão de Estoque Inteligente para Empresas B2B',
  description: 'Controle de entradas, saídas, alertas e previsão de estoque em tempo real. Para empresas que não improvisam.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body className={`${syne.variable} ${figtree.variable} ${jetbrains.variable}`}>
        {children}
      </body>
    </html>
  )
}
