import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/db'
import { formatRelativeTime, cn } from '@/lib/utils'
import { BookOpen, ArrowRight, Search, Newspaper, Sparkles } from 'lucide-react'
import { Metadata } from 'next'
import { RecentContent } from '@/components/shared/RecentContent'

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

  const where: {
    isPublished: true
    categoryId?: string
  } = {
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

  let orderBy: { publishedAt?: 'desc' | 'asc'; viewCount?: 'desc' | 'asc' } = { publishedAt: 'desc' }

  // Get recent posts for "Son Eklenenler"
  let recentPosts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | null
    createdAt: Date
    viewCount: number
    author: { username: string; avatarUrl: string | null; isVerified: boolean }
    category: { name: string; slug: string } | null
  }> = []
  try {
    recentPosts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      take: 10,
      orderBy: { publishedAt: 'desc' },
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
    })
  } catch (error) {
    console.error('Error fetching recent blog posts:', error)
  }

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
    <div className="page-container-default py-6 md:py-8 lg:py-12 overflow-x-hidden">
      {/* Hero Section */}
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary/10 text-primary px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 mb-3 sm:mb-4 md:mb-6">
          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
          <span className="font-medium text-[10px] sm:text-xs md:text-sm break-words">Blog & Haberler</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 gradient-text break-words px-2">
          Standoff 2 Blog
        </h1>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto mb-4 sm:mb-5 md:mb-6 break-words px-2">
          Oyunun en güncel haberleri, duyuruları, yamaları ve topluluk rehberleri. 
          Standoff 2 dünyasındaki son gelişmeleri buradan takip edin.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 px-2">
          <Link href="/blog?sort=recent" className="w-full sm:w-auto">
            <Button size="lg" className="gap-1.5 sm:gap-2 w-full sm:w-auto min-h-[44px] text-sm">
              <Newspaper className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              Son Yazılar
            </Button>
          </Link>
          <Link href="/blog?sort=popular" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="gap-1.5 sm:gap-2 w-full sm:w-auto min-h-[44px] text-sm">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              Popüler İçerikler
            </Button>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 md:mt-5 px-2">
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

      {/* Son Eklenenler */}
      {recentPosts.length > 0 && (
        <RecentContent
          type="blog"
          items={recentPosts.map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            createdAt: post.publishedAt || post.createdAt,
            category: post.category ? {
              name: post.category.name,
              slug: post.category.slug,
            } : undefined,
            author: post.author,
            viewCount: post.viewCount,
          }))}
        />
      )}

      {/* Categories Grid - Wiki style */}
      {categories.length > 0 && (
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 break-words">Kategoriler</h2>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">İçerikleri kategoriye göre filtreleyin</p>
            </div>
            <Link href="/blog">
              <Button variant="outline" className="gap-2 text-xs sm:text-sm min-h-[44px]">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Tümünü Ara</span>
                <span className="sm:hidden">Ara</span>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            <Card className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group overflow-hidden">
              <Link href="/blog" className="contents h-full flex flex-col">
                <CardHeader className="pb-2.5 sm:pb-3">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="p-2.5 sm:p-3 rounded-lg bg-primary/10 border-primary/20 border group-hover:scale-110 transition-transform flex-shrink-0">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    {total > 0 && (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                        {total} yazı
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg sm:text-xl mb-2 group-hover:text-primary transition-colors break-words">
                    Tümü
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed break-words">
                    Tüm blog yazılarını görüntüleyin
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center gap-2 text-primary text-xs sm:text-sm font-medium group-hover:gap-3 transition-all">
                    <span className="break-words">Keşfet</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  </div>
                </CardContent>
              </Link>
            </Card>
            {categories.map((category) => {
              let Icon = BookOpen
              let color = 'text-blue-500'
              let bg = 'bg-blue-500/10'
              let border = 'border-blue-500/20'

              if (category.name.toLowerCase().includes('haber') || category.name.toLowerCase().includes('duyuru')) {
                Icon = Newspaper
                color = 'text-orange-500'
                bg = 'bg-orange-500/10'
                border = 'border-orange-500/20'
              } else if (category.name.toLowerCase().includes('rehber')) {
                Icon = BookOpen
                color = 'text-green-500'
                bg = 'bg-green-500/10'
                border = 'border-green-500/20'
              }

              return (
                <Card key={category.id} className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group overflow-hidden">
                  <Link href={`/blog?category=${category.slug}`} className="contents h-full flex flex-col">
                    <CardHeader className="pb-2.5 sm:pb-3">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className={`p-2.5 sm:p-3 rounded-lg ${bg} ${border} border group-hover:scale-110 transition-transform flex-shrink-0`}>
                          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
                        </div>
                        {category._count.blogPosts > 0 && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                            {category._count.blogPosts} yazı
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg sm:text-xl mb-2 group-hover:text-primary transition-colors break-words">
                        {category.name}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm leading-relaxed break-words">
                        {category.description || 'Blog yazıları ve içerikler'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="flex items-center gap-2 text-primary text-xs sm:text-sm font-medium group-hover:gap-3 transition-all">
                        <span className="break-words">Keşfet</span>
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Featured Posts - Wiki style */}
      {pinned.length > 0 && (
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 break-words">Popüler Yazılar</h2>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">En çok okunan blog yazıları</p>
            </div>
            <Link href="/blog">
              <Button variant="outline" className="gap-2 text-xs sm:text-sm min-h-[44px]">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Tümünü Ara</span>
                <span className="sm:hidden">Ara</span>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5 lg:gap-6">
            {pinned.map((post) => (
              <Card
                key={post.id}
                className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group overflow-hidden"
              >
                <Link href={`/blog/${post.slug}`} className="contents">
                  <CardHeader className="pb-2 sm:pb-2.5 md:pb-3 p-3 sm:p-4 md:p-6">
                    {/* Top Row: Category + Views - Tek Satır */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                        {post.category && (
                          <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5 h-auto leading-tight">
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        👁 {post.viewCount.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    
                    {/* Title - Max 2 satır */}
                    <CardTitle className="text-sm sm:text-base md:text-lg line-clamp-2 group-hover:text-primary transition-colors break-words leading-tight mb-1.5 sm:mb-2">
                      {post.title}
                    </CardTitle>
                    
                    {/* Excerpt - Max 2 satır (opsiyonel) */}
                    {post.excerpt && (
                      <CardDescription className="line-clamp-2 text-[10px] sm:text-xs md:text-sm leading-relaxed mb-1.5 sm:mb-2">
                        {post.excerpt}
                      </CardDescription>
                    )}
                    
                    {/* Bottom Row: Author + Date - Tek Satır */}
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                      <span className="truncate max-w-[100px] sm:max-w-none">{post.author?.username || 'Bilinmeyen'}</span>
                      {post.publishedAt && (
                        <>
                          <span>•</span>
                          <span className="whitespace-nowrap">{new Date(post.publishedAt).toLocaleDateString('tr-TR')}</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Posts Grid - Wiki style (only shown if there are more posts than featured) */}
      {posts.length > pinned.length && (
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 break-words">Tüm Yazılar</h2>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">Blog yazılarının tam listesi</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5 lg:gap-6">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group overflow-hidden"
              >
                <Link href={`/blog/${post.slug}`} className="contents">
                  <CardHeader className="pb-2 sm:pb-2.5 md:pb-3 p-3 sm:p-4 md:p-6">
                    {/* Top Row: Category + Views - Tek Satır */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                        {post.category && (
                          <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5 h-auto leading-tight">
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        👁 {post.viewCount.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    
                    {/* Title - Max 2 satır */}
                    <CardTitle className="text-sm sm:text-base md:text-lg line-clamp-2 group-hover:text-primary transition-colors break-words leading-tight mb-1.5 sm:mb-2">
                      {post.title}
                    </CardTitle>
                    
                    {/* Excerpt - Max 2 satır (opsiyonel) */}
                    {post.excerpt && (
                      <CardDescription className="line-clamp-2 text-[10px] sm:text-xs md:text-sm leading-relaxed mb-1.5 sm:mb-2">
                        {post.excerpt}
                      </CardDescription>
                    )}
                    
                    {/* Bottom Row: Author + Date - Tek Satır */}
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                      <span className="truncate max-w-[100px] sm:max-w-none">{post.author.username}</span>
                      {post.publishedAt && (
                        <>
                          <span>•</span>
                          <span className="whitespace-nowrap">{new Date(post.publishedAt).toLocaleDateString('tr-TR')}</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
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
      <div className="prose prose-invert max-w-none mt-8 sm:mt-10 md:mt-12">
        <Card className="glass-effect">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">Blog Hakkında</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4 break-words">
              Standoff 2 Blog, oyunun en güncel haberlerini, duyurularını ve rehberlerini içeren
              kapsamlı bir içerik platformudur. Burada oyun güncellemeleri, patch notları, turnuva
              duyuruları ve topluluk rehberleri bulabilirsiniz.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4 break-words">
              Blog içeriğimiz düzenli olarak güncellenmekte ve oyunun en son gelişmelerini yansıtmaktadır.
              Topluluk üyeleri ve deneyimli oyuncular tarafından hazırlanan bu yazılar, hem yeni
              başlayanlar hem de deneyimli oyuncular için değerli bilgiler sunmaktadır.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-5 md:mt-6">
              <div>
                <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base break-words">Güncel İçerik</h3>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  Oyun güncellemeleri, patch notları ve en son haberler hakkında bilgiler.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base break-words">Topluluk Rehberleri</h3>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
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

