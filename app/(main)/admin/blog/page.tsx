import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Plus, Edit, Eye, Heart, MessageSquare } from 'lucide-react'
import { BlogDeleteButton } from '@/components/admin/BlogDeleteButton'
import { formatRelativeTime } from '@/lib/utils'
import { BlogSearchFilters } from '@/components/admin/BlogSearchFilters'
import Image from 'next/image'

interface PageProps {
  searchParams: {
    search?: string
    status?: string
    category?: string
    page?: string
  }
}

export default async function AdminBlogPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const search = searchParams.search || ''
  const status = searchParams.status || 'all'
  const category = searchParams.category || 'all'
  const page = parseInt(searchParams.page || '1')
  const perPage = 20
  const skip = (page - 1) * perPage

  const where: {
    title?: { contains: string; mode: 'insensitive' }
    isPublished?: boolean
    categoryId?: string
  } = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status === 'published') {
    where.isPublished = true
  } else if (status === 'draft') {
    where.isPublished = false
  }

  if (category !== 'all') {
    where.categoryId = category
  }

  const [posts, total, stats, categories, recentPosts] = await Promise.all([
    prisma.blogPost.findMany({
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
    prisma.blogPost.count({ where }),
    Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { isPublished: true } }),
      prisma.blogPost.count({ where: { isPublished: false } }),
    ]),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.blogPost.findMany({
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
      },
    }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 gradient-text">Blog Yönetimi</h1>
          <p className="text-muted-foreground">Blog yazılarını oluştur, düzenle ve yönet</p>
        </div>
        <Link href="/admin/blog/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Yazı
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yayınlanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats[1]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taslak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats[2]}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Blog Posts Card */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </span>
              <div>
                <CardTitle>Son Bloglar</CardTitle>
                <CardDescription>En son oluşturulan blog yazıları</CardDescription>
              </div>
            </div>
            <Link href="/admin/blog">
              <Button variant="ghost" size="sm">
                Tümünü Gör
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz blog yazısı yok</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block h-full"
                >
                  <Card className="hover:border-primary/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all h-full flex flex-col overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-amber-400 to-orange-500" />
                    <CardHeader className="pb-2 flex-shrink-0">
                      {post.category && (
                        <Badge variant="secondary" className="w-fit mb-2 text-xs">
                          {post.category.name}
                        </Badge>
                      )}
                      <CardTitle className="text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col">
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-shrink-0">
                        {post.excerpt || 'Yazı özeti yok'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {post.author.avatarUrl ? (
                            <Image src={post.author.avatarUrl} alt={post.author.username} width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold text-primary">
                              {post.author.username[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="hover:text-primary transition-colors truncate flex-1 min-w-0">
                          {post.author.username}
                        </span>
                        <span>•</span>
                        <span className="whitespace-nowrap">{formatRelativeTime(post.publishedAt || post.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <BlogSearchFilters searchParams={searchParams} categories={categories} />

      {/* Posts */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blog Yazıları</CardTitle>
              <CardDescription>
                {total} yazı bulundu • Sayfa {page} / {totalPages}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Blog yazısı bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
                >
                  {post.coverImage ? (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="font-semibold hover:text-primary transition-colors line-clamp-1"
                      >
                        {post.title}
                      </Link>
                      {post.isPublished ? (
                        <Badge variant="default" className="text-xs">Yayınlandı</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Taslak</Badge>
                      )}
                      {post.category && (
                        <Badge variant="outline" className="text-xs">
                          {post.category.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {post.excerpt || 'Açıklama yok'}
                    </p>
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
                        <Heart className="h-3 w-3" />
                        <span>{post.likeCount}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{post.commentCount}</span>
                      </div>
                      <span>•</span>
                      <span>{formatRelativeTime(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Görüntüle
                      </Button>
                    </Link>
                    <Link href={`/admin/blog/${post.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Düzenle
                      </Button>
                    </Link>
                    <BlogDeleteButton postId={post.id} />
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
                    href={`/admin/blog?${new URLSearchParams({
                      ...searchParams,
                      page: (page - 1).toString(),
                    }).toString()}`}
                  >
                    <Button variant="outline" size="sm">Önceki</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/blog?${new URLSearchParams({
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
