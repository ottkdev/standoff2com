import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/db'
import { formatRelativeTime, cn } from '@/lib/utils'
import { BookOpen, ArrowRight, Calendar, User, Eye } from 'lucide-react'

interface PageProps {
  searchParams: {
    page?: string
    category?: string
  }
}

export default async function BlogPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const limit = 12
  const skip = (page - 1) * limit

  const where: any = {
    isPublished: true,
  }

  if (searchParams.category) {
    const category = await prisma.category.findUnique({
      where: { slug: searchParams.category },
    })
    if (category) {
      where.categoryId = category.id
    }
  }

  let orderBy: any = { publishedAt: 'desc' }

  const [posts, total, categories, pinned] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
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
    prisma.blogPost.count({ where }),
    prisma.category.findMany({
      where: {
        blogPosts: {
          some: {
            isPublished: true,
          },
        },
      },
      include: {
        _count: {
          select: {
            blogPosts: {
              where: {
                isPublished: true,
              },
            },
          },
        },
      },
    }),
    prisma.blogPost.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: 3,
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
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

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container py-6 md:py-8 lg:py-10 px-4 md:px-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-8 md:mb-12 text-center relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10 px-4 py-8 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.18),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(251,146,60,0.14),transparent_40%)]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6">
            <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
            <span className="text-xs md:text-sm font-medium">Blog & Haberler</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 gradient-text">
            Blog & Haberler
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto px-4 break-words">
            Standoff 2 için güncel duyurular, yamalar, turnuvalar ve topluluk rehberleri.
          </p>
        </div>
      </div>

      {/* Pinned / Featured */}
      {pinned.length > 0 && (
        <div className="mb-8 md:mb-10 grid gap-4 lg:grid-cols-3">
          {pinned.map((post, idx) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
              <Card className={cn(
                "overflow-hidden h-full glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all",
                idx === 0 ? "lg:col-span-2" : ""
              )}>
                {post.coverImage && (
                  <div className="relative">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className={cn("w-full object-cover", idx === 0 ? "h-64 md:h-80" : "h-48")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
                    {post.category && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">{post.category.name}</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <p className="text-xs text-muted-foreground">Öne çıkan</p>
                      <p className="text-lg font-semibold">{post.title}</p>
                    </div>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mb-6 md:mb-8 flex flex-wrap gap-2 justify-center">
          <Link href="/blog">
            <Badge
              variant={!searchParams.category ? 'default' : 'secondary'}
              className="cursor-pointer hover:bg-primary/20 rounded-full px-3 py-1.5 text-xs shadow-sm"
            >
              Tümü
            </Badge>
          </Link>
          {categories.map((category) => (
            <Link key={category.id} href={`/blog?category=${category.slug}`}>
              <Badge
                variant={searchParams.category === category.slug ? 'default' : 'secondary'}
                className="cursor-pointer hover:bg-primary/20 rounded-full px-3 py-1.5 text-xs shadow-sm"
              >
                {category.name} ({category._count.blogPosts})
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8 md:mb-12">
        {posts.map((post) => (
            <Card
              key={post.id}
              className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all overflow-hidden group"
            >
            {post.coverImage ? (
              <div className="aspect-video w-full overflow-hidden relative">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                {post.category ? (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">{post.category.name}</Badge>
                  </div>
                ) : null}
              </div>
            ) : null}
            <CardHeader className="pb-3">
              <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-base md:text-lg">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </CardTitle>
              <CardDescription className="line-clamp-2 text-sm">
                {post.excerpt || 'Yazı özeti yok'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <Link href={`/profile/${post.author.username}`} className="hover:text-primary truncate max-w-[100px] md:max-w-none">
                    {post.author.username}
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="text-xs">{post.viewCount.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="text-xs">{formatRelativeTime(post.publishedAt || post.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Henüz blog yazısı yok</h3>
          <p className="text-muted-foreground">Yakında yeni içerikler eklenecek!</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/blog?page=${page - 1}${searchParams.category ? `&category=${searchParams.category}` : ''}`}>
              <Button variant="outline">Önceki</Button>
            </Link>
          )}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = page <= 3 ? i + 1 : page - 2 + i
            if (pageNum > totalPages) return null
            return (
              <Link
                key={pageNum}
                href={`/blog?page=${pageNum}${searchParams.category ? `&category=${searchParams.category}` : ''}`}
              >
                <Button variant={pageNum === page ? 'default' : 'outline'}>
                  {pageNum}
                </Button>
              </Link>
            )
          })}
          {page < totalPages && (
            <Link href={`/blog?page=${page + 1}${searchParams.category ? `&category=${searchParams.category}` : ''}`}>
              <Button variant="outline">Sonraki</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

