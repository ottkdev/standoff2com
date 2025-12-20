'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface MarkSoldButtonProps {
  listingId: string
}

export function MarkSoldButton({ listingId }: MarkSoldButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkSold = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}/mark-sold`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'İlan satıldı olarak işaretlendi',
        })
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'İşlem başarısız')
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isLoading}>
          <CheckCircle2 className="h-4 w-4" />
          Satıldı Olarak İşaretle
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>İlanı Satıldı Olarak İşaretle</AlertDialogTitle>
          <AlertDialogDescription>
            Bu ilanı satıldı olarak işaretlemek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleMarkSold} disabled={isLoading}>
            Satıldı Olarak İşaretle
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default MarkSoldButton

