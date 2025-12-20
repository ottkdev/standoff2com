import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/db'
import { Prisma, MarketplaceStatus } from '@prisma/client'
import { ShoppingBag, Plus } from 'lucide-react'
import MarketplaceListings from '@/components/marketplace/MarketplaceListings'
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters'

interface PageProps {
  searchParams: {
    page?: string
    q?: string
    status?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
  }
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  try {
    const session = await getServerSession(authOptions)
    const page = Math.max(1, parseInt(searchParams.page || '1'))
    const q = (searchParams.q || '').toString()
    const statusParam = (searchParams.status || 'ACTIVE').toUpperCase()
    const allowedStatuses = ['ALL', 'ACTIVE', 'PENDING', 'SOLD', 'REJECTED']
    const status = allowedStatuses.includes(statusParam) ? statusParam : 'ACTIVE'
    const minPrice = searchParams.minPrice ? Math.max(0, Number(searchParams.minPrice)) : undefined
    const maxPrice = searchParams.maxPrice ? Math.max(0, Number(searchParams.maxPrice)) : undefined
    const sort = (searchParams.sort || 'newest').toString()
    const limit = 12
    const skip = (page - 1) * limit

    const where: Prisma.MarketplaceListingWhereInput = {
      deletedAt: null,
    }

    if (status !== 'ALL') {
      where.status = status as MarketplaceStatus
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    let orderBy: { createdAt?: 'desc' | 'asc'; price?: 'asc' | 'desc' } = { createdAt: 'desc' }
    if (sort === 'price-asc') orderBy = { price: 'asc' }
    if (sort === 'price-desc') orderBy = { price: 'desc' }

    const [listings, total, statusCounts, activeValue] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        seller: {
          select: {
            username: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    }),
    prisma.marketplaceListing.count({ where }),
    Promise.all([
      prisma.marketplaceListing.count({ where: { deletedAt: null } }),
      prisma.marketplaceListing.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.marketplaceListing.count({ where: { deletedAt: null, status: 'PENDING' } }),
      prisma.marketplaceListing.count({ where: { deletedAt: null, status: 'SOLD' } }),
      prisma.marketplaceListing.count({ where: { deletedAt: null, status: 'REJECTED' } }),
    ]),
    prisma.marketplaceListing.aggregate({
      where: { deletedAt: null, status: 'ACTIVE' },
      _sum: { price: true },
    }),
  ])

  const totalPages = Math.ceil(total / limit)
  const [allCount, activeCount, pendingCount, soldCount, rejectedCount] = statusCounts
  const activeValueSum = activeValue._sum.price || 0

  const buildLink = (params: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (status) sp.set('status', status)
    if (minPrice !== undefined) sp.set('minPrice', String(minPrice))
    if (maxPrice !== undefined) sp.set('maxPrice', String(maxPrice))
    if (sort) sp.set('sort', sort)
    const pageParam = params.page
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined) return
      if (k === 'page') return
      sp.set(k, String(v))
    })
    if (pageParam) sp.set('page', String(pageParam))
    return `/marketplace${sp.toString() ? `?${sp.toString()}` : ''}`
  }

  const statusBadges: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    PENDING: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
    SOLD: 'bg-slate-500/20 text-slate-200 border-slate-500/30',
    REJECTED: 'bg-red-500/20 text-red-200 border-red-500/30',
  }

  return (
    <div className="page-container-default py-3 sm:py-4 md:py-6 overflow-x-hidden">
      {/* Header - Ultra Compact */}
      <div className="mb-3 sm:mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2 sm:mb-3">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 mb-1 w-fit">
              <ShoppingBag className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="text-[10px] font-medium">Alım-Satım</span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 gradient-text">Marketplace</h1>
            <p className="text-xs text-muted-foreground">Standoff 2 oyun içi eşyaları, hesaplar ve daha fazlası</p>
          </div>
          {session && (
            <Link href="/marketplace/create" className="flex-shrink-0 w-full md:w-auto">
              <Button size="sm" className="gap-1.5 w-full md:w-auto min-h-[36px] text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">İlan Oluştur</span>
                <span className="sm:hidden">Yeni</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Quick Stats - Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {[
            { label: 'Toplam', value: allCount },
            { label: 'Aktif', value: activeCount, extra: activeValueSum ? `${activeValueSum.toLocaleString('tr-TR')} ₺` : '' },
            { label: 'Bekliyor', value: pendingCount },
            { label: 'Satıldı', value: soldCount },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50 overflow-hidden">
              <CardContent className="py-1.5 px-2">
                <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                <div className="flex items-end gap-1 mt-0.5">
                  <span className="text-sm font-semibold">{stat.value.toLocaleString('tr-TR')}</span>
                  {stat.extra && <span className="text-[8px] text-muted-foreground">{stat.extra}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sticky Filters */}
      <MarketplaceFilters
        statusCounts={{
          all: allCount,
          active: activeCount,
          pending: pendingCount,
          sold: soldCount,
        }}
      />

      {/* Listings */}
      <MarketplaceListings
        listings={listings}
        statusBadges={statusBadges}
      />

      {/* Empty State */}
      {listings.length === 0 && (
        <div className="text-center py-12 sm:py-16 md:py-20 px-4">
          <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2 break-words">Henüz ilan yok</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 break-words px-4">
            İlk ilanı oluşturmak ister misiniz?
          </p>
          {session && (
            <Link href="/marketplace/create" className="inline-block">
              <Button size="lg" className="gap-2 min-h-[44px]">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                İlan Oluştur
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Pagination - Compact */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 flex-wrap mt-4 sm:mt-6">
          <div className="text-xs text-muted-foreground mr-2">
            Sayfa {page} / {totalPages}
          </div>
          {page > 1 && (
            <Link href={buildLink({ page: page - 1 })}>
              <Button variant="outline" size="sm" className="min-h-[36px] text-xs">Önceki</Button>
            </Link>
          )}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = page <= 3 ? i + 1 : page - 2 + i
            if (pageNum > totalPages) return null
            return (
              <Link key={pageNum} href={buildLink({ page: pageNum })}>
                <Button variant={pageNum === page ? 'default' : 'outline'} size="sm" className="min-h-[36px] min-w-[36px] text-xs">
                  {pageNum}
                </Button>
              </Link>
            )
          })}
          {page < totalPages && (
            <Link href={buildLink({ page: page + 1 })}>
              <Button variant="outline" size="sm" className="min-h-[36px] text-xs">Sonraki</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
  } catch (error) {
    console.error('Marketplace page error:', error)
    return (
      <div className="page-container-default py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bir hata oluştu</h1>
          <p className="text-muted-foreground">Lütfen daha sonra tekrar deneyin.</p>
        </div>
      </div>
    )
  }
}

