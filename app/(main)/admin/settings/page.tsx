import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Database, Users, MessageSquare, BookOpen, ShoppingBag, Award, Shield } from 'lucide-react'
import SiteSettingsForm from '@/components/admin/SiteSettingsForm'

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const [
    userCount,
    verifiedUsers,
    bannedUsers,
    postCount,
    commentCount,
    blogCount,
    publishedBlogs,
    listingCount,
    activeListings,
    categoryCount,
    badgeCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { isPublished: true } }),
    prisma.marketplaceListing.count(),
    prisma.marketplaceListing.count({ where: { status: 'ACTIVE' } }),
    prisma.category.count(),
    prisma.badge.count(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 gradient-text">Site Ayarları</h1>
        <p className="text-muted-foreground">Genel site ayarları ve istatistikler</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Kullanıcı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {verifiedUsers} onaylı • {bannedUsers} yasaklı
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Forum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{commentCount} yorum</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{publishedBlogs} yayınlanan</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Marketplace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{activeListings} aktif</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Site Statistics */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Detaylı İstatistikler</CardTitle>
            <CardDescription>Platform genel istatistikleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <span>Toplam Kullanıcı</span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">{userCount}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Onaylı Kullanıcı</span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">{verifiedUsers}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-orange-500" />
                <span>Forum Konuları</span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">{postCount}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-amber-500" />
                <span>Blog Yazıları</span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">{blogCount}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-purple-500" />
                <span>Toplam İlan</span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">{listingCount}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-500" />
                <span>Kategoriler</span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">{categoryCount}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-yellow-500" />
                <span>Rozetler</span>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">{badgeCount}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Bakım İşlemleri</CardTitle>
            <CardDescription>Veritabanı ve sistem işlemleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Veritabanı
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Veritabanı yönetimi için Prisma Studio kullanın
              </p>
              <code className="text-xs bg-background p-2 rounded block border">
                npx prisma studio
              </code>
            </div>

            <div className="p-4 rounded-lg border bg-muted/50">
              <h3 className="font-semibold mb-2">Seed Data</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Örnek verileri yeniden yüklemek için
              </p>
              <code className="text-xs bg-background p-2 rounded block border">
                npm run db:seed
              </code>
            </div>

            <div className="p-4 rounded-lg border bg-muted/50">
              <h3 className="font-semibold mb-2">Gelişmiş Ayarlar</h3>
              <p className="text-sm text-muted-foreground">
                Gelişmiş ayarlar için veritabanı ve environment değişkenlerini kullanın.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Site Settings */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Site Ayarları</CardTitle>
          <CardDescription>Genel site ayarlarını yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          <SiteSettingsForm />
        </CardContent>
      </Card>
    </div>
  )
}
