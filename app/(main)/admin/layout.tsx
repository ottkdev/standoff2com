import React from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  BookOpen, 
  BookMarked,
  ShoppingBag,
  Settings,
  Bell,
  Shield,
  Award,
  Activity,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

async function AdminNav() {
  const session = await getServerSession(authOptions)
  
  if (!session) return null

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Kullanıcılar', icon: Users },
    { href: '/admin/forum', label: 'Forum', icon: MessageSquare },
    { href: '/admin/blog', label: 'Blog', icon: BookOpen },
    { href: '/admin/wiki', label: 'Wiki', icon: BookMarked },
    { href: '/admin/marketplace', label: 'İlanlar', icon: ShoppingBag },
    { href: '/admin/badges', label: 'Rozetler', icon: Award },
    { href: '/admin/notifications', label: 'Bildirimler', icon: Bell },
    { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
  ]

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-sm font-medium transition-all",
                "hover:bg-primary/10 hover:text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold gradient-text">Admin Panel</span>
              </Link>
              <Badge variant={session.user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                {session.user.role}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{session.user.username}</span>
              <Link href="/">
                <Button variant="ghost" size="sm">Siteye Dön</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="grid gap-6 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">NAVİGASYON</h3>
              <AdminNav />
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 space-y-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
