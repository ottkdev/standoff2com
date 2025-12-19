'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Banknote } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function WithdrawPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [wallet, setWallet] = useState<{ balanceAvailable: number } | null>(null)
  const [amount, setAmount] = useState('')
  const [iban, setIban] = useState('')
  const [accountName, setAccountName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)

  useEffect(() => {
    fetchWallet()
  }, [])

  const fetchWallet = async () => {
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        setWallet(data)
      }
    } catch (error) {
      console.error('Wallet fetch error:', error)
    } finally {
      setIsLoadingWallet(false)
    }
  }

  const validateIBAN = (iban: string): boolean => {
    // Basic IBAN validation (TR format: TR + 2 check digits + 4 bank code + 16 account number)
    const cleaned = iban.replace(/\s/g, '').toUpperCase()
    if (!cleaned.startsWith('TR')) return false
    if (cleaned.length !== 26) return false
    return /^TR\d{24}$/.test(cleaned)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const amountKurus = parseFloat(amount) * 100
      const minAmount = 5000 // 50 TL in kuruş

      if (!amount || amountKurus < minAmount) {
        toast({
          title: 'Hata',
          description: 'Minimum çekim tutarı 50 TL\'dir',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      if (!wallet || wallet.balanceAvailable < amountKurus) {
        toast({
          title: 'Hata',
          description: 'Yetersiz bakiye',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      if (!validateIBAN(iban)) {
        toast({
          title: 'Hata',
          description: 'Geçersiz IBAN formatı',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      if (!accountName.trim()) {
        toast({
          title: 'Hata',
          description: 'Hesap sahibi adı gereklidir',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountKurus,
          iban: iban.replace(/\s/g, '').toUpperCase(),
          accountName: accountName.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Çekim talebi oluşturulamadı')
      }

      toast({
        title: 'Başarılı',
        description: 'Çekim talebiniz oluşturuldu. Onay bekleniyor.',
      })

      router.push('/wallet')
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  const formatAmount = (kurus: number) => {
    return (kurus / 100).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 max-w-2xl">
      <Link
        href="/wallet"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Cüzdana Dön
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Para Çek
          </CardTitle>
          <CardDescription>
            Bakiyenizi IBAN ile banka hesabınıza çekebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingWallet ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 mx-auto animate-spin" />
            </div>
          ) : (
            <>
              {wallet && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Kullanılabilir Bakiye:</span>
                    <span className="text-lg font-bold text-green-500">
                      {formatAmount(wallet.balanceAvailable)} ₺
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Çekilecek Tutar (TL)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="50"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100.00"
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: 50 TL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value.toUpperCase())}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    disabled={isLoading}
                    required
                    maxLength={34}
                  />
                  <p className="text-xs text-muted-foreground">
                    Türkiye IBAN formatı (TR ile başlamalı, 26 karakter)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">Hesap Sahibi Adı</Label>
                  <Input
                    id="accountName"
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Ad Soyad"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    <strong>Bilgi:</strong> Çekim talebiniz admin onayından sonra işleme alınacaktır.
                    İşlem süresi 1-3 iş günü sürebilir.
                  </p>
                </div>

                <Button type="submit" className="w-full min-h-[44px]" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Banknote className="mr-2 h-4 w-4" />
                      Çekim Talebi Oluştur
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

