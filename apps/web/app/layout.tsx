import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SiteHeader } from './components/SiteHeader'

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-main',
  display:  'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  variable: '--font-display',
  weight:   ['300', '400', '500', '600', '700', '800'],
  display:  'swap',
})

const jetbrains = JetBrains_Mono({
  subsets:  ['latin'],
  variable: '--font-mono',
  weight:   ['400', '500', '700'],
  display:  'swap',
})

// ─── SEO ──────────────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.stockpro.com.br'
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://stockpro.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(WEB_URL),

  title: {
    default:  'StockPro — Gestão de Estoque em Tempo Real para PMEs',
    template: '%s | StockPro',
  },
  description:
    'Controle seu estoque em tempo real. Cadastre produtos, dê baixas em segundos e monitore tudo no dashboard ao vivo. Para pequenas e médias empresas brasileiras.',

  keywords: [
    'gestão de estoque',
    'controle de estoque',
    'sistema de estoque',
    'estoque em tempo real',
    'ERP pequenas empresas',
    'controle de produtos',
    'movimentação de estoque',
    'fluxo de caixa',
  ],

  authors:  [{ name: 'StockPro', url: WEB_URL }],
  creator:  'StockPro',
  publisher:'StockPro',

  robots: {
    index:     true,
    follow:    true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },

  openGraph: {
    type:        'website',
    locale:      'pt_BR',
    url:         WEB_URL,
    siteName:    'StockPro',
    title:       'StockPro — Gestão de Estoque em Tempo Real para PMEs',
    description: 'Controle seu estoque em tempo real. Dashboard ao vivo, baixa em 2 cliques, alertas automáticos. Comece grátis hoje.',
    images: [
      {
        url:    '/og-image.png',
        width:  1200,
        height: 630,
        alt:    'StockPro — Dashboard de Estoque',
      },
    ],
  },

  twitter: {
    card:        'summary_large_image',
    title:       'StockPro — Gestão de Estoque em Tempo Real',
    description: 'Controle de estoque para empresas que não improvisam. Dashboard ao vivo, multi-usuário, fluxo de caixa integrado.',
    images:      ['/og-image.png'],
    creator:     '@stockpro',
  },

  alternates: {
    canonical: WEB_URL,
    languages: { 'pt-BR': WEB_URL },
  },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#0F172A',
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <body>
        <SiteHeader appUrl={APP_URL} />
        {children}
      </body>
    </html>
  )
}
