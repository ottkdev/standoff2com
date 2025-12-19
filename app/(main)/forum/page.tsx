import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ForumService } from '@/lib/services/forum.service'
import { MessageSquare, Users, ChevronRight, Sparkles, ArrowRight, HelpCircle, TrendingUp, BookOpen } from 'lucide-react'
import { Metadata } from 'next'

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

  return (
    <div className="container py-6 md:py-8 lg:py-12 px-4 md:px-6 w-full overflow-x-hidden">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 mb-6">
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">Topluluk Forumu</span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 gradient-text break-words px-4">
          Standoff 2 Forum
        </h1>
        <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 md:mb-8 break-words px-4">
          Toplulukla bir araya gelin, sorularınızı sorun, rehberler paylaşın ve oyun hakkında tartışın.
          Deneyimli oyuncular ve yeni başlayanlar için aktif bir topluluk platformu.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 px-4">
          <Link href="/forum" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full sm:w-auto min-h-[44px]">
              <MessageSquare className="h-5 w-5" />
              Forumu Keşfet
            </Button>
          </Link>
          <Link href="/forum?sort=trending" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto min-h-[44px]">
              <TrendingUp className="h-5 w-5" />
              Popüler Konular
            </Button>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mt-6 md:mt-8 px-4">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-2 shadow-sm">
            <Users className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium">{totalPosts.toLocaleString('tr-TR')} konu</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-2 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium">{categories.length} kategori</span>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
            <Card key={category.id} className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all h-full group">
              <Link href={`/forum/${category.slug}`} className="contents">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${bg} ${border} border group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    {category._count.posts > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {category._count.posts} konu
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {category.description || 'Topluluk tartışmaları ve paylaşımlar için kategori'}
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

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-20">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Henüz kategori oluşturulmamış</h3>
          <p className="text-muted-foreground">Yakında forum kategorileri eklenecek!</p>
        </div>
      )}

      {/* About Section */}
      <div className="prose prose-invert max-w-none mt-12">
        <Card className="glass-effect">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Forum Hakkında</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Standoff 2 Forum, oyuncuların bir araya gelip oyun hakkında tartıştığı, sorular sorduğu ve
              rehberler paylaştığı aktif bir topluluk platformudur. Burada oyunun tüm yönleri hakkında
              konuşabilir, deneyimlerinizi paylaşabilir ve diğer oyunculardan öğrenebilirsiniz.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Forumumuz kategorilere ayrılmıştır ve her kategori kendi konu alanına odaklanır. Yeni konular
              açarak tartışmalara katılabilir, mevcut konulara yorum yapabilir ve toplulukla etkileşime geçebilirsiniz.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="font-semibold mb-2">Aktif Topluluk</h3>
                <p className="text-sm text-muted-foreground">
                  Binlerce aktif kullanıcı ile günlük tartışmalar ve paylaşımlar.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Kategorize İçerik</h3>
                <p className="text-sm text-muted-foreground">
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

