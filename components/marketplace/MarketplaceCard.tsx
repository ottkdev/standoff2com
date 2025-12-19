'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
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

  const getStatusLabel = () => {
    switch (listing.status) {
      case 'ACTIVE':
        return 'Aktif'
      case 'PENDING':
        return 'Bekliyor'
      case 'SOLD':
        return 'Satıldı'
      case 'REJECTED':
        return 'Reddedildi'
      default:
        return listing.status
    }
  }

  return (
    <>
      <Card className="group overflow-hidden border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col h-full">
        <Link href={`/marketplace/${listing.id}`} className="contents flex flex-col h-full">
          {/* Image Section - Fixed 4:3 aspect ratio */}
          <div
            className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
            onClick={handleImageClick}
          >
            {listing.images[0] ? (
              <>
                <img
                  src={listing.images[0].url}
                  alt={listing.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                {/* Hover overlay - Desktop only */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 hidden sm:flex items-center justify-center">
                  <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
              </div>
            )}

            {/* Status Badge - Top Right */}
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
              <Badge
                className={`${statusBadges[listing.status] || 'bg-muted'} text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 h-auto font-medium border-0 shadow-sm`}
              >
                {getStatusLabel()}
              </Badge>
            </div>

            {/* Image Count Badge - Bottom Left */}
            {listing.images.length > 1 && (
              <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10">
                <Badge
                  variant="secondary"
                  className="text-[9px] sm:text-[10px] px-1.5 py-0.5 h-auto bg-black/60 text-white border-0 backdrop-blur-sm"
                >
                  +{listing.images.length - 1}
                </Badge>
              </div>
            )}
          </div>

          {/* Content Section - Compact */}
          <div className="flex flex-col flex-1 p-2.5 sm:p-3 min-h-0">
            {/* Title - Max 2 lines */}
            <h3 className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-primary transition-colors duration-200 break-words">
              {listing.title}
            </h3>

            {/* Price - Prominent but not excessive */}
            <div className="text-base sm:text-lg font-bold text-primary mb-2 sm:mb-2.5 break-words">
              {listing.price.toLocaleString('tr-TR')} ₺
            </div>

            {/* Footer Info - Compact */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-auto pt-1.5 sm:pt-2 border-t border-border/50">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                <ProfileLink
                  username={listing.seller.username}
                  className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary truncate min-w-0 transition-colors"
                  noLink
                />
              </div>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground/80 flex-shrink-0 whitespace-nowrap">
                {formatRelativeTime(listing.createdAt)}
              </span>
            </div>
          </div>
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
