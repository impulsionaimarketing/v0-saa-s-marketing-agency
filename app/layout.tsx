import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/contexts/auth-context'
import { ServiceWorkerRegistration } from '@/components/pwa/service-worker-registration'
import { InstallButton } from '@/components/pwa/install-button'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Dashboard Impulsionaí Marketing',
  description: 'Plataforma de gestão interna para agências de marketing digital',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Impulsionaí',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: '#1a1a1f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.jpg" />
      </head>
      <body className={`font-sans antialiased`}>
        <ServiceWorkerRegistration />
        <AuthProvider>
          {children}
        </AuthProvider>
        <InstallButton />
        <Analytics />
      </body>
    </html>
  )
}
