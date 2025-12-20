import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ChatLoading() {
  return (
    <div className="page-container-narrow py-6 md:py-10 overflow-x-hidden">
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="h-[500px] p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <Skeleton className="h-16 w-3/4 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

