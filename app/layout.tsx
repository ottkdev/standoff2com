import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Standoff 2 Topluluk | Forum, Blog, Alım-Satım',
  description: 'Standoff 2 oyuncuları için modern topluluk platformu. Forum, blog, haberler, alım-satım ve daha fazlası.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className="dark overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

