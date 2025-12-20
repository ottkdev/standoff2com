import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatRelativeTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShoppingBag, Calendar, ArrowLeft, CheckCircle2, Tag, Shield, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ListingActions from '@/components/marketplace/ListingActions'
import MarkSoldButton from '@/components/marketplace/MarkSoldButton'
import ListingImageGallery from '@/components/marketplace/ListingImageGallery'
import ReportButton from '@/components/report/ReportButton'
import BuyButton from '@/components/marketplace/BuyButton'
import ListingLikeButton from '@/components/marketplace/ListingLikeButton'
import ListingTabs from '@/components/marketplace/ListingTabs'

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
      deletedAt: null,
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

  // Get seller stats, like count, and ratings
  const [sellerStats, likeCount, userLike, sellerRatings] = await Promise.all([
    prisma.marketplaceListing.count({
      where: {
        sellerId: listing.sellerId,
        status: 'SOLD',
        deletedAt: null,
      },
    }),
    prisma.marketplaceListingLike.count({
      where: {
        listingId: listing.id,
      },
    }).catch(() => 0),
    session?.user?.id
      ? prisma.marketplaceListingLike
          .findUnique({
            where: {
              userId_listingId: {
                userId: session.user.id,
                listingId: listing.id,
              },
            },
          })
          .catch(() => null)
      : Promise.resolve(null),
    prisma.sellerRating
      .findMany({
        where: {
          sellerId: listing.sellerId,
        },
        include: {
          buyer: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
      .catch(() => [] as Array<{
        id: string
        rating: number
        comment: string | null
        buyer: { username: string; avatarUrl: string | null }
        createdAt: Date
      }>),
  ])

  const averageRating =
    sellerRatings.length > 0
      ? sellerRatings.reduce((sum, r) => sum + r.rating, 0) / sellerRatings.length
      : 0

  const isOwner = session?.user?.id === listing.sellerId
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR'
  const hasActiveOrder = listing.orders.length > 0
  const isBuyer = hasActiveOrder && listing.orders[0]?.buyerId === session?.user?.id

  if (listing.status !== 'ACTIVE' && !isOwner && !isAdmin && !isBuyer) {
    notFound()
  }

  return (
    <div className="w-full bg-background">
      <div className="page-container-narrow py-6 md:py-8">
        {/* Breadcrumb */}
        <Link 
          href="/marketplace" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Marketplace'e Dön</span>
        </Link>

        {/* Main Layout - Two Columns Starting at Same Top */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
          {/* Left Column: Product Content */}
          <div className="space-y-6">
            {/* Product Image */}
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-4 md:p-6">
                {listing.images.length > 0 ? (
                  <ListingImageGallery images={listing.images} title={listing.title} />
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-border/50">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">Görsel bulunmuyor</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Description - Directly Under Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">İlan Açıklaması</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                  {listing.description || 'Açıklama bulunmuyor.'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Purchase Panel */}
          <div>
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
              <CardContent className="p-5 md:p-6 space-y-5">
                {/* Status + Favorite */}
                <div className="flex items-center justify-between gap-3">
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
                    className="text-xs px-2.5 py-1"
                  >
                    {listing.status === 'ACTIVE' && 'Aktif'}
                    {listing.status === 'SOLD' && 'Satıldı'}
                    {listing.status === 'PENDING' && 'Onay Bekliyor'}
                    {listing.status === 'REJECTED' && 'Reddedildi'}
                  </Badge>
                  {session?.user && typeof likeCount === 'number' && (
                    <ListingLikeButton
                      listingId={listing.id}
                      initialLiked={!!userLike}
                      initialCount={Math.max(0, likeCount || 0)}
                    />
                  )}
                </div>

                {/* Item Title */}
                <h1 className="text-xl md:text-2xl font-bold break-words leading-tight">
                  {listing.title}
                </h1>

                {/* Price Block */}
                <div className="py-4 border-y border-border/50">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-extrabold text-primary leading-none">
                      {listing.price.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-xl font-bold text-primary/70">₺</span>
                  </div>
                </div>

                {listing.status === 'REJECTED' && listing.rejectedReason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <p className="text-xs font-semibold text-destructive mb-1">Red Nedeni:</p>
                    <p className="text-xs text-muted-foreground break-words">{listing.rejectedReason}</p>
                  </div>
                )}

                {/* Seller Box */}
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <Link
                      href={`/profile/${listing.seller.username}`}
                      className="flex items-center gap-3 hover:text-primary transition-colors group"
                    >
                      <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-border/50 group-hover:ring-primary/50 transition-all">
                        <AvatarImage src={listing.seller.avatarUrl || ''} />
                        <AvatarFallback className="text-base font-semibold">
                          {listing.seller.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-base truncate">{listing.seller.username}</span>
                          {listing.seller.isVerified && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sellerStats} Başarılı İşlem
                          {listing.seller.isVerified && (
                            <span className="ml-2 text-emerald-500">• Onaylı</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Primary Action */}
                {!isOwner && listing.status === 'ACTIVE' && !hasActiveOrder && session?.user && (
                  <div className="space-y-2">
                    <BuyButton listingId={listing.id} price={listing.price} />
                    <ReportButton targetType="LISTING" targetId={listing.id} variant="outline" className="w-full text-xs" />
                  </div>
                )}

                {isOwner && (
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      Bu ilan size ait
                    </p>
                    <div className="flex flex-col gap-2">
                      {listing.status === 'ACTIVE' && (
                        <MarkSoldButton listingId={listing.id} />
                      )}
                      <ListingActions listingId={listing.id} status={listing.status} />
                    </div>
                  </div>
                )}

                {!isOwner && listing.status === 'ACTIVE' && hasActiveOrder && isBuyer && (
                  <div className="space-y-2">
                    <Link href={`/marketplace/orders/${listing.orders[0].id}`}>
                      <Button size="lg" className="w-full min-h-[48px]" variant="outline">
                        Siparişi Görüntüle
                      </Button>
                    </Link>
                    <ReportButton targetType="LISTING" targetId={listing.id} variant="outline" className="w-full text-xs" />
                  </div>
                )}

                {!isOwner && listing.status === 'SOLD' && !hasActiveOrder && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg border border-slate-500/30 bg-slate-500/10 text-center">
                      <p className="text-xs font-semibold text-slate-300 mb-1">Bu ürün satıldı</p>
                    </div>
                    <ReportButton targetType="LISTING" targetId={listing.id} variant="outline" className="w-full text-xs" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Tabs Section - Additional Info */}
        <div className="mt-8 md:mt-10">
          <ListingTabs
            description={listing.description}
            sellerId={listing.sellerId}
            averageRating={averageRating || 0}
            totalRatings={sellerRatings?.length || 0}
            ratings={
              sellerRatings && Array.isArray(sellerRatings)
                ? sellerRatings
                    .filter((r) => r && r.buyer && r.id)
                    .map((r) => ({
                      id: r.id,
                      rating: r.rating || 0,
                      comment: r.comment || null,
                      buyer: r.buyer,
                      createdAt: r.createdAt,
                    }))
                : []
            }
          />
        </div>
      </div>
    </div>
  )
}
