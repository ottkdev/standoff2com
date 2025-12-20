import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { prisma } from '@/lib/db'
import { Prisma, MarketplaceStatus } from '@prisma/client'
import { formatRelativeTime, cn } from '@/lib/utils'
import { ShoppingBag, Plus, ArrowRight, Tag, User, Filter } from 'lucide-react'
import dynamic from 'next/dynamic'

const MarketplaceListings = dynamic(
  () => import('@/components/marketplace/MarketplaceListings').then((mod) => ({ default: mod.MarketplaceListings })),
  { ssr: false }
)

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
    <div className="page-container-default py-4 sm:py-6 md:py-8 overflow-x-hidden">
      {/* Header - Kompakt */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-1.5 sm:mb-2 w-fit">
              <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium break-words">Alım-Satım</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1.5 sm:mb-2 gradient-text break-words">
              Marketplace
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground break-words">
              Standoff 2 oyun içi eşyaları, hesaplar ve daha fazlası
            </p>
          </div>
          {session && (
            <Link href="/marketplace/create" className="flex-shrink-0 w-full md:w-auto">
              <Button size="lg" className="gap-1.5 w-full md:w-auto min-h-[44px] text-sm">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">İlan Oluştur</span>
                <span className="sm:hidden">Yeni</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Quick Stats - Kompakt */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { label: 'Toplam İlan', value: allCount, tone: 'primary' },
            { label: 'Aktif', value: activeCount, tone: 'emerald', extra: activeValueSum ? `${activeValueSum.toLocaleString('tr-TR')} ₺` : '' },
            { label: 'Onay Bekliyor', value: pendingCount, tone: 'amber' },
            { label: 'Satıldı', value: soldCount, tone: 'slate' },
          ].map((stat) => (
            <Card key={stat.label} className="glass-effect border-border/60 overflow-hidden">
              <CardContent className="py-2 sm:py-2.5 px-2 sm:px-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground break-words">{stat.label}</p>
                <div className="flex items-end gap-1 mt-0.5 flex-wrap">
                  <span className="text-lg sm:text-xl font-semibold break-words">{stat.value.toLocaleString('tr-TR')}</span>
                  {stat.extra && <span className="text-[9px] sm:text-[10px] text-muted-foreground break-words">{stat.extra}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Advanced Filters - Kompakt */}
      <Card className="glass-effect border-primary/20 mb-4 sm:mb-6 overflow-hidden">
        <CardContent className="pt-3 sm:pt-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-xs sm:text-sm break-words">Gelişmiş Filtreler</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground break-words">Arama, fiyat aralığı, durum ve sıralama</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href="/marketplace">
                  <Button variant="ghost" size="sm" className="min-h-[44px] text-xs sm:text-sm">Sıfırla</Button>
                </Link>
              </div>
            </div>

            <form id="filter-form" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4" action="/marketplace" method="get">
              <Input
                name="q"
                placeholder="🔍 Arama: başlık veya açıklama"
                defaultValue={q}
                className="sm:col-span-2 lg:col-span-2"
              />
              <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
                <Input
                  name="minPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Min ₺"
                  defaultValue={minPrice ?? ''}
                  className="flex-1"
                />
                <Input
                  name="maxPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Max ₺"
                  defaultValue={maxPrice ?? ''}
                  className="flex-1"
                />
              </div>
              <select
                name="sort"
                defaultValue={sort}
                className="h-10 min-h-[44px] w-full rounded-md border border-border bg-background px-3 text-sm sm:col-span-2 lg:col-span-1"
              >
                <option value="newest">Yeni → Eski</option>
                <option value="price-asc">Fiyat (Artan)</option>
                <option value="price-desc">Fiyat (Azalan)</option>
              </select>
            </form>
            <div className="flex justify-end">
              <Button type="submit" form="filter-form" className="w-full sm:w-auto min-h-[44px]">Filtrele</Button>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 break-words">
              {[
                { key: 'ALL', label: 'Tümü' },
                { key: 'ACTIVE', label: 'Aktif' },
                { key: 'PENDING', label: 'Onay Bekliyor' },
                { key: 'SOLD', label: 'Satıldı' },
                { key: 'REJECTED', label: 'Reddedildi' },
              ].map((s) => {
                const active = status === s.key
                const sp = new URLSearchParams(searchParams as any)
                sp.set('status', s.key)
                sp.set('page', '1')
                const href = `/marketplace?${sp.toString()}`
                return (
                  <Link key={s.key} href={href} className="min-h-[44px] flex items-center">
                    <Badge
                      variant={active ? 'default' : 'outline'}
                      className={cn(
                        'rounded-full px-2.5 sm:px-3 py-1.5 text-xs shadow-sm transition-all min-h-[44px] flex items-center',
                        active
                          ? 'bg-primary text-primary-foreground shadow-primary/30 hover:shadow-primary/40'
                          : 'border-border/70 hover:border-primary/50 hover:text-foreground'
                      )}
                    >
                      {s.label}
                    </Badge>
                  </Link>
                )
              })}
            </div>

            {/* Price quick ranges */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 break-words">
              {[
                { label: '0 - 500₺', min: 0, max: 500 },
                { label: '500 - 2000₺', min: 500, max: 2000 },
                { label: '2000₺+', min: 2000, max: undefined },
              ].map((r) => {
                const sp = new URLSearchParams(searchParams as any)
                sp.set('minPrice', String(r.min))
                if (r.max !== undefined) sp.set('maxPrice', String(r.max))
                else sp.delete('maxPrice')
                sp.set('page', '1')
                const href = `/marketplace?${sp.toString()}`
                const isActive =
                  (minPrice ?? '') === r.min && (maxPrice ?? '') === (r.max ?? '')
                return (
                  <Link key={r.label} href={href} className="min-h-[44px] flex items-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        'cursor-pointer rounded-full px-2.5 sm:px-3 py-1.5 text-xs border-border/70 hover:border-primary/50 hover:text-foreground transition-all shadow-sm min-h-[44px] flex items-center',
                        isActive ? 'bg-primary/10 border-primary/50 text-primary' : ''
                      )}
                    >
                      {r.label}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
          {page > 1 && (
            <Link href={buildLink({ page: page - 1 })}>
              <Button variant="outline" className="min-h-[44px] text-xs sm:text-sm">Önceki</Button>
            </Link>
          )}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = page <= 3 ? i + 1 : page - 2 + i
            if (pageNum > totalPages) return null
            return (
              <Link key={pageNum} href={buildLink({ page: pageNum })}>
                <Button variant={pageNum === page ? 'default' : 'outline'} className="min-h-[44px] min-w-[44px] text-xs sm:text-sm">
                  {pageNum}
                </Button>
              </Link>
            )
          })}
          {page < totalPages && (
            <Link href={buildLink({ page: page + 1 })}>
              <Button variant="outline" className="min-h-[44px] text-xs sm:text-sm">Sonraki</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

