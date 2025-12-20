import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ListingDetailLoading() {
  return (
    <div className="page-container-default py-4 sm:py-6 md:py-8">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[42%_58%]">
        <Skeleton className="aspect-square rounded-lg max-h-[600px]" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

