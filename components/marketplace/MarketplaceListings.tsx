'use client'

import { useState, useEffect } from 'react'
import { MarketplaceCard } from './MarketplaceCard'
import { ViewToggle } from './ViewToggle'
import { ImageGallery } from './ImageGallery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, ZoomIn } from 'lucide-react'
import { ProfileLink } from '@/components/home/ProfileLink'
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

export function MarketplaceListings({ listings, statusBadges }: MarketplaceListingsProps) {
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
    <div className="mb-8 md:mb-12">
      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {listings.length} ilan bulundu
        </div>
        {mounted && <ViewToggle view={view} onViewChange={handleViewChange} />}
      </div>

      {/* Grid View */}
      {displayView === 'grid' && (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <MarketplaceCard
              key={listing.id}
              listing={listing}
              statusBadges={statusBadges}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {displayView === 'list' && (
        <div className="space-y-4">
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

  return (
    <>
      <Card className="glass-effect hover:border-primary/50 hover:shadow-lg transition-all overflow-hidden group">
        <Link href={`/marketplace/${listing.id}`} className="contents">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Image */}
            <div
              className="w-full md:w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-muted relative cursor-pointer"
              onClick={handleImageClick}
            >
              {listing.images[0] ? (
                <>
                  <img
                    src={listing.images[0].url}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
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
                    +{listing.images.length - 1}
                  </Badge>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between p-4 md:p-6 min-w-0">
              <div className="min-w-0">
                <CardTitle className="text-lg md:text-xl lg:text-2xl mb-2 group-hover:text-primary transition-colors break-words">
                  {listing.title}
                </CardTitle>
                <div className="text-xl md:text-2xl lg:text-3xl font-bold text-primary mb-4 break-words">
                  {listing.price.toLocaleString('tr-TR')} ₺
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <ProfileLink
                    username={listing.seller.username}
                    className="hover:text-primary truncate"
                    noLink
                  />
                </div>
                <span className="whitespace-nowrap">{formatRelativeTime(listing.createdAt)}</span>
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

