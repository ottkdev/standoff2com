import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  MessageSquare, 
  BookOpen, 
  ShoppingBag, 
  AlertCircle, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Eye,
  Heart,
  DollarSign,
  Activity,
  Banknote,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const [
    userCount,
    verifiedUsers,
    bannedUsers,
    newUsersToday,
    postCount,
    commentCount,
    blogCount,
    publishedBlogs,
    listingCount,
    pendingListings,
    activeListings,
    soldListings,
    totalValue,
    recentUsers,
    recentListings,
    recentPosts,
    openReportsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { isPublished: true } }),
    prisma.marketplaceListing.count(),
    prisma.marketplaceListing.count({ where: { status: 'PENDING' } }),
    prisma.marketplaceListing.count({ where: { status: 'ACTIVE' } }),
    prisma.marketplaceListing.count({ where: { status: 'SOLD' } }),
    prisma.marketplaceListing.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { price: true },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        isVerified: true,
        role: true,
      },
    }),
    prisma.marketplaceListing.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
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
    prisma.report.count({
      where: { status: 'OPEN' },
    }),
  ])

  const stats = [
    {
      title: 'Toplam Kullanıcı',
      value: userCount,
      change: `+${newUsersToday} bugün`,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      href: '/admin/users',
    },
    {
      title: 'Onaylı Kullanıcı',
      value: verifiedUsers,
      change: `${Math.round((verifiedUsers / userCount) * 100)}%`,
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      href: '/admin/users?filter=verified',
    },
    {
      title: 'Yasaklı Kullanıcı',
      value: bannedUsers,
      change: bannedUsers > 0 ? 'Dikkat' : 'Temiz',
      icon: Shield,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      href: '/admin/users?filter=banned',
    },
    {
      title: 'Forum Konuları',
      value: postCount,
      change: `${commentCount} yorum`,
      icon: MessageSquare,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      href: '/admin/forum',
    },
    {
      title: 'Blog Yazıları',
      value: blogCount,
      change: `${publishedBlogs} yayında`,
      icon: BookOpen,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      href: '/admin/blog',
    },
    {
      title: 'Toplam İlan',
      value: listingCount,
      change: `${activeListings} aktif`,
      icon: ShoppingBag,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      href: '/admin/marketplace',
    },
    {
      title: 'Onay Bekleyen',
      value: pendingListings,
      change: pendingListings > 0 ? 'Aksiyon Gerekli' : 'Temiz',
      icon: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      href: '/admin/marketplace?status=PENDING',
    },
    {
      title: 'Toplam Değer',
      value: totalValue._sum.price ? `₺${totalValue._sum.price.toLocaleString()}` : '₺0',
      change: `${soldListings} satıldı`,
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      href: '/admin/marketplace',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 gradient-text">Dashboard</h1>
        <p className="text-muted-foreground">Site genel bakış ve istatistikler</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="glass-effect hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Users */}
        <Card className="glass-effect">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Yeni Kullanıcılar</CardTitle>
                <CardDescription>Son kayıt olanlar</CardDescription>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="h-10 w-10 rounded-full" />
                    ) : (
                      <span className="text-sm font-semibold">{user.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{user.username}</p>
                      {user.isVerified && (
                        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                      )}
                      {user.role === 'ADMIN' && (
                        <Badge variant="destructive" className="text-xs">Admin</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(user.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Tümünü Gör
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Listings */}
        <Card className="glass-effect">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Yeni İlanlar</CardTitle>
                <CardDescription>Son eklenenler</CardDescription>
              </div>
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/admin/marketplace?listing=${listing.id}`}
                  className="block p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{listing.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            listing.status === 'ACTIVE'
                              ? 'default'
                              : listing.status === 'PENDING'
                              ? 'secondary'
                              : listing.status === 'SOLD'
                              ? 'outline'
                              : 'destructive'
                          }
                          className="text-xs"
                        >
                          {listing.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ₺{listing.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/admin/marketplace">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Tümünü Gör
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card className="glass-effect">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Yeni Konular</CardTitle>
                <CardDescription>Son forum konuları</CardDescription>
              </div>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/forum/${post.category?.slug}/${post.slug}`}
                  className="block p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium line-clamp-2">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{post.author.username}</span>
                    {post.category && (
                      <Badge variant="outline" className="text-xs">
                        {post.category.name}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/admin/forum">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Tümünü Gör
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Hızlı Aksiyonlar</CardTitle>
          <CardDescription>Yaygın yönetim görevleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/users?filter=pending">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Kullanıcıları Yönet
              </Button>
            </Link>
            <Link href="/admin/marketplace?status=PENDING">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ShoppingBag className="h-4 w-4" />
                İlanları Onayla
              </Button>
            </Link>
            <Link href="/admin/blog/create">
              <Button variant="outline" className="w-full justify-start gap-2">
                <BookOpen className="h-4 w-4" />
                Blog Yazısı Oluştur
              </Button>
            </Link>
            <Link href="/admin/badges">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Activity className="h-4 w-4" />
                Rozet Yönetimi
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
