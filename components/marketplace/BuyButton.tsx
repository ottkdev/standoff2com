'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ShoppingCart, Loader2, Wallet } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface BuyButtonProps {
  listingId: string
  price: number
  className?: string
}

export function BuyButton({ listingId, price, className }: BuyButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleBuy = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.error || 'Satın alma işlemi başarısız'
        
        // Check if it's an insufficient balance error
        if (errorMessage.includes('Yetersiz bakiye') || errorMessage.includes('yetersiz')) {
          setIsOpen(false) // Close dialog
          throw new Error(errorMessage)
        }
        
        throw new Error(errorMessage)
      }

      const order = await response.json()

      toast({
        title: 'Başarılı',
        description: 'Sipariş oluşturuldu. Satıcıyla iletişime geçebilirsiniz.',
      })

      router.push(`/marketplace/orders/${order.id}`)
    } catch (error: any) {
      const isInsufficientBalance = error.message.includes('Yetersiz bakiye') || error.message.includes('yetersiz')
      
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
        action: isInsufficientBalance ? (
          <Link href="/wallet/deposit">
            <Button size="sm" variant="outline" className="gap-2">
              <Wallet className="h-3 w-3" />
              Bakiye Ekle
            </Button>
          </Link>
        ) : undefined,
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        size="lg"
        className={`w-full min-h-[44px] ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="h-5 w-5 mr-2" />
        Satın Al - {price.toLocaleString('tr-TR')} ₺
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Satın Al</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ilanı satın almak istediğinize emin misiniz? Ödeme escrow sisteminde tutulacak ve
              teslimat onayından sonra satıcıya aktarılacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Toplam:</span>
              <span className="text-xl font-bold text-primary">
                {price.toLocaleString('tr-TR')} ₺
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ödeme cüzdanınızdan tutulacak ve teslimat onayından sonra satıcıya aktarılacaktır.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBuy} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                'Satın Al'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default BuyButton

