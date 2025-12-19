'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, CreditCard } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function DepositPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const netAmount = amount ? parseFloat(amount) * 100 : 0 // Convert to kuruş
  const feeAmount = Math.ceil(netAmount * 0.1) // 10% fee
  const grossAmount = netAmount + feeAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!amount || parseFloat(amount) < 10) {
        toast({
          title: 'Hata',
          description: 'Minimum yükleme tutarı 10 TL\'dir',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      if (parseFloat(amount) > 50000) {
        toast({
          title: 'Hata',
          description: 'Maksimum yükleme tutarı 50,000 TL\'dir',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/paytr/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          netCreditAmount: netAmount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Yükleme başlatılamadı')
      }

      const data = await response.json()

      // Redirect to PayTR iframe or form
      // For now, we'll show the iframe URL in a new window
      // In production, you'd embed this in an iframe
      window.location.href = `/wallet/deposit/pay?merchantOid=${data.merchantOid}`
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 max-w-2xl w-full overflow-x-hidden">
      <Link
        href="/wallet"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 sm:mb-6 text-sm sm:text-base"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="break-words">Cüzdana Dön</span>
      </Link>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl break-words">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span>Para Yükle</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm break-words">
            Cüzdanınıza para yüklemek için PayTR ile güvenli ödeme yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm sm:text-base">Yüklenecek Tutar (TL)</Label>
              <Input
                id="amount"
                type="number"
                min="10"
                max="50000"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground break-words">
                Minimum: 10 TL, Maksimum: 50,000 TL
              </p>
            </div>

            {amount && parseFloat(amount) >= 10 && (
              <div className="p-3 sm:p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-xs sm:text-sm gap-2">
                  <span className="text-muted-foreground break-words">Cüzdana Yüklenecek:</span>
                  <span className="font-semibold text-green-500 flex-shrink-0 break-words">
                    {netAmount > 0 ? (netAmount / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} ₺
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm gap-2">
                  <span className="text-muted-foreground break-words">İşlem Ücreti (%10):</span>
                  <span className="font-semibold text-orange-500 flex-shrink-0 break-words">
                    {feeAmount > 0 ? (feeAmount / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} ₺
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-bold pt-2 border-t gap-2">
                  <span className="break-words">Toplam Ödenecek:</span>
                  <span className="text-primary flex-shrink-0 break-words">
                    {grossAmount > 0 ? (grossAmount / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} ₺
                  </span>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading || !amount}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="break-words">İşleniyor...</span>
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span className="break-words">Ödemeye Geç</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

