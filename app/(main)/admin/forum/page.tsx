import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MessageSquare, Pin, Lock, Eye, MessageCircle, TrendingUp } from 'lucide-react'
import { PostActions } from '@/components/admin/PostActions'
import { CategoryManagement } from '@/components/admin/CategoryManagement'
import { formatRelativeTime } from '@/lib/utils'
import { ForumSearchFilters } from '@/components/admin/ForumSearchFilters'

interface PageProps {
  searchParams: {
    search?: string
    category?: string
    page?: string
  }
}

export default async function AdminForumPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const search = searchParams.search || ''
  const category = searchParams.category || 'all'
  const page = parseInt(searchParams.page || '1')
  const perPage = 20
  const skip = (page - 1) * perPage

  const where: any = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (category !== 'all') {
    where.categoryId = category
  }

  const [categories, posts, total, stats, recentPosts] = await Promise.all([
    prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    }),
    prisma.post.findMany({
      where,
      take: perPage,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
    Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { isPinned: true } }),
      prisma.post.count({ where: { isLocked: true } }),
      prisma.comment.count(),
    ]),
    prisma.post.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 gradient-text">Forum Yönetimi</h1>
        <p className="text-muted-foreground">Kategorileri ve konuları yönet</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Konu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sabitlenen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats[1]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kilitli</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats[2]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Yorum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats[3]}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Forum Posts Card */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </span>
              <div>
                <CardTitle>Son Forumlar</CardTitle>
                <CardDescription>En son oluşturulan konular</CardDescription>
              </div>
            </div>
            <Link href="/admin/forum">
              <Button variant="ghost" size="sm">
                Tümünü Gör
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz konu yok</p>
          ) : (
            <div className="space-y-2">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/forum/${post.category?.slug}/${post.slug}`}
                  className="block p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {post.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{post.author.username}</span>
                        {post.category && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                              {post.category.name}
                            </Badge>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatRelativeTime(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                      <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
                        <MessageSquare className="h-3 w-3" />
                        <span>{post._count.comments}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Kategoriler ({categories.length})</CardTitle>
          <CardDescription>Forum kategorilerini yönet</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManagement categories={categories} />
        </CardContent>
      </Card>

      {/* Filters */}
      <ForumSearchFilters searchParams={searchParams} categories={categories} />

      {/* Posts */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Konular</CardTitle>
              <CardDescription>
                {total} konu bulundu • Sayfa {page} / {totalPages}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Konu bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.isPinned && (
                        <Pin className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      )}
                      {post.isLocked && (
                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <Link
                        href={`/forum/${post.category?.slug}/${post.slug}`}
                        className="font-semibold hover:text-primary transition-colors line-clamp-1"
                      >
                        {post.title}
                      </Link>
                      {post.category && (
                        <Badge variant="outline" className="text-xs">
                          {post.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Link
                        href={`/profile/${post.author.username}`}
                        className="hover:text-primary transition-colors"
                      >
                        {post.author.username}
                      </Link>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.viewCount}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{post.commentCount}</span>
                      </div>
                      <span>•</span>
                      <span>{formatRelativeTime(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/forum/${post.category?.slug}/${post.slug}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Görüntüle
                      </Button>
                    </Link>
                    <PostActions post={post} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                {skip + 1}-{Math.min(skip + perPage, total)} / {total}
              </div>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/forum?${new URLSearchParams({
                      ...searchParams,
                      page: (page - 1).toString(),
                    }).toString()}`}
                  >
                    <Button variant="outline" size="sm">Önceki</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/forum?${new URLSearchParams({
                      ...searchParams,
                      page: (page + 1).toString(),
                    }).toString()}`}
                  >
                    <Button variant="outline" size="sm">Sonraki</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
