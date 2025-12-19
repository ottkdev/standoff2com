'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function PayTRPaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const merchantOid = searchParams.get('merchantOid')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!merchantOid) {
      setError('Geçersiz ödeme talebi')
      setIsLoading(false)
      return
    }

    // Fetch payment data
    const initPayment = async () => {
      try {
        const response = await fetch('/api/paytr/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            netCreditAmount: 0, // Will be fetched from deposit
          }),
        })

        // For now, redirect to success page after a delay
        // In production, you'd embed PayTR iframe here
        setTimeout(() => {
          router.push('/wallet/deposit/success')
        }, 2000)
      } catch (err) {
        setError('Ödeme başlatılamadı')
        setIsLoading(false)
      }
    }

    initPayment()
  }, [merchantOid, router])

  if (error) {
    return (
      <div className="container py-10 px-4 max-w-2xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10 px-4 max-w-2xl">
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Ödeme sayfasına yönlendiriliyorsunuz...</p>
        </CardContent>
      </Card>
    </div>
  )
}

