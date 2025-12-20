import React from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/toaster'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
      {/* App Shell - Stable Header */}
      <Header />
      {/* Main Content - Suspense boundaries will show loading.tsx */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden min-w-0">{children}</main>
      {/* App Shell - Stable Footer */}
      <Footer />
      <Toaster />
      <PWAInstallPrompt />
    </div>
  )
}

