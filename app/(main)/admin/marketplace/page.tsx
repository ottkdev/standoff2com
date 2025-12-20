import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Prisma, MarketplaceStatus } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingBag, CheckCircle2, Clock, XCircle, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import ListingAdminActions from '@/components/admin/ListingAdminActions'
import MarketplaceSearchFilters from '@/components/admin/MarketplaceSearchFilters'

interface PageProps {
  searchParams: {
    search?: string
    status?: string
    page?: string
  }
}

export default async function AdminMarketplacePage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const search = searchParams.search || ''
  const status = searchParams.status || 'all'
  const page = parseInt(searchParams.page || '1')
  const perPage = 20
  const skip = (page - 1) * perPage

  const where: Prisma.MarketplaceListingWhereInput = {
    deletedAt: null,
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status !== 'all') {
    where.status = status as MarketplaceStatus
  }

  const [listings, total, stats] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      take: perPage,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        images: {
          take: 1,
        },
      },
    }),
    prisma.marketplaceListing.count({ where }),
    Promise.all([
      prisma.marketplaceListing.count({ where: { deletedAt: null } }),
      prisma.marketplaceListing.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.marketplaceListing.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.marketplaceListing.count({ where: { status: 'SOLD', deletedAt: null } }),
      prisma.marketplaceListing.count({ where: { status: 'REJECTED', deletedAt: null } }),
      prisma.marketplaceListing.aggregate({
        where: { status: 'ACTIVE', deletedAt: null },
        _sum: { price: true },
      }),
    ]),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 gradient-text">İlan Yönetimi</h1>
        <p className="text-muted-foreground">İlanları görüntüle, onayla ve yönet</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Onay Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats[1]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats[2]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Satıldı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats[3]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reddedildi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats[4]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Değer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              ₺{stats[5]._sum.price?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <MarketplaceSearchFilters searchParams={searchParams} />

      {/* Listings */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>İlanlar</CardTitle>
              <CardDescription>
                {total} ilan bulundu • Sayfa {page} / {totalPages}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">İlan bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
                >
                  {listing.images[0] ? (
                    <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-1">
                      <Link
                        href={`/marketplace/${listing.id}`}
                        className="font-semibold hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1 sm:truncate"
                      >
                        {listing.title}
                      </Link>
                      <Badge
                        variant={
                          listing.status === 'ACTIVE'
                            ? 'default'
                            : listing.status === 'PENDING'
                            ? 'secondary'
                            : listing.status === 'SOLD'
                            ? 'outline'
                            : 'destructive'
                        }
                        className="text-xs w-fit"
                      >
                        {listing.status === 'ACTIVE' && 'Aktif'}
                        {listing.status === 'PENDING' && 'Onay Bekliyor'}
                        {listing.status === 'SOLD' && 'Satıldı'}
                        {listing.status === 'REJECTED' && 'Reddedildi'}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">
                          ₺{listing.price.toLocaleString()}
                        </span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <Link
                        href={`/profile/${listing.seller.username}`}
                        className="hover:text-primary transition-colors truncate"
                      >
                        {listing.seller.username}
                      </Link>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-xs sm:text-sm">{formatRelativeTime(listing.createdAt)}</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex sm:block">
                    <ListingAdminActions listing={listing} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                {skip + 1}-{Math.min(skip + perPage, total)} / {total}
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-center">
                {page > 1 && (
                  <Link
                    href={`/admin/marketplace?${new URLSearchParams({
                      ...searchParams,
                      page: (page - 1).toString(),
                    }).toString()}`}
                    className="flex-1 sm:flex-initial"
                  >
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Önceki
                    </Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/marketplace?${new URLSearchParams({
                      ...searchParams,
                      page: (page + 1).toString(),
                    }).toString()}`}
                    className="flex-1 sm:flex-initial"
                  >
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Sonraki
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
