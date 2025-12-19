'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function PayTRPaymentPage() {
  const searchParams = useSearchParams()
  const merchantOid = searchParams.get('merchantOid')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!merchantOid) {
      setError('Geçersiz ödeme talebi')
      setIsLoading(false)
      return
    }

    // Fetch payment data from deposit record and initiate PayTR payment
    const initPayment = async () => {
      try {
        // Get deposit info to find the amount
        const depositResponse = await fetch(`/api/deposits?merchantOid=${merchantOid}`)
        if (!depositResponse.ok) {
          throw new Error('Deposit bulunamadı')
        }

        const depositData = await depositResponse.json()
        if (!depositData || depositData.status !== 'PENDING') {
          throw new Error('Geçersiz deposit durumu')
        }

        // Initialize PayTR payment with the deposit amount
        const response = await fetch('/api/paytr/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            netCreditAmount: depositData.netCreditAmount,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Ödeme başlatılamadı')
        }

        const data = await response.json()
        
        if (!data.success || !data.merchantOid || !data.hash) {
          throw new Error('Geçersiz PayTR yanıtı')
        }

        // Call server-side proxy to get PayTR token (avoids CORS issues)
        const tokenResponse = await fetch('/api/paytr/get-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantOid: data.merchantOid }),
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json()
          throw new Error(errorData.error || 'PayTR token alınamadı')
        }

        const tokenData = await tokenResponse.json()
        
        if (!tokenData.success || !tokenData.iframeUrl) {
          throw new Error('PayTR iframe URL alınamadı')
        }

        // Redirect to PayTR iframe - user will see PayTR payment screen
        window.location.href = tokenData.iframeUrl
      } catch (err: any) {
        console.error('PayTR init error:', err)
        setError(err.message || 'Ödeme başlatılamadı')
        setIsLoading(false)
      }
    }

    initPayment()
  }, [merchantOid])

  if (error) {
    return (
      <div className="container py-10 px-4 max-w-2xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <a href="/wallet/deposit" className="text-primary hover:underline">
              Geri Dön
            </a>
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
          <p className="text-muted-foreground">PayTR ödeme sayfasına yönlendiriliyorsunuz...</p>
        </CardContent>
      </Card>
    </div>
  )
}
