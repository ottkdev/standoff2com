'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import MarketplaceCard from './MarketplaceCard'
import ViewToggle from './ViewToggle'
import ImageGallery from './ImageGallery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, ZoomIn, CheckCircle2 } from 'lucide-react'
import ProfileLink from '@/components/home/ProfileLink'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

interface Listing {
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

interface MarketplaceListingsProps {
  listings: Listing[]
  statusBadges: Record<string, string>
}

function MarketplaceListings({ listings, statusBadges }: MarketplaceListingsProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [mounted, setMounted] = useState(false)

  // Load view preference from localStorage (client-side only)
  useEffect(() => {
    setMounted(true)
    const savedView = localStorage.getItem('marketplace-view') as 'grid' | 'list' | null
    if (savedView) {
      setView(savedView)
    }
  }, [])

  // Save view preference to localStorage
  const handleViewChange = (newView: 'grid' | 'list') => {
    setView(newView)
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketplace-view', newView)
    }
  }

  // Prevent hydration mismatch by using default view until mounted
  const displayView = mounted ? view : 'grid'

  if (listings.length === 0) {
    return null
  }

  return (
    <div className="mb-4 sm:mb-6 md:mb-8">
      {/* View Toggle - Kompakt */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="text-xs sm:text-sm text-muted-foreground">
          {listings.length} ilan bulundu
        </div>
        {mounted && <ViewToggle view={view} onViewChange={handleViewChange} />}
      </div>

      {/* Grid View - Professional: 4-5 columns desktop, 2-3 tablet, 1 mobile */}
      {displayView === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
          {listings.map((listing) => (
            <MarketplaceCard
              key={listing.id}
              listing={listing}
              statusBadges={statusBadges}
            />
          ))}
        </div>
      )}

      {/* List View - Kompakt */}
      {displayView === 'list' && (
        <div className="space-y-2 sm:space-y-3">
          {listings.map((listing) => (
            <ListCard
              key={listing.id}
              listing={listing}
              statusBadges={statusBadges}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ListCard({ listing, statusBadges }: { listing: Listing; statusBadges: Record<string, string> }) {
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
      <Card className="hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden group">
        <Link href={`/marketplace/${listing.id}`} className="contents">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 p-2.5 sm:p-3">
            {/* Image - Compact Square */}
            <div
              className="w-full sm:w-28 md:w-32 h-28 md:h-32 flex-shrink-0 rounded-md overflow-hidden bg-muted relative cursor-pointer aspect-square"
              onClick={handleImageClick}
            >
              {listing.images[0] ? (
                <>
                  <Image
                    src={listing.images[0].url}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 hidden sm:flex items-center justify-center">
                    <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground/50" />
                </div>
              )}
              <div className="absolute top-1.5 right-1.5 z-10">
                <Badge className={`${statusBadges[listing.status] || 'bg-muted'} text-[9px] px-1.5 py-0.5 h-auto font-medium border-0 shadow-sm`}>
                  {getStatusLabel()}
                </Badge>
              </div>
              {listing.images.length > 1 && (
                <div className="absolute bottom-1.5 left-1.5 z-10">
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 h-auto bg-black/60 text-white border-0 backdrop-blur-sm">
                    +{listing.images.length - 1}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content - Compact */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold mb-1.5 group-hover:text-primary transition-colors duration-200 line-clamp-2 break-words leading-tight">
                  {listing.title}
                </h3>
                <div className="text-lg sm:text-xl font-bold text-primary mb-2 break-words">
                  {listing.price.toLocaleString('tr-TR')} ₺
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs text-muted-foreground pt-1.5 border-t border-border/50">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  {listing.seller.isVerified && (
                    <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                  )}
                  <ProfileLink
                    username={listing.seller.username}
                    className="hover:text-primary truncate min-w-0 transition-colors"
                    noLink
                  />
                </div>
                <span className="whitespace-nowrap flex-shrink-0">{formatRelativeTime(listing.createdAt)}</span>
              </div>
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

export default MarketplaceListings
export { MarketplaceListings }

