import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function BlogPostLoading() {
  return (
    <div className="page-container-default py-6 md:py-10 overflow-x-hidden">
      <Skeleton className="h-6 w-32 mb-4" />
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="aspect-video w-full mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

