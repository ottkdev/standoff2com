import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import { ArrowRight, Clock } from 'lucide-react'

interface RecentContentProps {
  type: 'wiki' | 'blog' | 'forum'
  items: Array<{
    id: string
    title: string
    slug: string
    createdAt: Date | string
    category?: {
      name: string
      slug?: string
    }
    author?: {
      username: string
    }
    viewCount?: number
    commentCount?: number
  }>
}

export function RecentContent({ type, items }: RecentContentProps) {
  if (items.length === 0) return null

  const getTypeLabel = () => {
    switch (type) {
      case 'wiki':
        return 'Son Eklenen Makaleler'
      case 'blog':
        return 'Son Blog Yazıları'
      case 'forum':
        return 'Son Açılan Konular'
      default:
        return 'Son Eklenenler'
    }
  }

  const getTypeHref = (slug: string) => {
    switch (type) {
      case 'wiki':
        return `/wiki/${slug}`
      case 'blog':
        return `/blog/${slug}`
      case 'forum':
        return `/forum/topic/${slug}`
      default:
        return '#'
    }
  }

  return (
    <div className="mb-6 sm:mb-8 md:mb-10">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <h2 className="text-base sm:text-lg md:text-xl font-semibold break-words">
            {getTypeLabel()}
          </h2>
        </div>
        <Link
          href={type === 'wiki' ? '/wiki' : type === 'blog' ? '/blog' : '/forum'}
          className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          Tümünü Gör
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {items.slice(0, 6).map((item) => (
          <Card
            key={item.id}
            className="glass-effect hover:border-primary/40 hover:shadow-md transition-all h-full group overflow-hidden"
          >
            <Link href={getTypeHref(item.slug)} className="contents">
              <CardHeader className="pb-2.5 sm:pb-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  {item.category && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 flex-shrink-0">
                      {item.category.name}
                    </Badge>
                  )}
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
                <CardTitle className="text-sm sm:text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors break-words leading-tight">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  {item.author && (
                    <>
                      <span className="truncate">{item.author.username}</span>
                      {(item.viewCount !== undefined || item.commentCount !== undefined) && <span>•</span>}
                    </>
                  )}
                  {item.viewCount !== undefined && (
                    <span>{item.viewCount.toLocaleString('tr-TR')} görüntülenme</span>
                  )}
                  {item.commentCount !== undefined && (
                    <>
                      {item.viewCount !== undefined && <span>•</span>}
                      <span>{item.commentCount} yorum</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Mobile: Stacked Cards - Kompakt */}
      <div className="md:hidden space-y-2">
        {items.slice(0, 10).map((item) => (
          <Card
            key={item.id}
            className="glass-effect hover:border-primary/40 transition-all group"
          >
            <Link href={getTypeHref(item.slug)} className="contents">
              <CardHeader className="pb-2 p-3">
                {/* Top Row: Category + Date - Tek Satır */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                    {item.category && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 h-auto leading-tight flex-shrink-0">
                        {item.category.name}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
                
                {/* Title - Max 2 satır */}
                <CardTitle className="text-xs font-semibold line-clamp-2 group-hover:text-primary transition-colors break-words leading-tight mb-1.5">
                  {item.title}
                </CardTitle>
                
                {/* Bottom Row: Author + Stats - Tek Satır */}
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground flex-wrap">
                  {item.author && (
                    <span className="truncate max-w-[100px]">{item.author.username}</span>
                  )}
                  {item.viewCount !== undefined && (
                    <>
                      {item.author && <span>•</span>}
                      <span className="whitespace-nowrap">👁 {item.viewCount}</span>
                    </>
                  )}
                  {item.commentCount !== undefined && (
                    <>
                      {(item.author || item.viewCount !== undefined) && <span>•</span>}
                      <span className="whitespace-nowrap">💬 {item.commentCount}</span>
                    </>
                  )}
                </div>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default RecentContent

