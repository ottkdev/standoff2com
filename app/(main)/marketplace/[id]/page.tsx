import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatRelativeTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShoppingBag, User, Calendar, ArrowLeft, CheckCircle2, Tag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ListingActions } from '@/components/marketplace/ListingActions'
import { MarkSoldButton } from '@/components/marketplace/MarkSoldButton'
import { ListingImageGallery } from '@/components/marketplace/ListingImageGallery'
import { ReportButton } from '@/components/report/ReportButton'
import { BuyButton } from '@/components/marketplace/BuyButton'

interface PageProps {
  params: {
    id: string
  }
}

export default async function MarketplaceListingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const listing = await prisma.marketplaceListing.findFirst({
    where: {
      id: params.id,
      deletedAt: null, // Soft delete kontrolü
    },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          isVerified: true,
          displayName: true,
        },
      },
      images: {
        orderBy: { order: 'asc' },
      },
      orders: {
        where: {
          status: {
            in: ['PENDING_DELIVERY', 'COMPLETED', 'DISPUTED'],
          },
        },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!listing) {
    notFound()
  }

  const isOwner = session?.user?.id === listing.sellerId
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR'
  const hasActiveOrder = listing.orders.length > 0
  const isBuyer = hasActiveOrder && listing.orders[0]?.buyerId === session?.user?.id

  if (listing.status !== 'ACTIVE' && !isOwner && !isAdmin && !isBuyer) {
    notFound()
  }

  return (
    <div className="container py-4 sm:py-6 md:py-8 max-w-6xl px-3 sm:px-4 md:px-5 lg:px-6">
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-primary mb-3 sm:mb-4 text-xs sm:text-sm">
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="truncate">Marketplace'e Dön</span>
      </Link>

      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[42%_58%]">
        {/* Images - %42 genişlik */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          {listing.images.length > 0 ? (
            <ListingImageGallery images={listing.images} title={listing.title} />
          ) : (
            <div className="aspect-square rounded-lg bg-muted flex items-center justify-center max-h-[600px]">
              <ShoppingBag className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Details - %58 genişlik */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <div className="mb-2 sm:mb-3 space-y-1.5">
              <Badge
                variant={
                  listing.status === 'ACTIVE'
                    ? 'default'
                    : listing.status === 'SOLD'
                    ? 'secondary'
                    : listing.status === 'REJECTED'
                    ? 'destructive'
                    : 'outline'
                }
                className="text-xs"
              >
                {listing.status === 'ACTIVE' && 'Aktif'}
                {listing.status === 'SOLD' && 'Satıldı'}
                {listing.status === 'PENDING' && 'Onay Bekliyor'}
                {listing.status === 'REJECTED' && 'Reddedildi'}
              </Badge>
              {listing.status === 'REJECTED' && listing.rejectedReason && (
                <div className="p-2 sm:p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs sm:text-sm font-semibold text-destructive mb-0.5">Red Nedeni:</p>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">{listing.rejectedReason}</p>
                </div>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 gradient-text break-words">{listing.title}</h1>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 sm:mb-4 break-words">
              {listing.price.toLocaleString('tr-TR')} ₺
            </div>
          </div>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Açıklama</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground break-words leading-relaxed">
                {listing.description}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Satıcı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/profile/${listing.seller.username}`}
                className="flex items-center gap-2 sm:gap-3 hover:text-primary transition-colors"
              >
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                  <AvatarImage src={listing.seller.avatarUrl || ''} />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {listing.seller.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-semibold text-sm sm:text-base truncate">{listing.seller.username}</span>
                    {listing.seller.isVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{formatRelativeTime(listing.createdAt)}</span>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="glass-effect border-primary/50">
              <CardContent className="pt-4">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 break-words">
                  Bu ilan size ait
                </p>
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  {listing.status === 'ACTIVE' && (
                    <MarkSoldButton listingId={listing.id} />
                  )}
                  <div className="flex gap-1.5 sm:gap-2">
                    <ListingActions listingId={listing.id} status={listing.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isOwner && listing.status === 'ACTIVE' && !hasActiveOrder && session?.user && (
            <div className="space-y-2 sm:space-y-3">
              <BuyButton listingId={listing.id} price={listing.price} />
              <ReportButton targetType="LISTING" targetId={listing.id} variant="outline" className="w-full" />
            </div>
          )}

          {!isOwner && listing.status === 'ACTIVE' && hasActiveOrder && isBuyer && (
            <div className="space-y-2 sm:space-y-3">
              <Link href={`/marketplace/orders/${listing.orders[0].id}`}>
                <Button size="lg" className="w-full min-h-[44px]" variant="outline">
                  Siparişi Görüntüle
                </Button>
              </Link>
              <ReportButton targetType="LISTING" targetId={listing.id} variant="outline" className="w-full" />
            </div>
          )}

          {!isOwner && listing.status === 'SOLD' && !hasActiveOrder && (
            <ReportButton targetType="LISTING" targetId={listing.id} variant="outline" className="w-full" />
          )}
        </div>
      </div>
    </div>
  )
}

