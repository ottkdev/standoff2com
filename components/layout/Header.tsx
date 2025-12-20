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
  HelpCircle,
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
    <header className="sticky top-0 z-50 w-full max-w-full border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 shadow-sm overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-yellow-500/10" />
      <div className="container relative flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-full overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 lg:gap-6 min-w-0 flex-1">
          <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 group min-w-0 flex-shrink-0">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            </span>
            <div className="leading-tight min-w-0">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold gradient-text group-hover:drop-shadow-[0_0_12px_rgba(251,146,60,0.45)] transition-all truncate break-words">
                Standoff 2
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block truncate">Topluluk · Wiki · Forum · Marketplace</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 xl:gap-3">
            {navLinks.map(({ href, label, Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 lg:gap-2 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-medium transition-all min-h-[44px] ${
                    active
                      ? 'bg-primary/10 text-foreground border border-primary/30 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
                  <span className="break-words">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 md:gap-2 lg:gap-3 flex-shrink-0">
          {session?.user ? (
            <>
              <NotificationBell />
              <Link href="/support" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-9 md:h-10 min-h-[44px] text-xs md:text-sm">
                  <HelpCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
                  <span className="break-words">Destek</span>
                </Button>
              </Link>
              <Link href="/messages" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-9 md:h-10 min-h-[44px] text-xs md:text-sm">
                  <span className="break-words">Mesajlar</span>
                </Button>
              </Link>
              {(session.user?.role === 'ADMIN' || session.user?.role === 'MODERATOR') && (
                <Link href="/admin" className="hidden lg:block">
                  <Button variant="outline" size="sm" className="border-primary/40 h-9 md:h-10 min-h-[44px] text-xs md:text-sm">
                    <span className="break-words">Admin</span>
                  </Button>
                </Link>
              )}
              <Link
                href="/marketplace/create"
                className="hidden sm:block"
              >
                <Button size="sm" className="gap-1.5 sm:gap-2 shadow-sm h-9 md:h-10 min-h-[44px] text-xs md:text-sm">
                  <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="hidden md:inline break-words">İlan Oluştur</span>
                  <span className="md:hidden break-words">İlan</span>
                </Button>
              </Link>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 md:h-10 md:w-10 min-h-[44px] min-w-[44px] rounded-full ring-1 ring-border hover:ring-primary/40 transition-all flex-shrink-0">
                    <Avatar className="h-9 w-9 md:h-10 md:w-10">
                      <AvatarImage src="" alt={session.user.username} />
                      <AvatarFallback className="text-xs md:text-sm">{session.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-w-[calc(100vw-3rem)]" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none flex items-center gap-2 break-words">
                        <span className="truncate">{session.user.username}</span>
                        {session.user.isVerified && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate break-words">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${session.user.username}`} className="min-h-[44px] flex items-center">
                      <span className="break-words">Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/edit" className="min-h-[44px] flex items-center">
                      <span className="break-words">Ayarlar</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer min-h-[44px]"
                    onSelect={() => signOut({ callbackUrl: '/' })}
                  >
                    <span className="break-words">Çıkış Yap</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden sm:flex min-h-[44px] text-xs sm:text-sm">
                  <span className="break-words">Giriş Yap</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-1 min-h-[44px] text-xs sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-words">Kayıt Ol</span>
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="md:hidden h-9 w-9 min-h-[44px] min-w-[44px] flex-shrink-0"
                aria-label="Menüyü aç"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-w-[calc(100vw-3rem)]">
              {navLinks.map(({ href, label }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} className="min-h-[44px] flex items-center">
                    <span className="break-words">{label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {session?.user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/support" className="min-h-[44px] flex items-center">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      <span className="break-words">Destek</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="min-h-[44px] flex items-center">
                      <span className="break-words">Mesajlar</span>
                    </Link>
                  </DropdownMenuItem>
                  {(session.user?.role === 'ADMIN' || session.user?.role === 'MODERATOR') && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="min-h-[44px] flex items-center">
                        <span className="break-words">Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/marketplace/create" className="min-h-[44px] flex items-center">
                      <span className="break-words">İlan Oluştur</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer min-h-[44px]"
                    onSelect={() => signOut({ callbackUrl: '/' })}
                  >
                    <span className="break-words">Çıkış Yap</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="min-h-[44px] flex items-center">
                      <span className="break-words">Giriş Yap</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register" className="min-h-[44px] flex items-center">
                      <span className="break-words">Kayıt Ol</span>
                    </Link>
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

