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
    <div className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground">{category.description}</p>
          )}
        </div>
        <Link href={`/forum/${params.category}/create`}>
          <Button>Yeni Konu Aç</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="glass-effect hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.isPinned && (
                      <Pin className="h-4 w-4 text-yellow-500" />
                    )}
                    {post.isLocked && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <CardTitle className="text-lg">
                      <Link
                        href={`/forum/topic/${post.id}`}
                        className="hover:text-primary"
                      >
                        {post.title}
                      </Link>
                    </CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <Link
                      href={`/profile/${post.author.username}`}
                      className="hover:text-primary"
                    >
                      {post.author.username}
                    </Link>
                    <span>•</span>
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>👁 {post.viewCount}</span>
                <span>💬 {post._count.comments}</span>
                <span>❤️ {post._count.likes}</span>
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

