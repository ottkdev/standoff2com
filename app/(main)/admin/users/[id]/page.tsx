import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2, Ban, Shield, User as UserIcon, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import UserEditForm from '@/components/admin/UserEditForm'
import UserBadgeManager from '@/components/admin/UserBadgeManager'

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          posts: true,
          comments: true,
          followers: true,
          following: true,
        },
      },
      badges: {
        include: {
          badge: true,
        },
      },
    },
  })

  const badges = await prisma.badge.findMany({
    orderBy: { createdAt: 'desc' },
  })

  if (!user) {
    notFound()
  }

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kullanıcılara Dön
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <UserEditForm user={user} />
        </div>

        <div className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Kullanıcı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatarUrl || ''} />
                  <AvatarFallback>
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{user.username}</span>
                    {user.isVerified && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rol</span>
                  <Badge
                    variant={
                      user.role === 'ADMIN'
                        ? 'destructive'
                        : user.role === 'MODERATOR'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {user.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Durum</span>
                  {user.isBanned ? (
                    <Badge variant="destructive">Yasaklı</Badge>
                  ) : (
                    <Badge variant="default">Aktif</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kayıt Tarihi</span>
                  <span className="text-sm">
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>İstatistikler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Konular</span>
                <span className="font-semibold">{user._count.posts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Yorumlar</span>
                <span className="font-semibold">{user._count.comments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Takipçiler</span>
                <span className="font-semibold">{user._count.followers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Takip Edilen</span>
                <span className="font-semibold">{user._count.following}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Rozetler</CardTitle>
            </CardHeader>
            <CardContent>
              <UserBadgeManager userId={user.id} badges={badges} userBadges={user.badges} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

