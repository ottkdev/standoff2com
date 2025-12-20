import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function TicketLoading() {
  return (
    <div className="page-container-narrow py-4 sm:py-6 md:py-8 overflow-x-hidden">
      <Skeleton className="h-6 w-32 mb-4" />
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <Skeleton className="h-20 w-3/4 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

