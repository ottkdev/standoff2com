'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default function DepositSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/wallet')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="container py-10 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            Ödeme Başarılı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Para yükleme işleminiz başarıyla tamamlandı. Bakiyeniz güncelleniyor...
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/wallet" className="flex-1">
              <Button className="w-full min-h-[44px]">Cüzdana Git</Button>
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto min-h-[44px]"
              onClick={() => router.push('/wallet')}
            >
              {countdown > 0 ? `${countdown} saniye sonra yönlendirileceksiniz` : 'Yönlendiriliyor...'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

