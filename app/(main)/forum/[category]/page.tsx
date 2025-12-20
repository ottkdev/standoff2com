import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ForumService } from '@/lib/services/forum.service'
import { prisma } from '@/lib/db'
import { formatRelativeTime } from '@/lib/utils'
import { Pin, Lock } from 'lucide-react'

interface PageProps {
  params: {
    category: string
  }
  searchParams: {
    page?: string
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const category = await prisma.category.findUnique({
    where: { slug: params.category },
  })

  if (!category) {
    notFound()
  }

  const page = parseInt(searchParams.page || '1')
  const { posts, total, pages } = await ForumService.getPostsByCategory(category.id, page)

  return (
    <div className="page-container-default py-4 sm:py-6 md:py-8 lg:py-10 overflow-x-hidden">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground text-sm md:text-base break-words">{category.description}</p>
          )}
        </div>
        <Link href={`/forum/${params.category}/create`} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px]">Yeni Konu Aç</Button>
        </Link>
      </div>

      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="glass-effect hover:border-primary/50 transition-colors">
            <Link href={`/forum/topic/${post.id}`} className="contents">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                {/* Top Row: Icons + Category Badge - Tek Satır */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  {post.isPinned && (
                    <Pin className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                  )}
                  {post.isLocked && (
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0.5 h-auto leading-tight">
                    {category.name}
                  </Badge>
                </div>
                
                {/* Title - Max 2 satır */}
                <CardTitle className="text-sm sm:text-base md:text-lg break-words line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-tight">
                  {post.title}
                </CardTitle>
                
                {/* Middle Row: Author + Date - Tek Satır */}
                <div className="flex items-center gap-1.5 mb-2 text-[10px] sm:text-xs text-muted-foreground">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="hover:text-primary truncate max-w-[120px] sm:max-w-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {post.author.username}
                  </Link>
                  <span>•</span>
                  <span className="whitespace-nowrap">{formatRelativeTime(post.createdAt)}</span>
                </div>
                
                {/* Bottom Row: Stats - Tek Satır */}
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                  <span className="whitespace-nowrap">👁 {post.viewCount.toLocaleString('tr-TR')}</span>
                  <span className="whitespace-nowrap">💬 {post._count.comments}</span>
                  <span className="whitespace-nowrap">❤️ {post._count.likes}</span>
                </div>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Henüz konu açılmamış</p>
          <Link href={`/forum/${params.category}/create`}>
            <Button>İlk Konuyu Aç</Button>
          </Link>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((pageNum) => (
            <Link
              key={pageNum}
              href={`/forum/${params.category}?page=${pageNum}`}
            >
              <Button
                variant={pageNum === page ? 'default' : 'outline'}
                size="sm"
              >
                {pageNum}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

