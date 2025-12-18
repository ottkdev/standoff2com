import React from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/toaster'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full overflow-x-hidden">{children}</main>
      <Footer />
      <Toaster />
    </div>
  )
}

