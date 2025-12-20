'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Pin, Sparkles } from 'lucide-react'
import ProfileLink from './ProfileLink'
import RelativeTime from '@/components/ui/RelativeTime'

interface PinnedPost {
  id: string
  title: string
  commentCount?: number
  viewCount: number
  createdAt: Date | string
  author: {
    username: string
    avatarUrl: string | null
    isVerified: boolean
  }
  category: {
    name: string
    slug: string
  }
}

interface PinnedPostsTableProps {
  posts: PinnedPost[]
}

export function PinnedPostsTable({ posts }: PinnedPostsTableProps) {
  if (posts.length === 0) return null

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden w-full relative">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-yellow-500/10" />
      <div className="bg-muted/50 px-4 py-3 border-b border-border relative z-10">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Pin className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-semibold text-sm">Sabit / Duyuru Konuları</h3>
            <p className="text-xs text-muted-foreground hidden sm:block">Topluluk için önemli başlıklar ve rehberler</p>
          </div>
        </div>
      </div>
      {/* Mobile: Card Layout, Desktop: Table Layout */}
      <div className="block md:hidden">
        <div className="divide-y divide-border">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/forum/topic/${post.id}`}
              className="block px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={post.author.avatarUrl || ''} />
                  <AvatarFallback className="text-xs">
                    {post.author.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm group-hover:text-primary transition-colors break-words mb-2">
                    {post.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <ProfileLink
                      username={post.author.username}
                      isVerified={post.author.isVerified}
                      className="hover:text-primary"
                      noLink
                    />
                    <span>•</span>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                      Duyuru
                    </Badge>
                    <span>•</span>
                    <span>{post.commentCount ?? 0} cevap</span>
                    <span>•</span>
                    <RelativeTime date={post.createdAt} className="whitespace-nowrap" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Konu</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground w-24">Etiket</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Cevap</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground w-28">Görüntülenme</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr
                key={post.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/forum/topic/${post.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={post.author.avatarUrl || ''} />
                      <AvatarFallback className="text-xs">
                        {post.author.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {post.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <ProfileLink
                          username={post.author.username}
                          isVerified={post.author.isVerified}
                          className="hover:text-primary"
                          noLink
                        />
                        <span>•</span>
                        <span className="truncate">{post.category.name}</span>
                        <span>•</span>
                        <RelativeTime date={post.createdAt} className="whitespace-nowrap" />
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs whitespace-nowrap shadow-sm shadow-amber-500/10">
                    Duyuru
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center text-sm text-muted-foreground whitespace-nowrap">
                  {post.commentCount ?? 0}
                </td>
                <td className="px-4 py-3 text-center text-sm text-muted-foreground whitespace-nowrap">
                  {post.viewCount.toLocaleString('tr-TR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PinnedPostsTable
