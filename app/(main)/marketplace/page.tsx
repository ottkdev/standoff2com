import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { prisma } from '@/lib/db'
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

  const where: any = {
    deletedAt: null,
  }

  if (status !== 'ALL') {
    where.status = status
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

  let orderBy: any = { createdAt: 'desc' }
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
    <div className="container py-8 md:py-10 px-4 md:px-6">
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20 mb-3 md:mb-4">
              <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
              <span className="text-xs md:text-sm font-medium">Alım-Satım</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 gradient-text">
              Marketplace
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
              Standoff 2 oyun içi eşyaları, hesaplar ve daha fazlası
            </p>
          </div>
          {session && (
            <Link href="/marketplace/create" className="flex-shrink-0">
              <Button size="lg" className="gap-2 w-full md:w-auto">
                <Plus className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">İlan Oluştur</span>
                <span className="sm:hidden">Yeni</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Toplam İlan', value: allCount, tone: 'primary' },
            { label: 'Aktif', value: activeCount, tone: 'emerald', extra: activeValueSum ? `${activeValueSum.toLocaleString('tr-TR')} ₺` : '' },
            { label: 'Onay Bekliyor', value: pendingCount, tone: 'amber' },
            { label: 'Satıldı', value: soldCount, tone: 'slate' },
          ].map((stat) => (
            <Card key={stat.label} className="glass-effect border-border/60">
              <CardContent className="py-4 px-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-semibold">{stat.value.toLocaleString('tr-TR')}</span>
                  {stat.extra && <span className="text-xs text-muted-foreground">{stat.extra}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="glass-effect border-primary/20 mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Filter className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-sm">Gelişmiş Filtreler</p>
                  <p className="text-xs text-muted-foreground">Arama, fiyat aralığı, durum ve sıralama</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/marketplace">
                  <Button variant="ghost" size="sm">Sıfırla</Button>
                </Link>
              </div>
            </div>

            <form id="filter-form" className="grid gap-3 md:grid-cols-5" action="/marketplace" method="get">
              <Input
                name="q"
                placeholder="🔍 Arama: başlık veya açıklama"
                defaultValue={q}
                className="md:col-span-2"
              />
              <div className="flex gap-2 md:col-span-2">
                <Input
                  name="minPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Min ₺"
                  defaultValue={minPrice ?? ''}
                />
                <Input
                  name="maxPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Max ₺"
                  defaultValue={maxPrice ?? ''}
                />
              </div>
              <select
                name="sort"
                defaultValue={sort}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="newest">Yeni → Eski</option>
                <option value="price-asc">Fiyat (Artan)</option>
                <option value="price-desc">Fiyat (Azalan)</option>
              </select>
            </form>
            <div className="flex justify-end">
              <Button type="submit" form="filter-form" className="w-full md:w-auto">Filtrele</Button>
            </div>

            <div className="flex flex-wrap gap-2">
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
                  <Link key={s.key} href={href}>
                    <Badge
                      variant={active ? 'default' : 'outline'}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs shadow-sm transition-all',
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
            <div className="flex flex-wrap gap-2">
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
                  <Link key={r.label} href={href}>
                    <Badge
                      variant="outline"
                      className={cn(
                        'cursor-pointer rounded-full px-3 py-1.5 text-xs border-border/70 hover:border-primary/50 hover:text-foreground transition-all shadow-sm',
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
        <div className="text-center py-20">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Henüz ilan yok</h3>
          <p className="text-muted-foreground mb-6">
            İlk ilanı oluşturmak ister misiniz?
          </p>
          {session && (
            <Link href="/marketplace/create">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                İlan Oluştur
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={buildLink({ page: page - 1 })}>
              <Button variant="outline">Önceki</Button>
            </Link>
          )}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = page <= 3 ? i + 1 : page - 2 + i
            if (pageNum > totalPages) return null
            return (
              <Link key={pageNum} href={buildLink({ page: pageNum })}>
                <Button variant={pageNum === page ? 'default' : 'outline'}>
                  {pageNum}
                </Button>
              </Link>
            )
          })}
          {page < totalPages && (
            <Link href={buildLink({ page: page + 1 })}>
              <Button variant="outline">Sonraki</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

