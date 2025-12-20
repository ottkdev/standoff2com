import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Prisma, UserRole } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Ban, Shield, Search, Users as UsersIcon, Mail, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { UserSearchFilters } from '@/components/admin/UserSearchFilters'

interface PageProps {
  searchParams: {
    search?: string
    filter?: string
    role?: string
    page?: string
  }
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const search = searchParams.search || ''
  const filter = searchParams.filter || 'all'
  const role = searchParams.role || 'all'
  const page = parseInt(searchParams.page || '1')
  const perPage = 20
  const skip = (page - 1) * perPage

  // Build where clause
  const where: Prisma.UserWhereInput = {}

  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (filter === 'verified') {
    where.isVerified = true
  } else if (filter === 'banned') {
    where.isBanned = true
  } else if (filter === 'unverified') {
    where.isVerified = false
  }

  if (role !== 'all') {
    where.role = role as UserRole
  }

  const [users, total, stats] = await Promise.all([
    prisma.user.findMany({
      where,
      take: perPage,
      skip,
      orderBy: { createdAt: 'desc' },
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
    }),
    prisma.user.count({ where }),
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'MODERATOR' } }),
    ]),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 gradient-text">Kullanıcı Yönetimi</h1>
        <p className="text-muted-foreground">Kullanıcıları görüntüle, düzenle ve yönet</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Onaylı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats[1]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yasaklı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats[2]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats[3]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moderatör</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats[4]}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <UserSearchFilters searchParams={searchParams} />

      {/* Users List */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kullanıcılar</CardTitle>
              <CardDescription>
                {total} kullanıcı bulundu • Sayfa {page} / {totalPages}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarUrl || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/profile/${user.username}`}
                          className="font-semibold hover:text-primary transition-colors truncate"
                        >
                          {user.username}
                        </Link>
                        {user.isVerified && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        {user.role === 'ADMIN' && (
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {user.role === 'MODERATOR' && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Mod
                          </Badge>
                        )}
                        {user.isBanned && (
                          <Badge variant="destructive" className="text-xs">
                            <Ban className="h-3 w-3 mr-1" />
                            Yasaklı
                          </Badge>
                        )}
                        {user.badges.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {user.badges.length} rozet
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatRelativeTime(user.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>{user._count.posts} konu</span>
                          <span>{user._count.comments} yorum</span>
                          <span>{user._count.followers} takipçi</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Yönet
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
                    href={`/admin/users?${new URLSearchParams({
                      ...searchParams,
                      page: (page - 1).toString(),
                    }).toString()}`}
                  >
                    <Button variant="outline" size="sm">Önceki</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/users?${new URLSearchParams({
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
