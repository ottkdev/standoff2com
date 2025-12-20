'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Filter, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarketplaceFiltersProps {
  statusCounts: {
    all: number
    active: number
    pending: number
    sold: number
  }
}

function MarketplaceFilters({ statusCounts }: MarketplaceFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const q = searchParams.get('q') || ''
  const status = searchParams.get('status') || 'ACTIVE'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const sort = searchParams.get('sort') || 'newest'

  const handleFilter = (formData: FormData) => {
    const params = new URLSearchParams()
    const newQ = formData.get('q')?.toString() || ''
    const newMinPrice = formData.get('minPrice')?.toString() || ''
    const newMaxPrice = formData.get('maxPrice')?.toString() || ''
    const newSort = formData.get('sort')?.toString() || 'newest'

    if (newQ) params.set('q', newQ)
    if (newMinPrice) params.set('minPrice', newMinPrice)
    if (newMaxPrice) params.set('maxPrice', newMaxPrice)
    if (newSort) params.set('sort', newSort)
    if (status !== 'ACTIVE') params.set('status', status)
    params.set('page', '1')

    router.push(`/marketplace?${params.toString()}`)
    setIsMobileOpen(false)
  }

  const handleStatusChange = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('status', newStatus)
    params.set('page', '1')
    router.push(`/marketplace?${params.toString()}`)
  }

  const handlePriceRange = (min: number, max?: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('minPrice', String(min))
    if (max !== undefined) params.set('maxPrice', String(max))
    else params.delete('maxPrice')
    params.set('page', '1')
    router.push(`/marketplace?${params.toString()}`)
  }

  const resetFilters = () => {
    router.push('/marketplace')
    setIsMobileOpen(false)
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    handleFilter(formData)
  }

  const filterContent = (
    <form onSubmit={handleFormSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Input
          name="q"
          placeholder="🔍 Arama"
          defaultValue={q}
          className="sm:col-span-2 lg:col-span-2"
        />
        <Input
          name="minPrice"
          type="number"
          min={0}
          placeholder="Min ₺"
          defaultValue={minPrice}
        />
        <Input
          name="maxPrice"
          type="number"
          min={0}
          placeholder="Max ₺"
          defaultValue={maxPrice}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="sort"
          defaultValue={sort}
          className="h-9 min-h-[36px] rounded-md border border-border bg-background px-3 text-xs"
        >
          <option value="newest">Yeni → Eski</option>
          <option value="price-asc">Fiyat (Artan)</option>
          <option value="price-desc">Fiyat (Azalan)</option>
        </select>
        <Button type="submit" size="sm" className="min-h-[36px] text-xs">
          Filtrele
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="min-h-[36px] text-xs">
          Sıfırla
        </Button>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { key: 'ALL', label: 'Tümü', count: statusCounts.all },
          { key: 'ACTIVE', label: 'Aktif', count: statusCounts.active },
          { key: 'PENDING', label: 'Bekliyor', count: statusCounts.pending },
          { key: 'SOLD', label: 'Satıldı', count: statusCounts.sold },
        ].map((s) => {
          const isActive = status === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => handleStatusChange(s.key)}
              className="min-h-[36px]"
            >
              <Badge
                variant={isActive ? 'default' : 'outline'}
                className={cn(
                  'rounded-full px-2.5 py-1.5 text-xs shadow-sm transition-all min-h-[36px] flex items-center gap-1',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-primary/30'
                    : 'border-border/70 hover:border-primary/50'
                )}
              >
                {s.label}
                {s.count > 0 && (
                  <span className="text-[10px] opacity-70">({s.count})</span>
                )}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Quick Price Ranges */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: '0 - 500₺', min: 0, max: 500 },
          { label: '500 - 2000₺', min: 500, max: 2000 },
          { label: '2000₺+', min: 2000, max: undefined },
        ].map((r) => {
          const isActive = minPrice === String(r.min) && (r.max === undefined ? !maxPrice : maxPrice === String(r.max))
          return (
            <button
              key={r.label}
              type="button"
              onClick={() => handlePriceRange(r.min, r.max)}
              className="min-h-[36px]"
            >
              <Badge
                variant="outline"
                className={cn(
                  'cursor-pointer rounded-full px-2.5 py-1.5 text-xs border-border/70 hover:border-primary/50 transition-all shadow-sm min-h-[36px] flex items-center',
                  isActive ? 'bg-primary/10 border-primary/50 text-primary' : ''
                )}
              >
                {r.label}
              </Badge>
            </button>
          )
        })}
      </div>
    </form>
  )

  return (
    <>
      {/* Desktop: Sticky Filter Bar */}
      <div className="hidden md:block sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 mb-4">
        <Card className="border-0 shadow-sm rounded-none">
          <CardContent className="py-3">
            {filterContent}
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Filter Button + Drawer */}
      <div className="md:hidden mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(true)}
          className="w-full min-h-[44px] gap-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filtreler</span>
          {(q || minPrice || maxPrice || status !== 'ACTIVE') && (
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0.5">
              Aktif
            </Badge>
          )}
        </Button>

        {/* Mobile Drawer */}
        {isMobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-lg max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-background border-b border-border p-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Filtreler</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                {filterContent}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default MarketplaceFilters
export { MarketplaceFilters }
