'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function Footer() {
  // Use static year to prevent hydration mismatch
  // The year won't change during a session, so this is safe
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background mt-auto w-full overflow-x-hidden">
      <div className="container py-6 sm:py-8 md:py-10 px-4 md:px-6 w-full">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-lg font-semibold break-words">Standoff 2 Topluluk</h3>
            <p className="text-xs sm:text-sm text-muted-foreground break-words">
              Standoff 2 oyuncuları için topluluk platformu
            </p>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold break-words">Hızlı Linkler</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/forum" className="text-muted-foreground hover:text-foreground break-words">
                  Forum
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground break-words">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-muted-foreground hover:text-foreground break-words">
                  Alım/Satım
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold break-words">Hesap</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground break-words">
                  Giriş Yap
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground hover:text-foreground break-words">
                  Kayıt Ol
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold break-words">Yasal</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground break-words">
                  Kullanım Şartları
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground break-words">
                  Gizlilik Politikası
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-4 sm:mt-6 md:mt-8 border-t pt-4 sm:pt-6 md:pt-8 text-center text-xs sm:text-sm text-muted-foreground break-words">
          <p>&copy; {year} Standoff 2 Topluluk. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  )
}
