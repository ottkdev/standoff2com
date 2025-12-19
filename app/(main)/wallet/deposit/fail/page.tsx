'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export default function DepositFailPage() {
  return (
    <div className="container py-10 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Ödeme Başarısız
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi kullanın.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/wallet/deposit" className="flex-1">
              <Button className="w-full min-h-[44px]">Tekrar Dene</Button>
            </Link>
            <Link href="/wallet" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full min-h-[44px]">Cüzdana Dön</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

