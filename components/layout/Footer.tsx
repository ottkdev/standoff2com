'use client'

import Link from 'next/link'
import { Mail, MapPin, Building2, Shield, FileText, Scale, HelpCircle } from 'lucide-react'
import { Instagram, Twitter, Youtube, MessageCircle } from 'lucide-react'

// Payment method logos as simple SVG components
const PaymentLogos = () => {
  const payments = [
    { name: 'Visa', color: '#1A1F71' },
    { name: 'Mastercard', color: '#EB001B' },
    { name: 'Troy', color: '#00A859' },
    { name: 'PayTR', color: '#FF6B35' },
    { name: 'Papara', color: '#7C3AED' },
    { name: 'PayPal', color: '#003087' },
  ]

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide max-w-full">
      {payments.map((payment) => (
        <div
          key={payment.name}
          className="flex items-center justify-center h-7 sm:h-8 px-2.5 sm:px-3 rounded border border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 hover:shadow-sm transition-all group flex-shrink-0"
          title={payment.name}
        >
          <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground/80 group-hover:text-foreground transition-colors whitespace-nowrap">
            {payment.name}
          </span>
        </div>
      ))}
    </div>
  )
}

export function Footer() {
  const year = new Date().getFullYear()
  const startYear = 2020

  return (
    <footer className="border-t border-border/70 bg-background/95 backdrop-blur-sm mt-auto w-full max-w-full overflow-x-hidden">
      {/* Payment Methods Section */}
      <div className="border-b border-border/50 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium whitespace-nowrap">
                Güvenli Ödeme
              </span>
            </div>
            <PaymentLogos />
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-6 sm:py-8 md:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Platform Info */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <h3 className="text-sm sm:text-base font-semibold break-words">Standoff 2 Topluluk</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
              Standoff 2 oyuncuları için güvenli topluluk platformu. Forum, blog, marketplace ve daha fazlası.
            </p>
            <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                <span className="break-words">
                  İstanbul, Türkiye
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <a
                  href="mailto:destek@standoff2.com"
                  className="hover:text-primary transition-colors break-all"
                >
                  destek@standoff2.com
                </a>
              </div>
            </div>
            {/* Social Media */}
            <div className="flex items-center gap-2 sm:gap-3 pt-2">
              <a
                href="https://discord.gg/standoff2"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted hover:bg-primary/10 border border-border hover:border-primary/50 flex items-center justify-center transition-all group"
                aria-label="Discord"
              >
                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="https://instagram.com/standoff2"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted hover:bg-primary/10 border border-border hover:border-primary/50 flex items-center justify-center transition-all group"
                aria-label="Instagram"
              >
                <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="https://twitter.com/standoff2"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted hover:bg-primary/10 border border-border hover:border-primary/50 flex items-center justify-center transition-all group"
                aria-label="Twitter"
              >
                <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
              <a
                href="https://youtube.com/@standoff2"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted hover:bg-primary/10 border border-border hover:border-primary/50 flex items-center justify-center transition-all group"
                aria-label="YouTube"
              >
                <Youtube className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Legal Information */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <h4 className="text-xs sm:text-sm font-semibold break-words">Yasal Bilgilendirme</h4>
            </div>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/kvkk"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link
                  href="/mesafeli-satis"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  Kullanım Şartları
                </Link>
              </li>
              <li>
                <Link
                  href="/cerez-politikasi"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  Çerez Politikası
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <h4 className="text-xs sm:text-sm font-semibold break-words">Hukuki & Destek</h4>
            </div>
            <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1 break-words">Hukuki Temsilci</p>
                <p className="leading-relaxed break-words">
                  [Hukuk Bürosu Adı]
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1 break-words">İletişim</p>
                <a
                  href="mailto:hukuk@standoff2.com"
                  className="hover:text-primary transition-colors break-all inline-block"
                >
                  hukuk@standoff2.com
                </a>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1 break-words">KEP Adresi</p>
                <p className="leading-relaxed break-all">
                  standoff2@hs01.kep.tr
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <h4 className="text-xs sm:text-sm font-semibold break-words">Hızlı Linkler</h4>
            </div>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/forum"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  Forum
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  Blog & Haberler
                </Link>
              </li>
              <li>
                <Link
                  href="/marketplace"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  href="/wiki"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  Wiki
                </Link>
              </li>
              <li>
                <Link
                  href="/iletisim"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  İletişim
                </Link>
              </li>
              <li>
                <Link
                  href="/sss"
                  className="text-muted-foreground hover:text-primary transition-colors break-words inline-block"
                >
                  Sık Sorulan Sorular
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-border/50 bg-muted/10">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left break-words">
              © {startYear}–{year} Standoff 2 Topluluk. Tüm Hakları Saklıdır.
            </p>
            <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Güvenli Platform</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span>SSL Şifreli</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
