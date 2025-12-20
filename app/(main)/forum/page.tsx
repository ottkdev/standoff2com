import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ForumService } from '@/lib/services/forum.service'
import { MessageSquare, Users, ChevronRight, Sparkles, ArrowRight, HelpCircle, TrendingUp, BookOpen } from 'lucide-react'
import { Metadata } from 'next'
import { RecentContent } from '@/components/shared/RecentContent'
import { prisma } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Standoff 2 Forum - Topluluk Tartışmaları ve Rehberler',
  description: 'Standoff 2 topluluk forumu. Soru sor, rehber paylaş, tartışmalara katıl. Oyun hakkında her şeyi burada bulabilirsiniz.',
  keywords: 'standoff 2 forum, standoff 2 topluluk, standoff 2 tartışma, standoff 2 rehber',
  openGraph: {
    title: 'Standoff 2 Forum - Topluluk Tartışmaları',
    description: 'Standoff 2 topluluk forumu. Soru sor, rehber paylaş, tartışmalara katıl.',
    type: 'website',
  },
}

export default async function ForumPage() {
  const categories = await ForumService.getCategories()
  const totalPosts = categories.reduce((acc, c) => acc + c._count.posts, 0)

  // Get recent posts for "Son Eklenenler"
  let recentPosts: Array<{
    id: string
    title: string
    createdAt: Date
    commentCount: number
    author: { username: string; avatarUrl: string | null; isVerified: boolean }
    category: { name: string; slug: string }
  }> = []
  try {
    recentPosts = await prisma.post.findMany({
      where: { deletedAt: null },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        commentCount: true,
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
    })
  } catch (error) {
    console.error('Error fetching recent posts:', error)
  }

  return (
    <div className="page-container-default py-6 md:py-8 lg:py-12 overflow-x-hidden">
      {/* Hero Section */}
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary/10 text-primary px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 mb-3 sm:mb-4 md:mb-6">
          <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 flex-shrink-0" />
          <span className="font-medium text-[10px] sm:text-xs md:text-sm break-words">Topluluk Forumu</span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 gradient-text break-words px-2">
          Standoff 2 Forum
        </h1>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto mb-4 sm:mb-5 md:mb-6 break-words px-2">
          Toplulukla bir araya gelin, sorularınızı sorun, rehberler paylaşın ve oyun hakkında tartışın.
          Deneyimli oyuncular ve yeni başlayanlar için aktif bir topluluk platformu.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 px-2">
          <Link href="/forum" className="w-full sm:w-auto">
            <Button size="lg" className="gap-1.5 sm:gap-2 w-full sm:w-auto min-h-[44px] text-sm">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              Forumu Keşfet
            </Button>
          </Link>
          <Link href="/forum?sort=trending" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="gap-1.5 sm:gap-2 w-full sm:w-auto min-h-[44px] text-sm">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              Popüler Konular
            </Button>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 md:mt-5 px-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/70 px-2.5 sm:px-3 py-1.5 shadow-sm">
            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium break-words">{totalPosts.toLocaleString('tr-TR')} konu</span>
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
          type="forum"
          items={recentPosts.map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.id,
            createdAt: post.createdAt,
            category: post.category ? {
              name: post.category.name,
              slug: post.category.slug,
            } : undefined,
            author: post.author,
            commentCount: post.commentCount,
          }))}
        />
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10 md:mb-12">
        {categories.map((category) => {
          // Assign icons based on category name or use default
          let Icon = MessageSquare
          let color = 'text-blue-500'
          let bg = 'bg-blue-500/10'
          let border = 'border-blue-500/20'

          if (category.name.toLowerCase().includes('rehber') || category.name.toLowerCase().includes('taktik')) {
            Icon = BookOpen
            color = 'text-orange-500'
            bg = 'bg-orange-500/10'
            border = 'border-orange-500/20'
          } else if (category.name.toLowerCase().includes('soru') || category.name.toLowerCase().includes('yardım')) {
            Icon = HelpCircle
            color = 'text-green-500'
            bg = 'bg-green-500/10'
            border = 'border-green-500/20'
          } else if (category.name.toLowerCase().includes('genel') || category.name.toLowerCase().includes('tartışma')) {
            Icon = TrendingUp
            color = 'text-purple-500'
            bg = 'bg-purple-500/10'
            border = 'border-purple-500/20'
          }

          return (
            <Card key={category.id} className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group overflow-hidden">
              <Link href={`/forum/${category.slug}`} className="contents h-full flex flex-col">
                <CardHeader className="pb-2.5 sm:pb-3">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`p-2.5 sm:p-3 rounded-lg ${bg} ${border} border group-hover:scale-110 transition-transform flex-shrink-0`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
                    </div>
                    {category._count.posts > 0 && (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                        {category._count.posts} konu
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg sm:text-xl mb-2 group-hover:text-primary transition-colors break-words">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed break-words">
                    {category.description || 'Topluluk tartışmaları ve paylaşımlar için kategori'}
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

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-20">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Henüz kategori oluşturulmamış</h3>
          <p className="text-muted-foreground">Yakında forum kategorileri eklenecek!</p>
        </div>
      )}

      {/* About Section */}
      <div className="prose prose-invert max-w-none mt-8 sm:mt-10 md:mt-12">
        <Card className="glass-effect">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 break-words">Forum Hakkında</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4 break-words">
              Standoff 2 Forum, oyuncuların bir araya gelip oyun hakkında tartıştığı, sorular sorduğu ve
              rehberler paylaştığı aktif bir topluluk platformudur. Burada oyunun tüm yönleri hakkında
              konuşabilir, deneyimlerinizi paylaşabilir ve diğer oyunculardan öğrenebilirsiniz.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 sm:mb-4 break-words">
              Forumumuz kategorilere ayrılmıştır ve her kategori kendi konu alanına odaklanır. Yeni konular
              açarak tartışmalara katılabilir, mevcut konulara yorum yapabilir ve toplulukla etkileşime geçebilirsiniz.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-5 md:mt-6">
              <div>
                <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base break-words">Aktif Topluluk</h3>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  Binlerce aktif kullanıcı ile günlük tartışmalar ve paylaşımlar.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base break-words">Kategorize İçerik</h3>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  Konular kategorilere ayrılmıştır, aradığınızı kolayca bulabilirsiniz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

