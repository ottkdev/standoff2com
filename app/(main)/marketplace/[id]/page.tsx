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
    },
  })

  if (!listing) {
    notFound()
  }

  const isOwner = session?.user?.id === listing.sellerId
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR'

  if (listing.status !== 'ACTIVE' && !isOwner && !isAdmin) {
    notFound()
  }

  return (
    <div className="container py-6 md:py-10 max-w-6xl px-4 md:px-6">
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 md:mb-6 text-sm md:text-base">
        <ArrowLeft className="h-4 w-4" />
        <span className="truncate">Marketplace'e Dön</span>
      </Link>

      <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 md:grid-cols-2">
        {/* Images */}
        <div>
          {listing.images.length > 0 ? (
            <ListingImageGallery images={listing.images} title={listing.title} />
          ) : (
            <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
              <ShoppingBag className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="mb-4">
            <div className="mb-4 space-y-2">
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
              >
                {listing.status === 'ACTIVE' && 'Aktif'}
                {listing.status === 'SOLD' && 'Satıldı'}
                {listing.status === 'PENDING' && 'Onay Bekliyor'}
                {listing.status === 'REJECTED' && 'Reddedildi'}
              </Badge>
              {listing.status === 'REJECTED' && listing.rejectedReason && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-semibold text-destructive mb-1">Red Nedeni:</p>
                  <p className="text-sm text-muted-foreground">{listing.rejectedReason}</p>
                </div>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 gradient-text break-words">{listing.title}</h1>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-6 break-words">
              {listing.price.toLocaleString('tr-TR')} ₺
            </div>
          </div>

          <Card className="glass-effect mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Açıklama</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground break-words">
                {listing.description}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Satıcı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/profile/${listing.seller.username}`}
                className="flex items-center gap-3 hover:text-primary transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={listing.seller.avatarUrl || ''} />
                  <AvatarFallback>
                    {listing.seller.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{listing.seller.username}</span>
                    {listing.seller.isVerified && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatRelativeTime(listing.createdAt)}
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="glass-effect border-primary/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Bu ilan size ait
                </p>
                <div className="flex flex-col gap-2">
                  {listing.status === 'ACTIVE' && (
                    <MarkSoldButton listingId={listing.id} />
                  )}
                  <div className="flex gap-2">
                    <ListingActions listingId={listing.id} status={listing.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isOwner && listing.status === 'ACTIVE' && (
            <Link href={`/messages/${listing.sellerId}`}>
              <Button size="lg" className="w-full">
                Satıcıyla İletişime Geç
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

