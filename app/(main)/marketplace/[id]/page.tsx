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
    <div className="min-h-screen w-full">
      {/* Background Gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-orange-500/5 via-amber-500/3 to-yellow-500/5" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(251,146,60,0.08),transparent_40%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_80%_70%,rgba(251,191,36,0.06),transparent_40%)]" />

      <div className="page-container-narrow py-6 md:py-8 lg:py-10">
        {/* Breadcrumb */}
        <Link 
          href="/marketplace" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Marketplace'e Dön</span>
        </Link>

        {/* Main Layout */}
        <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-[55%_45%]">
          {/* Left Column: Image Gallery */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Image Gallery */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-yellow-500/20 blur-xl opacity-50 rounded-xl" />
              <div className="relative rounded-xl border border-border/70 bg-background/80 backdrop-blur-sm shadow-xl shadow-orange-500/5 overflow-hidden">
                {listing.images.length > 0 ? (
                  <ListingImageGallery images={listing.images} title={listing.title} />
                ) : (
                  <div className="aspect-square flex items-center justify-center bg-muted/50">
                    <ShoppingBag className="h-20 w-20 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Security Info Cards */}
            {!isOwner && listing.status === 'ACTIVE' && (
              <div className="space-y-4">
                {/* Güvenli Alışveriş */}
                <div className="relative rounded-xl border border-green-500/30 bg-green-500/5 backdrop-blur-sm shadow-lg shadow-green-500/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                  <div className="relative p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-14 w-14 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                          <Shield className="h-7 w-7 text-green-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-2 text-green-50">Güvenli Ticaret</h3>
                        <p className="text-sm text-green-100/80 leading-relaxed">
                          Standoff 2 Topluluk platformunda tüm işlemler güvenli escrow sistemi ile korunur. Ödemeniz teslimat onayına kadar güvende tutulur. Satıcı ve alıcı arasındaki anlaşmazlıklarda moderatör ekibimiz devreye girer. Hesap, skin ve item alışverişlerinizde güvenliğiniz bizim önceliğimizdir.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Yardım */}
                <div className="relative rounded-xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm shadow-lg shadow-blue-500/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                  <div className="relative p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-14 w-14 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                          <Clock className="h-7 w-7 text-blue-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-2 text-blue-50">Yardıma mı ihtiyacınız var?</h3>
                        <p className="text-sm text-blue-100/80 leading-relaxed mb-3">
                          Buraya tıklayarak yardım merkezi sayfamıza ulaşabilirsiniz. Üyelerimiz tarafından sıkça sorulan sorular yardım merkezinde listelenmektedir.
                        </p>
                        <Link href="/support" className="inline-flex items-center gap-1.5 text-sm text-blue-300 hover:text-blue-200 font-medium transition-colors">
                          <span>Yardım Merkezi</span>
                          <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
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
                {session?.user && typeof likeCount === 'number' && (
                  <ListingLikeButton
                    listingId={listing.id}
                    initialLiked={!!userLike}
                    initialCount={Math.max(0, likeCount || 0)}
                  />
                )}
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 gradient-text break-words leading-tight">
                  {listing.title}
                </h1>
              </div>

              {listing.status === 'REJECTED' && listing.rejectedReason && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-destructive mb-1">Red Nedeni:</p>
                  <p className="text-sm text-muted-foreground break-words">{listing.rejectedReason}</p>
                </div>
              )}
            </div>

            {/* Quick Description */}
            <div className="rounded-xl border border-border/70 bg-background/60 backdrop-blur-sm shadow-lg p-5">
              <p className="text-sm text-muted-foreground leading-relaxed break-words">
                {listing.description.length > 200 ? `${listing.description.substring(0, 200)}...` : listing.description}
              </p>
            </div>

            {/* Action Buttons */}
            {!isOwner && listing.status === 'ACTIVE' && !hasActiveOrder && session?.user && (
              <div className="space-y-3">
                <BuyButton listingId={listing.id} price={listing.price} />
                <ReportButton targetType="LISTING" targetId={listing.id} variant="outline" className="w-full text-xs" />
              </div>
            )}

            {isOwner && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm shadow-lg p-5">
                <p className="text-sm text-muted-foreground mb-4 break-words">
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
              <div className="space-y-3">
                <Link href={`/marketplace/orders/${listing.orders[0].id}`}>
                  <Button size="lg" className="w-full min-h-[44px]" variant="outline">
                    Siparişi Görüntüle
                  </Button>
                </Link>
                <ReportButton targetType="LISTING" targetId={listing.id} variant="outline" className="w-full text-xs" />
              </div>
            )}

            {!isOwner && listing.status === 'SOLD' && !hasActiveOrder && (
              <ReportButton targetType="LISTING" targetId={listing.id} variant="outline" className="w-full text-xs" />
            )}

            {/* Seller Info Card */}
            <div className="rounded-xl border border-border/70 bg-background/60 backdrop-blur-sm shadow-lg overflow-hidden">
              <div className="p-5 border-b border-border/50">
                <h3 className="font-semibold text-base">Satıcı Bilgileri</h3>
              </div>
              <div className="p-5 space-y-4">
                <Link
                  href={`/profile/${listing.seller.username}`}
                  className="flex items-center gap-4 hover:text-primary transition-colors group"
                >
                  <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-border/50 group-hover:ring-primary/50 transition-all">
                    <AvatarImage src={listing.seller.avatarUrl || ''} />
                    <AvatarFallback className="text-base font-semibold">
                      {listing.seller.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg truncate">{listing.seller.username}</span>
                      {listing.seller.isVerified && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{formatRelativeTime(listing.createdAt)}</span>
                    </div>
                  </div>
                </Link>
                
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Başarılı İşlem</span>
                    <span className="text-base font-semibold">{sellerStats}</span>
                  </div>
                  {listing.seller.isVerified && (
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Onaylı Satıcı</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Tabs Section */}
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
