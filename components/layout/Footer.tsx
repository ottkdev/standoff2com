'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function Footer() {
  // Use static year to prevent hydration mismatch
  // The year won't change during a session, so this is safe
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container py-8 md:py-10 px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Standoff 2 Topluluk</h3>
            <p className="text-sm text-muted-foreground">
              Standoff 2 oyuncuları için topluluk platformu
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Hızlı Linkler</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/forum" className="text-muted-foreground hover:text-foreground">
                  Forum
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-muted-foreground hover:text-foreground">
                  Alım/Satım
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Hesap</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground">
                  Giriş Yap
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground hover:text-foreground">
                  Kayıt Ol
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Yasal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Kullanım Şartları
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Gizlilik Politikası
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 border-t pt-6 sm:pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {year} Standoff 2 Topluluk. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  )
}
