import { prisma } from '@/lib/db'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag } from 'lucide-react'
import Image from 'next/image'

interface UserListingsProps {
  userId: string
}

async function UserListings({ userId }: UserListingsProps) {
  const listings = await prisma.marketplaceListing.findMany({
    where: {
      sellerId: userId,
      deletedAt: null, // Soft delete kontrolü
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      images: {
        take: 1,
        orderBy: { order: 'asc' },
      },
    },
  })

  if (listings.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Henüz ilan açılmamış
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-4">
            {listing.images.length > 0 ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={listing.images[0].url}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href={`/marketplace/${listing.id}`}
                  className="font-semibold hover:text-primary block truncate"
                >
                  {listing.title}
                </Link>
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
                  className="text-xs flex-shrink-0"
                >
                  {listing.status === 'ACTIVE' && 'Aktif'}
                  {listing.status === 'SOLD' && 'Satıldı'}
                  {listing.status === 'PENDING' && 'Onay Bekliyor'}
                  {listing.status === 'REJECTED' && 'Reddedildi'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">
                  {listing.price.toLocaleString('tr-TR')} ₺
                </span>
                <span>•</span>
                <span>{formatRelativeTime(listing.createdAt)}</span>
                {listing.rejectedReason && (
                  <>
                    <span>•</span>
                    <span className="text-destructive">Reddedildi</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {listings.length >= 10 && (
        <div className="text-center pt-4">
          <Link href={`/marketplace?user=${userId}`} className="text-sm text-primary hover:underline">
            Tüm ilanları gör →
          </Link>
        </div>
      )}
    </div>
  )
}

export default UserListings

