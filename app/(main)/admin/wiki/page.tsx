import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookMarked, Plus, Edit, Eye, Calendar } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface PageProps {
  searchParams: {
    category?: string
    page?: string
  }
}

export default async function AdminWikiPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const category = searchParams.category || 'all'
  const page = parseInt(searchParams.page || '1')
  const perPage = 20
  const skip = (page - 1) * perPage

  const where: Prisma.WikiArticleWhereInput = {}

  if (category !== 'all') {
    where.category = category.toUpperCase().replace('-', '_') as Prisma.WikiCategory
  }

  const [articles, total, stats] = await Promise.all([
    prisma.wikiArticle.findMany({
      where,
      take: perPage,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.wikiArticle.count({ where }),
    Promise.all([
      prisma.wikiArticle.count(),
      prisma.wikiArticle.count({ where: { isPublished: true } }),
      prisma.wikiArticle.count({ where: { isPublished: false } }),
    ]),
  ])

  const totalPages = Math.ceil(total / perPage)

  const categoryMap: Record<string, string> = {
    SILAHLAR: 'silahlar',
    HARITALAR: 'haritalar',
    OYUN_MODLARI: 'oyun-modlari',
    RUTBELER: 'rutbeler',
    GUNCELLEMELER: 'guncellemeler',
    SKINLER: 'skinler',
    EKONOMI: 'ekonomi',
    TAKTIKLER: 'taktikler',
    SSS: 'sss',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 gradient-text">Wiki Yönetimi</h1>
          <p className="text-muted-foreground">Wiki makalelerini oluştur, düzenle ve yönet</p>
        </div>
        <Link href="/admin/wiki/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Makale
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

      {/* Articles */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Wiki Makaleleri</CardTitle>
              <CardDescription>
                {total} makale bulundu • Sayfa {page} / {totalPages}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-12">
              <BookMarked className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Wiki makalesi bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
                >
                  {article.featuredImage ? (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <BookMarked className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/wiki/${article.slug}`}
                        className="font-semibold hover:text-primary transition-colors line-clamp-1"
                      >
                        {article.title}
                      </Link>
                      {article.isPublished ? (
                        <Badge variant="default" className="text-xs">Yayınlandı</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Taslak</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {article.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{article.author.username}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{article.viewCount}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatRelativeTime(article.createdAt, new Date())}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/wiki/${article.slug}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Görüntüle
                      </Button>
                    </Link>
                    <Link href={`/admin/wiki/${article.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Düzenle
                      </Button>
                    </Link>
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
                    href={`/admin/wiki?${new URLSearchParams({
                      ...searchParams,
                      page: (page - 1).toString(),
                    }).toString()}`}
                  >
                    <Button variant="outline" size="sm">Önceki</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/wiki?${new URLSearchParams({
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

