'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Shield, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function SecureTradeInfo() {
  return (
    <div className="space-y-3">
      {/* Güvenli Alışveriş Kartı */}
      <Card className="glass-effect border-green-500/20 bg-green-500/5">
        <CardContent className="pt-5 px-5 pb-5">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="h-7 w-7 text-green-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-2">Güvenli Alışveriş</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Alışveriş süreci sona erene kadar ücretiniz güvende. Alışveriş sonrası süreçte iade, teknik destek gibi konulardan ürünün satıcısı sorumludur.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yardım Kartı */}
      <Card className="glass-effect border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-5 px-5 pb-5">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                <HelpCircle className="h-7 w-7 text-blue-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-2">Yardıma mı ihtiyacınız var?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                Buraya tıklayarak yardım merkezi sayfamıza ulaşabilirsiniz. Üyelerimiz tarafından sıkça sorulan sorular yardım merkezinde listelenmektedir.
              </p>
              <Link href="/support" className="text-sm text-primary hover:underline font-medium">
                Yardım Merkezi →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

