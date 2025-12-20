'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { RejectListingDialog } from './RejectListingDialog'

interface ListingAdminActionsProps {
  listing: {
    id: string
    status: string
  }
}

export function ListingAdminActions({ listing }: ListingAdminActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/marketplace/${listing.id}/approve`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'İlan onaylandı',
        })
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Onaylama başarısız')
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

  const handleReject = () => {
    // Reject dialog will handle this
  }

  return (
    <div className="flex gap-2">
      {listing.status === 'PENDING' && (
        <>
          <Button
            size="sm"
            variant="default"
            className="gap-1"
            onClick={handleApprove}
            disabled={isLoading}
          >
            <Check className="h-4 w-4" />
            Onayla
          </Button>
          <RejectListingDialog listingId={listing.id} onReject={handleReject} />
        </>
      )}
      <Link href={`/marketplace/${listing.id}`}>
        <Button variant="outline" size="sm">
          Görüntüle
        </Button>
      </Link>
    </div>
  )
}

export default ListingAdminActions
export { ListingAdminActions }

