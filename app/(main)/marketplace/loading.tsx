import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function MarketplaceLoading() {
  return (
    <div className="page-container-default py-3 sm:py-4 md:py-6">
      {/* Header Skeleton */}
      <div className="mb-3 sm:mb-4">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-8 w-48 mb-1" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <div className="p-1.5">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-20" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="mb-4">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>

      {/* Listings Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5 md:gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="w-full h-[180px] sm:h-[200px] md:h-[220px]" />
            <div className="p-2 sm:p-2.5 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
