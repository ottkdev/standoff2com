import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  BookOpen,
  Swords,
  Map as MapIcon,
  Gamepad2,
  Trophy,
  FileText,
  Sparkles,
  Coins,
  Lightbulb,
  HelpCircle,
  ArrowRight,
  Search,
} from 'lucide-react'
import { Metadata } from 'next'
import { RecentContent } from '@/components/shared/RecentContent'

export const metadata: Metadata = {
  title: 'Standoff 2 Wiki - Kapsamlı Oyun Rehberi | Silahlar, Haritalar, Taktikler',
  description: 'Standoff 2 için en kapsamlı Türkçe wiki. Silahlar, haritalar, oyun modları, rutbeler, güncellemeler, skinler, ekonomi ve taktikler hakkında detaylı bilgiler.',
  keywords: 'standoff 2 wiki, standoff 2 rehber, standoff 2 silahlar, standoff 2 haritalar, standoff 2 taktikler',
  openGraph: {
    title: 'Standoff 2 Wiki - Kapsamlı Oyun Rehberi',
    description: 'Standoff 2 için en kapsamlı Türkçe wiki ve rehber.',
    type: 'website',
  },
}

const categories = [
  {
    slug: 'silahlar',
    name: 'Silahlar',
    description: 'Tüm silah türleri, istatistikler, hasar değerleri ve kullanım ipuçları',
    icon: Swords,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  {
    slug: 'haritalar',
    name: 'Haritalar',
    description: 'Tüm haritaların detaylı analizi, stratejik bölgeler ve taktiksel öneriler',
    icon: MapIcon,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    slug: 'oyun-modlari',
    name: 'Oyun Modları',
    description: 'Competitive, Defuse, Team Deathmatch ve özel etkinlik modları',
    icon: Gamepad2,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    slug: 'rutbeler',
    name: 'Rutbeler',
    description: 'Rütbe sistemi, nasıl yükselinir ve yaygın hatalar',
    icon: Trophy,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  {
    slug: 'guncellemeler',
    name: 'Güncellemeler',
    description: 'Patch notları, değişiklikler, buff/nerf analizleri ve meta etkileri',
    icon: FileText,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    slug: 'skinler',
    name: 'Skinler',
    description: 'Skin nadirliği, değer faktörleri ve görsel özellikler',
    icon: Sparkles,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  {
    slug: 'ekonomi',
    name: 'Ekonomi',
    description: 'Ticaret mantığı, değer analizi ve ekonomik stratejiler',
    icon: Coins,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    slug: 'taktikler',
    name: 'Taktikler & Rehberler',
    description: 'Başlangıç rehberleri, gelişmiş taktikler, nişan ve hassasiyet ipuçları',
    icon: Lightbulb,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    slug: 'sss',
    name: 'Sık Sorulan Sorular',
    description: 'Yeni başlayanlar için SSS, yaygın sorular ve cevaplar',
    icon: HelpCircle,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
]

// Helper function to convert slug to enum value
function slugToEnum(slug: string): string {
  return slug.toUpperCase().replace(/-/g, '_')
}

// Helper function to convert enum to slug
function enumToSlug(enumValue: string): string {
  return enumValue.toLowerCase().replace(/_/g, '-')
}

export default async function WikiPage() {
  // Get article counts per category
  const articleCounts = await Promise.all(
    categories.map(async (cat) => {
      try {
        const count = await prisma.wikiArticle.count({
          where: {
            category: slugToEnum(cat.slug) as any,
            isPublished: true,
          },
        })
        return { slug: cat.slug, count }
      } catch (error) {
        // If Prisma client not generated yet, return 0
        console.error(`Error counting articles for ${cat.slug}:`, error)
        return { slug: cat.slug, count: 0 }
      }
    })
  )

  const countsMap = new Map(articleCounts.map((c) => [c.slug, c.count]))

  // Get featured/recent articles
  let featuredArticles: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    viewCount: number
    createdAt: Date
    category: string
    author: { username: string } | null
  }> = []
  try {
    featuredArticles = await prisma.wikiArticle.findMany({
      where: { isPublished: true },
      take: 6,
      orderBy: { viewCount: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        viewCount: true,
        createdAt: true,
        category: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching featured articles:', error)
  }

  // Get recent articles for "Son Eklenenler"
  let recentArticles: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    viewCount: number
    createdAt: Date
    category: string
    author: { username: string } | null
  }> = []
  try {
    recentArticles = await prisma.wikiArticle.findMany({
      where: { isPublished: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        viewCount: true,
        createdAt: true,
        category: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching recent articles:', error)
  }

  return (
    <div className="page-container-default py-6 md:py-8 lg:py-12 overflow-x-hidden">
      {/* Hero Section */}
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary/10 text-primary px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 mb-3 sm:mb-4 md:mb-6">
          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
          <span className="font-medium text-[10px] sm:text-xs md:text-sm break-words">Standoff 2 Wiki</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 gradient-text break-words px-2">
          Standoff 2 Kapsamlı Rehberi
        </h1>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto mb-4 sm:mb-5 md:mb-6 break-words px-2">
          Oyunun tüm yönlerini keşfedin: silahlar, haritalar, taktikler, güncellemeler ve daha fazlası.
          Profesyonel oyuncular ve yeni başlayanlar için detaylı bilgiler.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 px-2">
          <Link href="/wiki/silahlar" className="w-full sm:w-auto">
            <Button size="lg" className="gap-1.5 sm:gap-2 w-full sm:w-auto min-h-[44px] text-sm">
              <Swords className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              Silahları Keşfet
            </Button>
          </Link>
          <Link href="/wiki/taktikler" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="gap-1.5 sm:gap-2 w-full sm:w-auto min-h-[44px] text-sm">
              <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              Taktikler
            </Button>
          </Link>
        </div>
      </div>

      {/* Son Eklenenler */}
      {recentArticles.length > 0 && (
        <RecentContent
          type="wiki"
          items={recentArticles.map((article) => ({
            id: article.id,
            title: article.title,
            slug: article.slug,
            createdAt: article.createdAt,
            category: {
              name: categories.find((c) => c.slug === enumToSlug(article.category))?.name || article.category,
            },
            author: article.author || undefined,
            viewCount: article.viewCount,
          }))}
        />
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10 md:mb-12">
        {categories.map((category) => {
          const Icon = category.icon
          const count = countsMap.get(category.slug) || 0
          return (
            <Card key={category.slug} className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group overflow-hidden">
              <Link href={`/wiki/${category.slug}`} className="contents h-full flex flex-col">
                <CardHeader className="pb-2.5 sm:pb-3">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`p-2.5 sm:p-3 rounded-lg ${category.bg} ${category.border} border group-hover:scale-110 transition-transform flex-shrink-0`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${category.color}`} />
                    </div>
                    {count > 0 && (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                        {count} makale
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg sm:text-xl mb-2 group-hover:text-primary transition-colors break-words">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed break-words">
                    {category.description}
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

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 break-words">Popüler Makaleler</h2>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">En çok okunan wiki makaleleri</p>
            </div>
            <Link href="/wiki/arama">
              <Button variant="outline" className="gap-2 text-xs sm:text-sm min-h-[44px]">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Tümünü Ara</span>
                <span className="sm:hidden">Ara</span>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5 lg:gap-6">
            {featuredArticles.map((article) => (
            <Card key={article.id} className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group overflow-hidden">
              <Link href={`/wiki/${article.slug}`} className="contents">
                <CardHeader className="pb-2 sm:pb-2.5 md:pb-3 p-3 sm:p-4 md:p-6">
                  {/* Top Row: Category + Views - Tek Satır */}
                  <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5 h-auto leading-tight">
                        {categories.find((c) => c.slug === enumToSlug(article.category))?.name || article.category}
                      </Badge>
                    </div>
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      👁 {article.viewCount.toLocaleString('tr-TR')}
                    </span>
                  </div>
                  
                  {/* Title - Max 2 satır */}
                  <CardTitle className="text-sm sm:text-base md:text-lg line-clamp-2 group-hover:text-primary transition-colors break-words leading-tight mb-1.5 sm:mb-2">
                    {article.title}
                  </CardTitle>
                  
                  {/* Excerpt - Max 2 satır (opsiyonel) */}
                  {article.excerpt && (
                    <CardDescription className="line-clamp-2 text-[10px] sm:text-xs md:text-sm leading-relaxed mb-1.5 sm:mb-2">
                      {article.excerpt}
                    </CardDescription>
                  )}
                  
                  {/* Bottom Row: Author + Date - Tek Satır */}
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                    <span className="truncate max-w-[100px] sm:max-w-none">{article.author?.username || 'Bilinmeyen'}</span>
                    <span>•</span>
                    <span className="whitespace-nowrap">{new Date(article.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </CardHeader>
              </Link>
            </Card>
            ))}
          </div>
        </div>
      )}

      {/* SEO Content */}
      <div className="prose prose-invert max-w-none mt-8 sm:mt-10 md:mt-12">
        <Card className="glass-effect">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">Standoff 2 Wiki Hakkında</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4 break-words">
              Standoff 2 Wiki, oyunun tüm yönlerini kapsayan kapsamlı bir Türkçe rehber platformudur.
              Burada silahların detaylı istatistiklerinden harita stratejilerine, oyun modlarından
              rütbe sistemine kadar her şeyi bulabilirsiniz.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4 break-words">
              Wiki içeriğimiz sürekli güncellenmekte ve oyunun en son güncellemelerini yansıtmaktadır.
              Profesyonel oyuncular ve topluluk üyeleri tarafından hazırlanan bu rehberler, hem yeni
              başlayanlar hem de deneyimli oyuncular için değerli bilgiler sunmaktadır.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-5 md:mt-6">
              <div>
                <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base break-words">Kapsamlı İçerik</h3>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  Tüm silah türleri, haritalar, oyun modları ve taktikler hakkında detaylı bilgiler.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base break-words">Güncel Bilgiler</h3>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  Her güncelleme ile birlikte wiki içeriğimiz de güncellenir ve meta değişiklikleri yansıtılır.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

