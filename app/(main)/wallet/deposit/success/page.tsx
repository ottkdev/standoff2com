'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

export default function DepositSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const merchantOid = searchParams.get('merchantOid')
  const [countdown, setCountdown] = useState(5)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verify payment status from deposit record
    const verifyPayment = async () => {
      if (!merchantOid) {
        setError('Geçersiz ödeme talebi')
        setIsVerifying(false)
        setIsValid(false)
        return
      }

      try {
        // Poll deposit status until it's confirmed or failed
        const checkStatus = async (): Promise<boolean> => {
          const response = await fetch(`/api/deposits?merchantOid=${merchantOid}`)
          if (!response.ok) {
            throw new Error('Deposit bulunamadı')
          }

          const deposit = await response.json()
          
          if (deposit.status === 'SUCCESS') {
            return true
          } else if (deposit.status === 'FAILED') {
            return false
          } else {
            // Still pending, wait and retry
            return new Promise((resolve) => {
              setTimeout(async () => {
                const result = await checkStatus()
                resolve(result)
              }, 2000) // Check every 2 seconds
            })
          }
        }

        // Wait up to 30 seconds for callback to process
        const maxWait = 30000
        const startTime = Date.now()
        
        const verify = async () => {
          while (Date.now() - startTime < maxWait) {
            const result = await checkStatus()
            if (result !== null) {
              setIsValid(result)
              setIsVerifying(false)
              return
            }
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }
          
          // Timeout - check one more time
          const finalCheck = await fetch(`/api/deposits?merchantOid=${merchantOid}`)
          if (finalCheck.ok) {
            const deposit = await finalCheck.json()
            setIsValid(deposit.status === 'SUCCESS')
          } else {
            setIsValid(false)
            setError('Ödeme durumu doğrulanamadı')
          }
          setIsVerifying(false)
        }

        verify()
      } catch (err: any) {
        console.error('Payment verification error:', err)
        setError(err.message || 'Ödeme doğrulanamadı')
        setIsVerifying(false)
        setIsValid(false)
      }
    }

    verifyPayment()
  }, [merchantOid])

  useEffect(() => {
    if (!isVerifying && isValid) {
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
    }
  }, [isVerifying, isValid, router])

  if (isVerifying) {
    return (
      <div className="container py-10 px-4 max-w-2xl">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Ödeme durumu kontrol ediliyor...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValid || error) {
    return (
      <div className="container py-10 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Ödeme Doğrulanamadı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || 'Ödeme işlemi henüz tamamlanmamış veya başarısız olmuş olabilir. Lütfen cüzdanınızı kontrol edin.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/wallet" className="flex-1">
                <Button className="w-full min-h-[44px]">Cüzdana Git</Button>
              </Link>
              <Link href="/wallet/deposit" className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full min-h-[44px]">Tekrar Dene</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            Para yükleme işleminiz başarıyla tamamlandı. Bakiyeniz güncellendi.
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

