'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/utils'
import { ShoppingBag, ArrowRight, User, Sparkles, Shield } from 'lucide-react'
import ProfileLink from './ProfileLink'

interface MarketplaceListing {
  id: string
  title: string
  price: number
  createdAt: Date | string
  seller: {
    username: string
    avatarUrl: string | null
    isVerified: boolean
  }
  images: Array<{ url: string }>
}

interface MarketplaceSummaryProps {
  listings: MarketplaceListing[]
}

function MarketplaceSummary({ listings }: MarketplaceSummaryProps) {
  if (listings.length === 0) return null

  return (
    <div className="w-full space-y-4 relative">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-primary/10 rounded-2xl blur-2xl" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-semibold text-lg md:text-xl">Marketplace</h3>
            <p className="text-xs text-muted-foreground hidden sm:block">Onaylı ilanlar, hızlı filtreleme, güvenli ticaret</p>
          </div>
        </div>
        <Link href="/marketplace">
          <span className="text-sm text-primary hover:underline flex items-center gap-1">
            <span className="hidden sm:inline">Tüm ilanları gör</span>
            <span className="sm:hidden">Tümü</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-3.5">
        {listings.map((listing) => (
          <Card key={listing.id} className="group overflow-hidden border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col h-full">
            <Link href={`/marketplace/${listing.id}`} className="contents flex flex-col h-full">
              {/* Image - Fixed 4:3 aspect ratio */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted flex-shrink-0">
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 hidden sm:block" />
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" aria-hidden="true" />
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 h-auto font-medium shadow-sm">
                    Aktif
                  </Badge>
                </div>
              </div>

              {/* Content - Compact */}
              <div className="flex flex-col flex-1 p-2.5 sm:p-3 min-h-0">
                <h3 className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-primary transition-colors duration-200 break-words">
                  {listing.title}
                </h3>
                <div className="text-base sm:text-lg font-bold text-primary mb-2 sm:mb-2.5 break-words">
                  {listing.price.toLocaleString('tr-TR')} ₺
                </div>
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-auto pt-1.5 sm:pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                    <ProfileLink
                      username={listing.seller.username}
                      isVerified={listing.seller.isVerified}
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
        ))}
      </div>
    </div>
  )
}

export default MarketplaceSummary
