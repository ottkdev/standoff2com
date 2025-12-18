'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/utils'
import { ShoppingBag, ArrowRight, User, Sparkles, Shield } from 'lucide-react'
import { ProfileLink } from './ProfileLink'

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

export function MarketplaceSummary({ listings }: MarketplaceSummaryProps) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {listings.map((listing) => (
          <Card key={listing.id} className="hover:border-primary/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all h-full flex flex-col overflow-hidden group">
            <Link href={`/marketplace/${listing.id}`} className="contents">
              {listing.images[0] ? (
                <div className="aspect-video w-full overflow-hidden relative bg-muted">
                  <img
                    src={listing.images[0].url}
                    alt={listing.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30 opacity-70" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs shadow-sm shadow-emerald-500/10">
                      Aktif
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                  {listing.title}
                </CardTitle>
                <div className="flex items-center justify-between">
                  <div className="text-lg md:text-xl font-bold text-primary mt-2">
                    {listing.price.toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] text-primary">
                    <Shield className="h-3 w-3" />
                    Onaylı Süreç
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <ProfileLink
                    username={listing.seller.username}
                    isVerified={listing.seller.isVerified}
                    className="hover:text-primary truncate flex-1 min-w-0"
                  />
                  <span>•</span>
                  <span className="whitespace-nowrap">{formatRelativeTime(listing.createdAt)}</span>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
