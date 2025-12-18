'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Edit } from 'lucide-react'
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

interface ListingActionsProps {
  listingId: string
  status: string
}

export function ListingActions({ listingId, status }: ListingActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'İlan silindi',
        })
        router.push('/marketplace')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Silme başarısız')
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (status === 'SOLD' || status === 'REJECTED') {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="flex-1" disabled={isDeleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İlanı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ilanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => router.push(`/marketplace/${listingId}/edit`)}
      >
        <Edit className="h-4 w-4 mr-2" />
        Düzenle
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="flex-1" disabled={isDeleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İlanı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ilanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

