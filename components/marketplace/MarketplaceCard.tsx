'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, ZoomIn } from 'lucide-react'
import { ProfileLink } from '@/components/home/ProfileLink'
import { formatRelativeTime } from '@/lib/utils'
import { ImageGallery } from './ImageGallery'

interface MarketplaceCardProps {
  listing: {
    id: string
    title: string
    price: number
    status: string
    createdAt: Date | string
    seller: {
      username: string
      avatarUrl: string | null
      isVerified: boolean
    }
    images: Array<{ id: string; url: string }>
  }
  statusBadges: Record<string, string>
}

export function MarketplaceCard({ listing, statusBadges }: MarketplaceCardProps) {
  const [showGallery, setShowGallery] = useState(false)

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (listing.images.length > 0) {
      setShowGallery(true)
    }
  }

  return (
    <>
      <Card className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all overflow-hidden group">
        <Link href={`/marketplace/${listing.id}`} className="contents">
          {listing.images[0] ? (
            <div
              className="aspect-video w-full overflow-hidden relative cursor-pointer"
              onClick={handleImageClick}
            >
              <img
                src={listing.images[0].url}
                alt={listing.title}
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute top-2 right-2 z-10">
                <Badge className={`${statusBadges[listing.status] || 'bg-muted'} text-xs`}>
                  {listing.status === 'ACTIVE' && 'Aktif'}
                  {listing.status === 'PENDING' && 'Bekliyor'}
                  {listing.status === 'SOLD' && 'Satıldı'}
                  {listing.status === 'REJECTED' && 'Reddedildi'}
                </Badge>
              </div>
              {listing.images.length > 1 && (
                <div className="absolute bottom-2 left-2 z-10">
                  <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                    +{listing.images.length - 1} resim
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video w-full bg-muted flex items-center justify-center">
              <User className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
            </div>
          )}
          <CardHeader className="pb-3">
            <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-base md:text-lg">
              {listing.title}
            </CardTitle>
            <div className="text-xl md:text-2xl font-bold text-primary mt-2">
              {listing.price.toLocaleString('tr-TR')} ₺
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <ProfileLink
                  username={listing.seller.username}
                  className="hover:text-primary truncate max-w-[120px] md:max-w-none"
                  noLink
                />
              </div>
              <span className="text-muted-foreground text-xs">
                {formatRelativeTime(listing.createdAt)}
              </span>
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* Image Gallery Modal */}
      {showGallery && listing.images.length > 0 && (
        <ImageGallery
          images={listing.images}
          initialIndex={0}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  )
}

