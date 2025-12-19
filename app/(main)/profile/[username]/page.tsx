import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserService } from '@/lib/services/user.service'
import { WalletService } from '@/lib/services/wallet.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  User,
  MessageSquare,
  Heart,
  ShoppingBag,
  Users,
  Sparkles,
  Trophy,
  Calendar,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { FollowButton } from '@/components/profile/FollowButton'
import { UserPosts } from '@/components/profile/UserPosts'
import { UserListings } from '@/components/profile/UserListings'
import { ReportButton } from '@/components/report/ReportButton'

interface PageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const user = await UserService.getUserByUsername(params.username)

  if (!user) {
    notFound()
  }

  const isOwnProfile = session?.user?.id === user.id
  const isFollowing = session?.user?.id
    ? await UserService.isFollowing(session.user.id, user.id)
    : false

  // Get wallet balance for own profile
  let wallet = null
  if (isOwnProfile) {
    wallet = await WalletService.getWallet(user.id)
  }

  return (
    <div className="container py-4 sm:py-6 md:py-8 lg:py-10 max-w-5xl px-4 md:px-6 w-full overflow-x-hidden">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-yellow-500/20 blur-3xl opacity-70" />
        <Card className="relative overflow-hidden border border-border/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,146,60,0.18),transparent_35%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(251,146,60,0.14),transparent_40%)]" />
          <CardHeader className="relative z-10 pb-4 px-4 md:px-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-primary/30 shadow-lg shadow-orange-500/20 flex-shrink-0">
                  <AvatarImage src={user.avatarUrl || ''} />
                  <AvatarFallback className="text-xl sm:text-2xl">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <CardTitle className="text-2xl md:text-3xl break-words">{user.displayName || user.username}</CardTitle>
                    {user.isVerified && (
                      <Badge className="gap-1 bg-green-500/20 text-green-100 border-green-500/30">
                        <CheckCircle2 className="h-4 w-4" />
                        Verified
                      </Badge>
                    )}
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 break-words">@{user.username}</p>
                  <p className="text-sm text-foreground/90 break-words">
                    {user.bio || 'Henüz bio eklenmedi. Takip edip mesaj göndererek tanışın.'}
                  </p>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs md:text-sm">
                    <StatPill icon={<Users className="h-4 w-4" />} label="Takipçi" value={user._count.followers} />
                    <StatPill icon={<User className="h-4 w-4" />} label="Takip" value={user._count.following} />
                    <StatPill icon={<MessageSquare className="h-4 w-4" />} label="Konu" value={user.postCount} />
                    <StatPill icon={<Heart className="h-4 w-4" />} label="Yorum" value={user.commentCount} />
                  </div>
                  {isOwnProfile && wallet && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Cüzdan Bakiyesi:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            {(wallet.balanceAvailable / 100).toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            ₺
                          </span>
                          <Link href="/wallet">
                            <Button size="sm" variant="outline" className="h-8 text-xs">
                              Yönet
                            </Button>
                          </Link>
                        </div>
                      </div>
                      {wallet.balanceHeld > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Tutulan: {(wallet.balanceHeld / 100).toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          ₺
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
                {isOwnProfile ? (
                  <Link href="/profile/edit" className="w-full sm:w-auto">
                    <Button size="sm" className="w-full sm:w-auto min-h-[44px]">Profili Düzenle</Button>
                  </Link>
                ) : session?.user ? (
                  <>
                    <Link href={`/messages/${user.id}`} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto min-h-[44px]">Mesaj Gönder</Button>
                    </Link>
                    <div className="w-full sm:w-auto">
                      <FollowButton userId={user.id} isFollowing={isFollowing} />
                    </div>
                    <div className="w-full sm:w-auto">
                      <ReportButton targetType="PROFILE" targetId={user.id} variant="outline" size="sm" className="w-full sm:w-auto min-h-[44px]" />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <BadgeCard
                icon={<ShoppingBag className="h-4 w-4" />}
                title="İlanlar"
                description={`${user._count.listings} aktif / geçmiş ilan`}
              />
              <BadgeCard
                icon={<Trophy className="h-4 w-4" />}
                title="Rozetler"
                description={`${user.badges.length} rozet`}
              />
              <BadgeCard
                icon={<Calendar className="h-4 w-4" />}
                title="Katılım"
                description={`Üyelik: ${new Date(user.createdAt).toLocaleDateString('tr-TR')}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {user.badges.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rozetler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.badges.map((userBadge) => (
                <Badge key={userBadge.badgeId} variant="secondary" className="gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {userBadge.badge.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Posts */}
      <Card className="glass-effect mb-6">
        <CardHeader>
          <CardTitle>Konular ({user.postCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <UserPosts userId={user.id} />
        </CardContent>
      </Card>

      {/* User Listings */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>İlanlar ({user._count.listings})</CardTitle>
        </CardHeader>
        <CardContent>
          <UserListings userId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 shadow-sm">
      <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </span>
      <div className="leading-tight">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value.toLocaleString('tr-TR')}</p>
      </div>
    </div>
  )
}

function BadgeCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-4 flex items-start gap-3">
      <span className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

