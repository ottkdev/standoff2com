import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { prisma } from '@/lib/db'
import {
  MessageSquare,
  Users,
  ShoppingBag,
  ArrowRight,
  Gamepad2,
  Shield,
  Sparkles,
  Heart,
  BookOpen,
} from 'lucide-react'
import { PinnedPostsTable } from '@/components/home/PinnedPostsTable'
import { ForumSummary } from '@/components/home/ForumSummary'
import { MarketplaceSummary } from '@/components/home/MarketplaceSummary'
import { BlogSummary } from '@/components/home/BlogSummary'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // Get pinned posts, forum data, marketplace, blog, and stats
  const [pinnedPosts, forumData, marketplaceListings, blogPosts, stats, activeUsers] = await Promise.all([
    // Pinned posts (max 5)
    prisma.post.findMany({
      take: 5,
      where: { isPinned: true },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
            isVerified: true,
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
    // Forum data (new, most commented, most liked)
    Promise.all([
      prisma.post.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              username: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      prisma.post.findMany({
        take: 10,
        orderBy: { commentCount: 'desc' },
        include: {
          author: {
            select: {
              username: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      prisma.post.findMany({
        take: 10,
        orderBy: { likeCount: 'desc' },
        include: {
          author: {
            select: {
              username: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
    ]),
    // Marketplace listings (6)
    prisma.marketplaceListing.findMany({
      take: 6,
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            username: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        images: {
          take: 1,
          orderBy: { order: 'asc' },
        },
      },
    }),
    // Blog posts (3)
    prisma.blogPost.findMany({
      take: 3,
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        createdAt: true,
        author: {
          select: {
            username: true,
            avatarUrl: true,
            isVerified: true,
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
    // Stats
    Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.marketplaceListing.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    ]),
    // Active users (top by postCount)
    prisma.user.findMany({
      take: 6,
      orderBy: { postCount: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        postCount: true,
        commentCount: true,
      },
    }),
  ])

  const [newPosts, mostCommented, mostLiked] = forumData
  const [userCount, postCount, listingCount] = stats

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/60 w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-yellow-500/20 blur-3xl opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.25),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(251,146,60,0.18),transparent_45%)]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url('/so2/banner_com.axlebolt.standoff2.jpg')" }}
        />

        <div className="container relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20 w-full">
          <div className="grid gap-8 lg:gap-10 lg:grid-cols-[1.2fr,1fr] items-center">
            <div className="space-y-4 sm:space-y-6 w-full min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 text-orange-200 px-3 sm:px-4 py-1.5 sm:py-2 ring-1 ring-orange-500/30 w-fit max-w-full">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium break-words">Yeni nesil topluluk deneyimi</span>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight break-words">
                  Standoff 2 Türkiye
                  <span className="block gradient-text">Forum · Blog · Marketplace</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl break-words">
                  Güvenli ticaret, aktif forum, rehberler ve duyurular tek platformda.
                  Katıl, paylaş, öğren ve toplulukla büyü.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Link href="/forum" className="w-full sm:w-auto">
                  <Button size="lg" className="gap-2 shadow-lg shadow-orange-500/10 w-full sm:w-auto min-h-[44px]">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                    Foruma Git
                  </Button>
                </Link>
                {session ? (
                  <Link href="/marketplace/create" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="gap-2 border-primary/40 w-full sm:w-auto min-h-[44px]">
                      <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                      İlan Oluştur
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="gap-2 border-primary/40 w-full sm:w-auto min-h-[44px]">
                      <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      Ücretsiz Katıl
                    </Button>
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-border/70 bg-background/60 p-3 sm:p-4 shadow-sm">
                  <div className="text-xs sm:text-sm text-muted-foreground">Toplam Üye</div>
                  <div className="text-xl sm:text-2xl font-semibold break-words">{userCount.toLocaleString('tr-TR')}</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/60 p-3 sm:p-4 shadow-sm">
                  <div className="text-xs sm:text-sm text-muted-foreground">Konu & Yorum</div>
                  <div className="text-xl sm:text-2xl font-semibold break-words">{postCount.toLocaleString('tr-TR')}+</div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/60 p-3 sm:p-4 shadow-sm">
                  <div className="text-xs sm:text-sm text-muted-foreground">Aktif İlan</div>
                  <div className="text-xl sm:text-2xl font-semibold break-words">{listingCount.toLocaleString('tr-TR')}</div>
                </div>
              </div>
            </div>

            <div className="relative w-full min-w-0">
              <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-br from-orange-500/20 via-amber-500/15 to-yellow-500/20 blur-2xl opacity-60" />
              <div className="relative rounded-2xl border border-border/70 bg-background/70 backdrop-blur-lg shadow-xl shadow-orange-500/10 p-4 sm:p-6 space-y-3 sm:space-y-4 w-full overflow-hidden">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">Güvenli Topluluk</p>
                    <p className="text-base sm:text-lg font-semibold break-words">Moderatör onaylı içerik</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">Forum & Rehber</p>
                    <p className="font-semibold mt-1 text-sm sm:text-base break-words">Sor, paylaş, öğren</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">Marketplace</p>
                    <p className="font-semibold mt-1 text-sm sm:text-base break-words">Onaylı ilan süreçleri</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">DM & Takip</p>
                    <p className="font-semibold mt-1 text-sm sm:text-base break-words">Doğrudan mesajlaşma</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">Rozetler</p>
                    <p className="font-semibold mt-1 text-sm sm:text-base break-words">Verified & statüler</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-400 flex-shrink-0" />
                  <span className="break-words">Topluluk güvenliği ve şeffaflığı önceliğimiz.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 w-full">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {[
            {
              title: 'Foruma Katıl',
              href: '/forum',
              description: 'Soru sor, rehber paylaş, tartışmalara katıl.',
              Icon: MessageSquare,
            },
            {
              title: 'Blog & Duyuru',
              href: '/blog',
              description: 'Güncel haberler, rehberler ve duyurular.',
              Icon: BookOpen,
            },
            {
              title: 'Güvenli Ticaret',
              href: '/marketplace',
              description: 'Onaylı ilanlarla güvenli alım/satım.',
              Icon: ShoppingBag,
            },
          ].map(({ title, href, description, Icon }) => (
            <Link key={title} href={href} className="group w-full">
              <div className="rounded-xl border border-border/70 bg-muted/40 p-4 sm:p-5 h-full transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-orange-500/10 w-full overflow-hidden">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </span>
                    <h3 className="text-base sm:text-lg font-semibold break-words">{title}</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition flex-shrink-0 ml-2" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground break-words">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-12 w-full overflow-x-hidden">
        <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10">
          {/* Pinned Posts */}
          {pinnedPosts.length > 0 && (
            <div className="w-full">
              <PinnedPostsTable posts={pinnedPosts} />
            </div>
          )}

          {/* Main Grid: Forum + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full">
            {/* Forum Summary - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 w-full min-w-0">
              <ForumSummary
                newPosts={newPosts}
                mostCommented={mostCommented}
                mostLiked={mostLiked}
              />
            </div>

            {/* Stats Card - Takes 1 column on large screens */}
            <div className="w-full min-w-0">
              <Card className="h-full">
                <CardContent className="relative pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5 overflow-hidden">
                  <div
                    className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 sm:h-32 sm:w-32 opacity-10"
                    style={{ backgroundImage: "url('/so2/Standoff_2_Logo.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom right' }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-xs sm:text-sm md:text-base break-words">Topluluk İstatistikleri</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground break-words">Güncel özet</p>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 flex-shrink-0 whitespace-nowrap">
                      Canlı
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground mb-1">
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="break-words">Toplam Üye</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-semibold break-words">{userCount.toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground mb-1">
                        <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="break-words">Toplam Konu</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-semibold break-words">{postCount.toLocaleString('tr-TR')}</div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground mb-1">
                        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="break-words">Aktif İlan</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-semibold break-words">{listingCount.toLocaleString('tr-TR')}</div>
                    </div>
                  </div>

                  {activeUsers.length > 0 && (
                    <div className="border-t border-border/70 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </span>
                          <p className="text-xs sm:text-sm font-semibold break-words">Aktif Kullanıcılar</p>
                        </div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">İlk {activeUsers.length}</span>
                      </div>
                      <div className="space-y-2">
                        {activeUsers.map((u, idx) => (
                          <div
                            key={u.id}
                            className="flex items-center gap-2 sm:gap-3 rounded-lg border border-border/60 bg-background/60 px-2 sm:px-3 py-2 min-w-0"
                          >
                            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground w-4 sm:w-5 text-center flex-shrink-0">
                              {idx + 1}.
                            </span>
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                              <AvatarImage src={u.avatarUrl || ''} />
                              <AvatarFallback className="text-xs">{u.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-medium text-xs sm:text-sm truncate">{u.displayName || u.username}</span>
                                {u.isVerified && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 text-green-400 px-1.5 sm:px-2 py-[2px] text-[10px] sm:text-[11px] flex-shrink-0">
                                    Onaylı
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                                {u.postCount} konu • {u.commentCount} yorum
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Marketplace Summary */}
          {marketplaceListings.length > 0 && (
            <div className="w-full">
              <MarketplaceSummary listings={marketplaceListings} />
            </div>
          )}

          {/* Blog Summary */}
          {blogPosts.length > 0 && (
            <div className="w-full">
              <BlogSummary posts={blogPosts} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
