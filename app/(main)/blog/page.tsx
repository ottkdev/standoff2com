import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/db'
import { formatRelativeTime, cn } from '@/lib/utils'
import { BookOpen, ArrowRight, Calendar, User, Eye, Search, Newspaper, Sparkles } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Standoff 2 Blog - Güncel Haberler, Duyurular ve Rehberler',
  description: 'Standoff 2 için güncel blog yazıları, duyurular, yamalar, turnuvalar ve topluluk rehberleri. Oyunun en son haberlerini buradan takip edin.',
  keywords: 'standoff 2 blog, standoff 2 haberler, standoff 2 duyurular, standoff 2 rehberler',
  openGraph: {
    title: 'Standoff 2 Blog - Güncel Haberler ve Rehberler',
    description: 'Standoff 2 için güncel blog yazıları, duyurular ve rehberler.',
    type: 'website',
  },
}

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
    <div className="container py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-5 lg:px-6 w-full overflow-x-hidden max-w-6xl">
      {/* Hero Section - Kompakt */}
      <div className="text-center mb-4 sm:mb-6 md:mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 sm:px-3 py-1 sm:py-1.5 mb-2 sm:mb-3">
          <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
          <span className="font-medium text-[10px] sm:text-xs break-words">Blog & Haberler</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 gradient-text break-words px-2">
          Standoff 2 Blog
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl mx-auto mb-3 sm:mb-4 break-words px-2">
          Oyunun en güncel haberleri, duyuruları, yamaları ve topluluk rehberleri. 
          Standoff 2 dünyasındaki son gelişmeleri buradan takip edin.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 px-2">
          <Link href="/blog?sort=recent" className="w-full sm:w-auto">
            <Button size="lg" className="gap-1.5 w-full sm:w-auto min-h-[44px] text-sm">
              <Newspaper className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Son Yazılar
            </Button>
          </Link>
          <Link href="/blog?sort=popular" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="gap-1.5 w-full sm:w-auto min-h-[44px] text-sm">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Popüler İçerikler
            </Button>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 px-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/70 px-2.5 sm:px-3 py-1.5 shadow-sm">
            <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium break-words">{total.toLocaleString('tr-TR')} yazı</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/70 px-2.5 sm:px-3 py-1.5 shadow-sm">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium break-words">{categories.length} kategori</span>
          </div>
        </div>
      </div>

      {/* Categories Section - Kompakt */}
      {categories.length > 0 && (
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 break-words">Kategoriler</h2>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">İçerikleri kategoriye göre filtreleyin</p>
            </div>
            <Link href="/blog">
              <Button variant="outline" className="gap-1.5 text-xs sm:text-sm min-h-[44px]">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Tümünü Gör
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center md:justify-start">
            <Link href="/blog" className="min-h-[44px] flex items-center">
              <Badge
                variant={!searchParams.category ? 'default' : 'secondary'}
                className="cursor-pointer hover:bg-primary/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm min-h-[44px] flex items-center"
              >
                Tümü
              </Badge>
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/blog?category=${category.slug}`} className="min-h-[44px] flex items-center">
                <Badge
                  variant={searchParams.category === category.slug ? 'default' : 'secondary'}
                  className="cursor-pointer hover:bg-primary/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm min-h-[44px] flex items-center break-words"
                >
                  {category.name} ({category._count.blogPosts})
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Posts */}
      {pinned.length > 0 && (
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Öne Çıkan Yazılar</h2>
              <p className="text-muted-foreground">En çok okunan ve popüler blog yazıları</p>
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
            {pinned.map((post, idx) => (
              <Card
                key={post.id}
                className={cn(
                  "glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group overflow-hidden",
                  idx === 0 ? "lg:col-span-2" : ""
                )}
              >
                <Link href={`/blog/${post.slug}`} className="contents">
                  {post.coverImage && (
                    <div className="relative aspect-video w-full overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/50 to-transparent" />
                      {post.category && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="text-xs">{post.category.name}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {post.category && !post.coverImage && (
                        <Badge variant="outline" className="text-xs">
                          {post.category.name}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {post.viewCount.toLocaleString('tr-TR')} görüntülenme
                      </span>
                    </div>
                    <CardTitle className={cn(
                      "line-clamp-2 group-hover:text-primary transition-colors",
                      idx === 0 ? "text-xl md:text-2xl" : "text-lg"
                    )}>
                      {post.title}
                    </CardTitle>
                    {post.excerpt && (
                      <CardDescription className={cn("line-clamp-2 mt-2", idx === 0 ? "text-base" : "text-sm")}>
                        {post.excerpt}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{post.author?.username || 'Bilinmeyen'}</span>
                      {post.publishedAt && (
                        <>
                          <span>•</span>
                          <span>{formatRelativeTime(post.publishedAt)}</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {posts.length > 0 && (
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Tüm Yazılar</h2>
              <p className="text-muted-foreground">Blog yazılarının tam listesi</p>
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group overflow-hidden"
              >
                <Link href={`/blog/${post.slug}`} className="contents">
                  {post.coverImage && (
                    <div className="aspect-video w-full overflow-hidden relative">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                      {post.category && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="text-xs">{post.category.name}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {post.category && !post.coverImage && (
                        <Badge variant="outline" className="text-xs">
                          {post.category.name}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {post.viewCount.toLocaleString('tr-TR')} görüntülenme
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    {post.excerpt && (
                      <CardDescription className="line-clamp-2 mt-2 text-sm">
                        {post.excerpt}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="truncate max-w-[120px] md:max-w-none">
                          {post.author.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">{post.viewCount.toLocaleString('tr-TR')}</span>
                        <Calendar className="h-4 w-4 ml-2" />
                        <span className="text-xs">{formatRelativeTime(post.publishedAt || post.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

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
        <div className="flex justify-center gap-1.5 sm:gap-2 mb-8 md:mb-12 flex-wrap">
          {page > 1 && (
            <Link href={`/blog?page=${page - 1}${searchParams.category ? `&category=${searchParams.category}` : ''}`}>
              <Button variant="outline" className="min-h-[44px] text-xs sm:text-sm">Önceki</Button>
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
                <Button variant={pageNum === page ? 'default' : 'outline'} className="min-h-[44px] min-w-[44px] text-xs sm:text-sm">
                  {pageNum}
                </Button>
              </Link>
            )
          })}
          {page < totalPages && (
            <Link href={`/blog?page=${page + 1}${searchParams.category ? `&category=${searchParams.category}` : ''}`}>
              <Button variant="outline" className="min-h-[44px] text-xs sm:text-sm">Sonraki</Button>
            </Link>
          )}
        </div>
      )}

      {/* About Section */}
      <div className="prose prose-invert max-w-none mt-12">
        <Card className="glass-effect">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Blog Hakkında</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Standoff 2 Blog, oyunun en güncel haberlerini, duyurularını ve rehberlerini içeren
              kapsamlı bir içerik platformudur. Burada oyun güncellemeleri, patch notları, turnuva
              duyuruları ve topluluk rehberleri bulabilirsiniz.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Blog içeriğimiz düzenli olarak güncellenmekte ve oyunun en son gelişmelerini yansıtmaktadır.
              Topluluk üyeleri ve deneyimli oyuncular tarafından hazırlanan bu yazılar, hem yeni
              başlayanlar hem de deneyimli oyuncular için değerli bilgiler sunmaktadır.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="font-semibold mb-2">Güncel İçerik</h3>
                <p className="text-sm text-muted-foreground">
                  Oyun güncellemeleri, patch notları ve en son haberler hakkında bilgiler.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Topluluk Rehberleri</h3>
                <p className="text-sm text-muted-foreground">
                  Oyuncular tarafından hazırlanan detaylı rehberler ve taktikler.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

