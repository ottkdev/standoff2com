'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckCircle2,
  MessageSquare,
  BookOpen,
  ShoppingBag,
  Menu,
  Sparkles,
  BookMarked,
} from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navLinks = [
    { href: '/wiki', label: 'Wiki', Icon: BookMarked },
    { href: '/forum', label: 'Forum', Icon: MessageSquare },
    { href: '/blog', label: 'Blog', Icon: BookOpen },
    { href: '/marketplace', label: 'Alım/Satım', Icon: ShoppingBag },
  ]

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-sm">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-yellow-500/10" />
      <div className="container relative flex h-16 items-center justify-between px-4 md:px-6 max-w-full overflow-visible">
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6 min-w-0 flex-1">
          <Link href="/" className="flex items-center space-x-2 md:space-x-3 group min-w-0 flex-shrink-0">
            <span className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
            </span>
            <div className="leading-tight min-w-0">
              <p className="text-lg md:text-xl lg:text-2xl font-bold gradient-text group-hover:drop-shadow-[0_0_12px_rgba(251,146,60,0.45)] transition-all truncate">
                Standoff 2
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block truncate">Topluluk · Wiki · Forum · Marketplace</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            {navLinks.map(({ href, label, Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary/10 text-foreground border border-primary/30 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 md:gap-2 lg:gap-3 flex-shrink-0">
          {session?.user ? (
            <>
              <NotificationBell />
              <Link href="/messages" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-9 md:h-10">
                  Mesajlar
                </Button>
              </Link>
              {(session.user?.role === 'ADMIN' || session.user?.role === 'MODERATOR') && (
                <Link href="/admin" className="hidden lg:block">
                  <Button variant="outline" size="sm" className="border-primary/40 h-9 md:h-10">
                    Admin
                  </Button>
                </Link>
              )}
              <Link
                href="/marketplace/create"
                className="hidden sm:block"
              >
                <Button size="sm" className="gap-2 shadow-sm h-9 md:h-10 text-xs md:text-sm">
                  <ShoppingBag className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden md:inline">İlan Oluştur</span>
                  <span className="md:hidden">İlan</span>
                </Button>
              </Link>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 rounded-full ring-1 ring-border hover:ring-primary/40 transition-all flex-shrink-0">
                    <Avatar className="h-9 w-9 md:h-10 md:w-10">
                      <AvatarImage src="" alt={session.user.username} />
                      <AvatarFallback className="text-xs md:text-sm">{session.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-w-[calc(100vw-2rem)]" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none flex items-center gap-2">
                        {session.user.username}
                        {session.user.isVerified && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${session.user.username}`}>Profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/edit">Ayarlar</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={() => signOut({ callbackUrl: '/' })}
                  >
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden sm:flex">Giriş Yap</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-1">
                  <Sparkles className="h-4 w-4" />
                  Kayıt Ol
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden h-9 w-9 flex-shrink-0">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-w-[calc(100vw-2rem)]">
              {navLinks.map(({ href, label }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href}>{label}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {session?.user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/messages">Mesajlar</Link>
                  </DropdownMenuItem>
                  {(session.user?.role === 'ADMIN' || session.user?.role === 'MODERATOR') && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/marketplace/create">İlan Oluştur</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={() => signOut({ callbackUrl: '/' })}
                  >
                    Çıkış Yap
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">Giriş Yap</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">Kayıt Ol</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

