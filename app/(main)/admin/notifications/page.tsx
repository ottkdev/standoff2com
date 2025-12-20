import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import NotificationForm from '@/components/admin/NotificationForm'
import { prisma } from '@/lib/db'
import { Bell } from 'lucide-react'

export default async function AdminNotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const stats = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.user.count(),
  ])

  const [totalNotifications, unreadNotifications, totalUsers] = stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 gradient-text">Bildirim Yönetimi</h1>
        <p className="text-muted-foreground">Kullanıcılara genel bildirim gönderin</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-lg">Toplam Bildirim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalNotifications}</div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-lg">Okunmamış</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{unreadNotifications}</div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-lg">Toplam Kullanıcı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Form */}
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Yeni Bildirim Gönder</CardTitle>
          </div>
          <CardDescription>
            Tüm kullanıcılara veya belirli bir kullanıcıya bildirim gönderebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationForm />
        </CardContent>
      </Card>
    </div>
  )
}

