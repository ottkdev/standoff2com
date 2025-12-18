import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Eye, Calendar, Share2 } from 'lucide-react'
import { Metadata } from 'next'
import { formatRelativeTime } from '@/lib/utils'
import { WikiArticleView } from '@/components/wiki/WikiArticleView'

const categoryMap: Record<string, { name: string; description: string; icon: string }> = {
  silahlar: {
    name: 'Silahlar',
    description: 'Standoff 2\'deki tüm silah türleri, istatistikler, hasar değerleri ve kullanım ipuçları',
    icon: '⚔️',
  },
  haritalar: {
    name: 'Haritalar',
    description: 'Tüm haritaların detaylı analizi, stratejik bölgeler ve taktiksel öneriler',
    icon: '🗺️',
  },
  'oyun-modlari': {
    name: 'Oyun Modları',
    description: 'Competitive, Defuse, Team Deathmatch ve özel etkinlik modları hakkında bilgiler',
    icon: '🎮',
  },
  rutbeler: {
    name: 'Rutbeler',
    description: 'Rütbe sistemi, nasıl yükselinir ve yaygın hatalar',
    icon: '🏆',
  },
  guncellemeler: {
    name: 'Güncellemeler',
    description: 'Patch notları, değişiklikler, buff/nerf analizleri ve meta etkileri',
    icon: '📝',
  },
  skinler: {
    name: 'Skinler',
    description: 'Skin nadirliği, değer faktörleri ve görsel özellikler',
    icon: '✨',
  },
  ekonomi: {
    name: 'Ekonomi',
    description: 'Ticaret mantığı, değer analizi ve ekonomik stratejiler',
    icon: '💰',
  },
  taktikler: {
    name: 'Taktikler & Rehberler',
    description: 'Başlangıç rehberleri, gelişmiş taktikler, nişan ve hassasiyet ipuçları',
    icon: '💡',
  },
  sss: {
    name: 'Sık Sorulan Sorular',
    description: 'Yeni başlayanlar için SSS, yaygın sorular ve cevaplar',
    icon: '❓',
  },
}

interface PageProps {
  params: {
    category: string
  }
  searchParams: {
    page?: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Check if it's a category first
  const category = categoryMap[params.category]
  
  if (category) {
    return {
      title: `${category.name} - Standoff 2 Wiki`,
      description: category.description,
      keywords: `standoff 2 ${category.name.toLowerCase()}, standoff 2 wiki ${category.name.toLowerCase()}`,
      openGraph: {
        title: `${category.name} - Standoff 2 Wiki`,
        description: category.description,
        type: 'website',
      },
    }
  }

  // Check if it's an article
  let article = null
  try {
    article = await prisma.wikiArticle.findUnique({
      where: { slug: params.category },
    })
  } catch (error) {
    console.error('Error fetching article for metadata:', error)
  }

  if (article && article.isPublished) {
    const metaTitle = article.metaTitle || article.title
    const metaDescription = article.metaDescription || article.excerpt || article.title

    return {
      title: `${metaTitle} - Standoff 2 Wiki`,
      description: metaDescription,
      keywords: article.keywords || undefined,
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        type: 'article',
        publishedTime: article.publishedAt.toISOString(),
        images: article.featuredImage ? [article.featuredImage] : undefined,
      },
    }
  }

  return {
    title: 'Sayfa Bulunamadı',
  }
}

