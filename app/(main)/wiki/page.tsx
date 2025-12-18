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
  let featuredArticles: any[] = []
  try {
    featuredArticles = await prisma.wikiArticle.findMany({
      where: { isPublished: true },
      take: 6,
      orderBy: { viewCount: 'desc' },
      include: {
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

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 mb-6">
          <BookOpen className="h-5 w-5" />
          <span className="font-medium">Standoff 2 Wiki</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 gradient-text">
          Standoff 2 Kapsamlı Rehberi
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Oyunun tüm yönlerini keşfedin: silahlar, haritalar, taktikler, güncellemeler ve daha fazlası.
          Profesyonel oyuncular ve yeni başlayanlar için detaylı bilgiler.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/wiki/silahlar">
            <Button size="lg" className="gap-2">
              <Swords className="h-5 w-5" />
              Silahları Keşfet
            </Button>
          </Link>
          <Link href="/wiki/taktikler">
            <Button variant="outline" size="lg" className="gap-2">
              <Lightbulb className="h-5 w-5" />
              Taktikler
            </Button>
          </Link>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {categories.map((category) => {
          const Icon = category.icon
          const count = countsMap.get(category.slug) || 0
          return (
            <Card key={category.slug} className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group">
              <Link href={`/wiki/${category.slug}`} className="contents">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${category.bg} ${category.border} border group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    {count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {count} makale
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-primary text-sm font-medium group-hover:gap-3 transition-all">
                    <span>Keşfet</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Popüler Makaleler</h2>
              <p className="text-muted-foreground">En çok okunan wiki makaleleri</p>
            </div>
            <Link href="/wiki/arama">
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Tümünü Ara
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.map((article) => (
              <Card key={article.id} className="glass-effect hover:border-primary/50 hover:shadow-lg transition-all h-full">
                <Link href={`/wiki/${article.slug}`} className="contents">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {categories.find((c) => c.slug === enumToSlug(article.category))?.name || article.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {article.viewCount} görüntülenme
                      </span>
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
                      <span>{article.author?.username || 'Bilinmeyen'}</span>
                      {article.publishedAt && (
                        <>
                          <span>•</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString('tr-TR')}</span>
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

      {/* SEO Content */}
      <div className="prose prose-invert max-w-none mt-12">
        <Card className="glass-effect">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Standoff 2 Wiki Hakkında</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Standoff 2 Wiki, oyunun tüm yönlerini kapsayan kapsamlı bir Türkçe rehber platformudur.
              Burada silahların detaylı istatistiklerinden harita stratejilerine, oyun modlarından
              rütbe sistemine kadar her şeyi bulabilirsiniz.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Wiki içeriğimiz sürekli güncellenmekte ve oyunun en son güncellemelerini yansıtmaktadır.
              Profesyonel oyuncular ve topluluk üyeleri tarafından hazırlanan bu rehberler, hem yeni
              başlayanlar hem de deneyimli oyuncular için değerli bilgiler sunmaktadır.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="font-semibold mb-2">Kapsamlı İçerik</h3>
                <p className="text-sm text-muted-foreground">
                  Tüm silah türleri, haritalar, oyun modları ve taktikler hakkında detaylı bilgiler.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Güncel Bilgiler</h3>
                <p className="text-sm text-muted-foreground">
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

