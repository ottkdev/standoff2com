import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Award, Plus, Edit, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import BadgeManager from '@/components/admin/BadgeManager'
import Image from 'next/image'

interface PageProps {
  searchParams: {
    search?: string
  }
}

export default async function AdminBadgesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const search = searchParams.search || ''

  const where: Prisma.BadgeWhereInput = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [badges, stats] = await Promise.all([
    prisma.badge.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    }),
    Promise.all([
      prisma.badge.count(),
      prisma.userBadge.count(),
    ]),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 gradient-text">Rozet Yönetimi</h1>
          <p className="text-muted-foreground">Rozetleri oluştur, düzenle ve kullanıcılara ata</p>
        </div>
        <BadgeManager mode="create" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Rozet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Atama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats[1]}</div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rozetler ({badges.length})</CardTitle>
              <CardDescription>Tüm rozetleri görüntüle ve yönet</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Rozet bulunamadı</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <Card key={badge.id} className="glass-effect hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {badge.iconUrl ? (
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: badge.color ? `${badge.color}20` : 'var(--primary)20',
                            }}
                          >
                            <img src={badge.iconUrl} alt={badge.name} className="w-8 h-8" />
                          </div>
                        ) : (
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: badge.color ? `${badge.color}20` : 'var(--primary)20',
                            }}
                          >
                            <Award
                              className="w-6 h-6"
                              style={{ color: badge.color || 'var(--primary)' }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg">{badge.name}</CardTitle>
                          <CardDescription className="line-clamp-2">{badge.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{badge._count.users} kullanıcı</span>
                      </div>
                      <div className="flex gap-2">
                        <BadgeManager mode="edit" badge={badge} />
                        <BadgeManager mode="delete" badge={badge} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

