import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function HomeLoading() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Hero Section Skeleton */}
      <section className="relative overflow-hidden border-b border-border/60 w-full">
        <div className="container relative z-10 max-w-6xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-6 sm:py-8 md:py-10 lg:py-12 w-full">
          <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-[1.2fr,1fr] items-center">
            <div className="space-y-3 sm:space-y-4 w-full min-w-0">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-12 w-full max-w-2xl" />
              <Skeleton className="h-6 w-full max-w-xl" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-11 w-32" />
                <Skeleton className="h-11 w-32" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* Quick Actions Skeleton */}
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-6 md:py-8 w-full">
        <div className="grid gap-2 sm:gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="page-container-default pb-4 sm:pb-6 md:pb-8 overflow-x-hidden">
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full">
            <div className="lg:col-span-2 w-full min-w-0">
              <Card>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}

