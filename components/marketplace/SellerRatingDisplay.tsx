'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SellerRatingDisplayProps {
  sellerId: string
  averageRating: number
  totalRatings: number
  ratings: Array<{
    id: string
    rating: number
    comment: string | null
    buyer: {
      username: string
      avatarUrl: string | null
    }
    createdAt: Date | string
  }>
}

export default function SellerRatingDisplay({
  averageRating = 0,
  totalRatings = 0,
  ratings = [],
}: SellerRatingDisplayProps) {
  // Safety check - always return valid JSX
  if (!ratings || !Array.isArray(ratings)) {
    return (
      <Card className="glass-effect">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground text-center py-4">
            Değerlendirmeler yükleniyor...
          </p>
        </CardContent>
      </Card>
    )
  }

  // Ensure ratings array is valid
  const validRatings = ratings.filter((r) => r && r.id && r.buyer && typeof r.rating === 'number')
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-3.5 w-3.5',
              star <= rating
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-muted-foreground'
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <Card className="glass-effect">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Satıcı Değerlendirmeleri</span>
          {validRatings.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {averageRating.toFixed(1)} / 5.0
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validRatings.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Henüz değerlendirme yapılmamış
          </p>
        ) : (
          <>
            {/* Ortalama Puan */}
            <div className="flex items-center gap-3 pb-3 border-b border-border/50">
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex-1">
                {renderStars(Math.round(averageRating))}
                <p className="text-xs text-muted-foreground mt-1">
                  {validRatings.length} değerlendirme
                </p>
              </div>
            </div>

            {/* Değerlendirmeler Listesi */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {validRatings.map((rating) => (
                <div key={rating.id} className="pb-3 border-b border-border/30 last:border-0">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{rating.buyer.username}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {renderStars(rating.rating)}
                      <span className="text-xs text-muted-foreground ml-1">
                        {rating.rating}/5
                      </span>
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                      {rating.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { SellerRatingDisplay }
