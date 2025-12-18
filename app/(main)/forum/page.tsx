import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ForumService } from '@/lib/services/forum.service'
import { MessageSquare, Users, ChevronRight, Sparkles } from 'lucide-react'

export default async function ForumPage() {
  const categories = await ForumService.getCategories()

  return (
    <div className="container py-8 md:py-10 px-4 md:px-6">
      <div className="mb-6 md:mb-8 relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10 px-4 py-6 md:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.18),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(251,146,60,0.14),transparent_40%)]" />
        <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">Forum</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-1 gradient-text">Topluluk Forumları</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Tartış, soru sor, rehber paylaş; toplulukla etkileşime geç.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 shadow-sm">
              <Users className="h-4 w-4" />
              <span>{categories.reduce((acc, c) => acc + c._count.posts, 0)} konu</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{categories.length} kategori</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all overflow-hidden group"
          >
            <CardHeader className="relative">
              <div className="flex items-center justify-between gap-2 mb-2">
                <CardTitle>
                  <Link href={`/forum/${category.slug}`} className="hover:text-primary">
                    {category.name}
                  </Link>
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {category._count.posts} konu
                </Badge>
              </div>
              {category.description && (
                <CardDescription className="line-clamp-2">{category.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">Son eklenenleri gör</span>
                </div>
                <Link
                  href={`/forum/${category.slug}`}
                  className="text-primary hover:underline inline-flex items-center gap-1 text-xs font-semibold"
                >
                  Görüntüle
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Henüz kategori oluşturulmamış</p>
        </div>
      )}
    </div>
  )
}