export default async function WikiCategoryPage({ params, searchParams }: PageProps) {
  // First check if it's a category
  const category = categoryMap[params.category]
  
  // If not a category, check if it's an article slug
  if (!category) {
    let article = null
    try {
      article = await prisma.wikiArticle.findUnique({
        where: { slug: params.category },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      })
    } catch (error) {
      console.error('Error fetching article:', error)
    }

    if (article && article.isPublished) {
      // It's an article, render it
      return <WikiArticleContent article={article} />
    }
    
    notFound()
  }

  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const perPage = 12
  const skip = (page - 1) * perPage

  const categoryEnum = params.category.toUpperCase().replace('-', '_') as any

  let articles: any[] = []
  let total = 0
  let stats = { _sum: { viewCount: null as number | null }, _count: { id: 0 } }

  try {
    const where = {
      category: categoryEnum,
      isPublished: true,
    }
    const [articlesResult, statsResult] = await Promise.all([
      prisma.wikiArticle.findMany({
        where,
        take: perPage,
        skip,
        orderBy: { viewCount: 'desc' },
        include: {
          author: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.wikiArticle.aggregate({
        where,
        _sum: {
          viewCount: true,
        },
        _count: {
          id: true,
        },
      }),
    ])
    articles = articlesResult
    total = statsResult._count.id
    stats = statsResult
  } catch (error) {
    console.error('Error fetching wiki articles:', error)
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/wiki" className="hover:text-primary transition-colors">
          Wiki
        </Link>
        <span>/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <Link href="/wiki">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Wiki Ana Sayfa
          </Button>
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl">{category.icon}</div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text">
              {category.name}
            </h1>
            <p className="text-muted-foreground text-lg">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{total} makale</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{stats._sum.viewCount?.toLocaleString() || 0} toplam görüntülenme</span>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <Card className="glass-effect">
          <CardContent className="pt-12 pb-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Henüz makale yok</h3>
            <p className="text-muted-foreground">
              Bu kategoride henüz yayınlanmış makale bulunmuyor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {articles.map((article) => (
              <Card key={article.id} className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group">
                <Link href={`/wiki/${article.slug}`} className="contents">
                  {article.featuredImage && (
                    <div className="h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {category.name}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{article.viewCount}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                    {article.excerpt && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {article.excerpt}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{article.author.username}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(article.publishedAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={`/wiki/${params.category}?page=${page - 1}`}>
                  <Button variant="outline">Önceki</Button>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Sayfa {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/wiki/${params.category}?page=${page + 1}`}>
                  <Button variant="outline">Sonraki</Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Article content component
async function WikiArticleContent({ article }: { article: any }) {
  const categorySlug = categoryMap[article.category] || 'wiki'

  // Increment view count (async, don't wait)
  try {
    prisma.wikiArticle.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {})
  } catch (error) {
    // Ignore view count errors
  }

  // Get related articles
  let relatedArticles: any[] = []
  if (article.relatedArticles) {
    try {
      const relatedIds = JSON.parse(article.relatedArticles) as string[]
      try {
        relatedArticles = await prisma.wikiArticle.findMany({
          where: {
            id: { in: relatedIds },
            isPublished: true,
          },
          take: 4,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
          },
        })
      } catch (e) {
        // Prisma error, ignore
      }
    } catch (e) {
      // Invalid JSON, ignore
    }
  }

  if (relatedArticles.length === 0) {
    try {
      relatedArticles = await prisma.wikiArticle.findMany({
        where: {
          category: article.category,
          isPublished: true,
          id: { not: article.id },
        },
        take: 4,
        orderBy: { viewCount: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
        },
      })
    } catch (error) {
      console.error('Error fetching related articles:', error)
    }
  }

  const toc = generateTOC(article.content)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.excerpt || article.title,
            image: article.featuredImage,
            datePublished: article.publishedAt.toISOString(),
            dateModified: article.updatedAt.toISOString(),
            author: {
              '@type': 'Person',
              name: article.author.username,
            },
            publisher: {
              '@type': 'Organization',
              name: 'Standoff 2 Topluluk',
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://standoff2.com/wiki/${article.slug}`,
            },
          }),
        }}
      />

      <div className="container py-8 md:py-12 px-4 md:px-6 max-w-5xl">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/wiki" className="hover:text-primary transition-colors">
            Wiki
          </Link>
          <span>/</span>
          <Link
            href={`/wiki/${categorySlug}`}
            className="hover:text-primary transition-colors"
          >
            {article.category.replace('_', ' ')}
          </Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{article.title}</span>
        </nav>

        <Link href={`/wiki/${categorySlug}`}>
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kategoriye Dön
          </Button>
        </Link>

        <article className="mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">{article.category.replace('_', ' ')}</Badge>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.viewCount + 1} görüntülenme</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(article.publishedAt).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gradient-text">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                {article.excerpt}
              </p>
            )}
          </div>

          {article.featuredImage && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {toc.length > 0 && (
            <Card className="glass-effect mb-8">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-4">İçindekiler</h2>
                <nav>
                  <ul className="space-y-2">
                    {toc.map((item, index) => (
                      <li key={index} className="text-sm">
                        <a
                          href={`#${item.id}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {item.level === 2 && '  '}
                          {item.level === 3 && '    '}
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </CardContent>
            </Card>
          )}

          <div className="prose prose-invert prose-lg max-w-none mb-8">
            <WikiArticleView content={article.content} />
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Yazar:</span> {article.author.username}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Son güncelleme:</span>{' '}
                {formatRelativeTime(article.updatedAt, new Date())}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Paylaş
              </Button>
            </div>
          </div>
        </article>

        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">İlgili Makaleler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedArticles.map((related) => (
                <Link key={related.id} href={`/wiki/${related.slug}`}>
                  <Card className="glass-effect hover:border-primary/50 transition-all">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2 hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {related.excerpt}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function generateTOC(content: string): Array<{ id: string; text: string; level: number }> {
  const toc: Array<{ id: string; text: string; level: number }> = []
  const lines = content.split('\n')

  for (const line of lines) {
    if (line.startsWith('## ')) {
      const text = line.replace('## ', '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      toc.push({ id, text, level: 2 })
    } else if (line.startsWith('### ')) {
      const text = line.replace('### ', '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      toc.push({ id, text, level: 3 })
    }
  }

  return toc
}

