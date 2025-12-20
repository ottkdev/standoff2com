'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingBag, ZoomIn, CheckCircle2, Eye, Heart } from 'lucide-react'
import ProfileLink from '@/components/home/ProfileLink'
import { formatRelativeTime } from '@/lib/utils'
import ImageGallery from './ImageGallery'

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

  const isActive = listing.status === 'ACTIVE'
  const isSold = listing.status === 'SOLD'

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-sm shadow-lg shadow-black/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 flex flex-col h-full cursor-pointer">
        {/* Gradient Border Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10" />
        
        {/* Inner Shadow */}
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] pointer-events-none" />

        <Link href={`/marketplace/${listing.id}`} className="contents flex flex-col h-full">
          {/* Image Section - Premium Framing */}
          <div
            className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40 flex-shrink-0"
            onClick={handleImageClick}
          >
            {listing.images[0] ? (
              <>
                <Image
                  src={listing.images[0].url}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                {/* Premium Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center">
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="backdrop-blur-md bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        window.location.href = `/marketplace/${listing.id}`
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1.5" />
                      Detaylar
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
              </div>
            )}

            {/* Status Badge - Premium Styling */}
            <div className="absolute top-3 right-3 z-10">
              <Badge
                className={`${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                    : isSold
                    ? 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                    : statusBadges[listing.status] || 'bg-muted'
                } text-xs px-2.5 py-1 h-auto font-semibold border backdrop-blur-sm`}
              >
                {getStatusLabel()}
              </Badge>
            </div>

            {/* Image Count Badge */}
            {listing.images.length > 1 && (
              <div className="absolute bottom-3 left-3 z-10">
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-1 h-auto bg-black/70 text-white border-0 backdrop-blur-md shadow-lg"
                >
                  +{listing.images.length - 1}
                </Badge>
              </div>
            )}
          </div>

          {/* Content Section - Premium Spacing */}
          <div className="flex flex-col flex-1 p-5 min-h-0 bg-gradient-to-b from-transparent to-card/40">
            {/* Title */}
            <h3 className="text-base font-bold leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors duration-300 break-words">
              {listing.title}
            </h3>

            {/* Price - Premium Styling */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-primary">
                  {listing.price.toLocaleString('tr-TR')}
                </span>
                <span className="text-lg font-semibold text-primary/70">₺</span>
              </div>
            </div>

            {/* Footer Info - Trust Indicators */}
            <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {listing.seller.isVerified && (
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                )}
                <ProfileLink
                  username={listing.seller.username}
                  className="text-sm font-medium text-muted-foreground hover:text-primary truncate min-w-0 transition-colors"
                  noLink
                />
              </div>
              <span className="text-xs text-muted-foreground/60 flex-shrink-0 whitespace-nowrap">
                {formatRelativeTime(listing.createdAt)}
              </span>
            </div>
          </div>
        </Link>
      </div>

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
