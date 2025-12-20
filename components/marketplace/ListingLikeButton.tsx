'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface ListingLikeButtonProps {
  listingId: string
  initialLiked: boolean
  initialCount: number
}

export default function ListingLikeButton({
  listingId,
  initialLiked,
  initialCount,
}: ListingLikeButtonProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    if (!session) {
      toast({
        title: 'Giriş gerekli',
        description: 'Beğenmek için giriş yapmalısınız',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      })

      if (response.ok) {
        setIsLiked(!isLiked)
        setCount((prev) => (isLiked ? prev - 1 : prev + 1))
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-1.5"
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
      <span className="text-xs">{count}</span>
    </Button>
  )
}

