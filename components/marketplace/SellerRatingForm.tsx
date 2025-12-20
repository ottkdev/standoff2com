'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SellerRatingFormProps {
  orderId: string
  sellerId: string
  onSuccess?: () => void
}

export default function SellerRatingForm({
  orderId,
  sellerId,
  onSuccess,
}: SellerRatingFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir puan seçin',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/marketplace/orders/${orderId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'Değerlendirme gönderildi',
        })
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Değerlendirme gönderilemedi')
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-xs mb-2 block">Puan Verin</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={cn(
                  'h-6 w-6 transition-colors cursor-pointer',
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-500 text-yellow-500'
                    : 'text-muted-foreground'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="comment" className="text-xs mb-2 block">
          Yorum (Opsiyonel)
        </Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Satıcı hakkında yorumunuz..."
          rows={3}
          maxLength={500}
          className="text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/500 karakter
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full text-xs"
        size="sm"
      >
        {isSubmitting ? 'Gönderiliyor...' : 'Değerlendirme Gönder'}
      </Button>
    </form>
  )
}

