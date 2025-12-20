import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
// Import CSS at the top level - Next.js will handle preload optimization
import './globals.css'

// Optimize font loading - only load what's needed
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Better performance
  preload: true,
  // Prevent font preload warnings by ensuring it's used
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Standoff 2 Topluluk | Forum, Blog, Alım-Satım',
  description: 'Standoff 2 oyuncuları için modern topluluk platformu. Forum, blog, haberler, alım-satım ve daha fazlası.',
  icons: {
    icon: [
      { url: '/so2/Standoff_2_Logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/so2/Standoff_2_Logo.png', type: 'image/png' },
    ],
    shortcut: '/so2/Standoff_2_Logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className="dark overflow-x-hidden" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0, overflowX: 'hidden' }}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} overflow-x-hidden`} style={{ width: '100%', maxWidth: '100vw', margin: 0, padding: 0, overflowX: 'hidden' }}>
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                      .then((reg) => console.log('SW registered'))
                      .catch((err) => console.log('SW registration failed:', err));
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}

