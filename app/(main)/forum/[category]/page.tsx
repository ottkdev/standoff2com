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
    <div className="container py-4 sm:py-6 md:py-8 lg:py-10 px-4 md:px-6 w-full overflow-x-hidden">
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

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="glass-effect hover:border-primary/50 transition-colors">
            <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {post.isPinned && (
                      <Pin className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    )}
                    {post.isLocked && (
                      <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <CardTitle className="text-base md:text-lg break-words">
                      <Link
                        href={`/forum/topic/${post.id}`}
                        className="hover:text-primary break-words"
                      >
                        {post.title}
                      </Link>
                    </CardTitle>
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                    <Link
                      href={`/profile/${post.author.username}`}
                      className="hover:text-primary truncate"
                    >
                      {post.author.username}
                    </Link>
                    <span className="hidden sm:inline">•</span>
                    <span className="whitespace-nowrap">{formatRelativeTime(post.createdAt)}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                <span className="whitespace-nowrap">👁 {post.viewCount.toLocaleString('tr-TR')}</span>
                <span className="whitespace-nowrap">💬 {post._count.comments}</span>
                <span className="whitespace-nowrap">❤️ {post._count.likes}</span>
              </div>
            </CardContent>
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

