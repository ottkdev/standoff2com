'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, ZoomIn, CheckCircle2 } from 'lucide-react'
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
      <Card className="group overflow-hidden border-border/50 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 flex flex-col h-full">
        <Link href={`/marketplace/${listing.id}`} className="contents flex flex-col h-full">
          {/* Image Section - Compact 180-220px height */}
          <div
            className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
            onClick={handleImageClick}
          >
            {listing.images[0] ? (
              <>
                <Image
                  src={listing.images[0].url}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                {/* Hover overlay - Desktop only */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 hidden sm:flex items-center justify-center">
                  <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}

            {/* Status Badge - Top Right */}
            <div className="absolute top-1.5 right-1.5 z-10">
              <Badge
                className={`${statusBadges[listing.status] || 'bg-muted'} text-[9px] px-1.5 py-0.5 h-auto font-medium border-0 shadow-sm`}
              >
                {getStatusLabel()}
              </Badge>
            </div>

            {/* Image Count Badge - Bottom Left */}
            {listing.images.length > 1 && (
              <div className="absolute bottom-1.5 left-1.5 z-10">
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1.5 py-0.5 h-auto bg-black/60 text-white border-0 backdrop-blur-sm"
                >
                  +{listing.images.length - 1}
                </Badge>
              </div>
            )}
          </div>

          {/* Content Section - Ultra Compact */}
          <div className="flex flex-col flex-1 p-2 sm:p-2.5 min-h-0">
            {/* Title - Max 2 lines */}
            <h3 className="text-xs font-semibold leading-tight line-clamp-2 mb-1.5 group-hover:text-primary transition-colors duration-200 break-words">
              {listing.title}
            </h3>

            {/* Price - Prominent */}
            <div className="text-base font-bold text-primary mb-1.5 break-words">
              {listing.price.toLocaleString('tr-TR')} ₺
            </div>

            {/* Footer Info - Compact Single Line */}
            <div className="flex items-center justify-between gap-1.5 mt-auto pt-1.5 border-t border-border/40">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {listing.seller.isVerified && (
                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                )}
                <ProfileLink
                  username={listing.seller.username}
                  className="text-[10px] text-muted-foreground hover:text-primary truncate min-w-0 transition-colors"
                  noLink
                />
              </div>
              <span className="text-[9px] text-muted-foreground/70 flex-shrink-0 whitespace-nowrap">
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

export default MarketplaceCard
