'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Heart, ArrowRight, Sparkles } from 'lucide-react'
import { ProfileLink } from './ProfileLink'
import { RelativeTime } from '@/components/ui/RelativeTime'

interface ForumPost {
  id: string
  title: string
  commentCount?: number
  likeCount?: number
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
  _count?: {
    comments: number
    likes: number
  }
}

interface ForumSummaryProps {
  newPosts: ForumPost[]
  mostCommented: ForumPost[]
  mostLiked: ForumPost[]
}

type TabType = 'new' | 'comments' | 'likes'

function ForumSummary({ newPosts, mostCommented, mostLiked }: ForumSummaryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('new')

  const activePosts = useMemo(() => {
    switch (activeTab) {
      case 'new':
        return newPosts
      case 'comments':
        return mostCommented
      case 'likes':
        return mostLiked
      default:
        return newPosts
    }
  }, [activeTab, newPosts, mostCommented, mostLiked])

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
  }, [])

  return (
    <div className="relative bg-card border border-border rounded-lg overflow-hidden w-full h-full flex flex-col">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10" />
      <div className="bg-muted/50 px-4 py-3 border-b border-border flex-shrink-0 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-semibold text-sm md:text-base">Forum Özeti</h3>
              <p className="text-xs text-muted-foreground hidden sm:block">Yeni, popüler ve en çok etkileşim alan konular</p>
            </div>
          </div>
          <Link href="/forum">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <span className="hidden sm:inline">Tümünü Gör</span>
              <span className="sm:hidden">Tümü</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0 relative z-10">
        <button
          onClick={() => handleTabChange('new')}
          className={`flex-1 px-3 sm:px-4 py-2.5 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeTab === 'new'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Yeni Konular</span>
          <span className="sm:hidden">Yeni</span>
        </button>
        <button
          onClick={() => handleTabChange('comments')}
          className={`flex-1 px-3 sm:px-4 py-2.5 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeTab === 'comments'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">En Çok Mesaj</span>
          <span className="sm:hidden">Mesaj</span>
        </button>
        <button
          onClick={() => handleTabChange('likes')}
          className={`flex-1 px-3 sm:px-4 py-2.5 text-xs font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${
            activeTab === 'likes'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          <Heart className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">En Çok Tepki</span>
          <span className="sm:hidden">Tepki</span>
        </button>
      </div>

      {/* Posts List */}
      <div className="divide-y divide-border flex-1 overflow-y-auto relative z-10">
        {activePosts.length > 0 ? (
          activePosts.slice(0, 8).map((post) => (
            <Link
              key={post.id}
              href={`/forum/topic/${post.id}`}
              className="block px-4 py-3 hover:bg-muted/30 hover:border-l-2 hover:border-l-primary transition-all group"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                  <AvatarImage src={post.author.avatarUrl || ''} />
                  <AvatarFallback className="text-xs">
                    {post.author.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1 mb-1">
                    {post.title}
                  </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <ProfileLink
                      username={post.author.username}
                      isVerified={post.author.isVerified}
                      className="hover:text-primary"
                      noLink
                    />
                    <span className="hidden sm:inline">•</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 hidden sm:inline-flex">
                      {post.category.name}
                    </Badge>
                    <span>•</span>
                    <RelativeTime date={post.createdAt} className="whitespace-nowrap" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                  <div className="flex items-center gap-1 whitespace-nowrap rounded-full bg-primary/10 px-2 py-1 text-primary">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{post.commentCount ?? post._count?.comments ?? 0}</span>
                  </div>
                  {activeTab === 'likes' ? (
                    <div className="flex items-center gap-1 whitespace-nowrap rounded-full bg-rose-500/10 px-2 py-1 text-rose-400">
                      <Heart className="h-3.5 w-3.5" />
                      <span>{post.likeCount ?? post._count?.likes ?? 0}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Henüz konu yok
          </div>
        )}
      </div>
    </div>
  )
}

export default ForumSummary
export { ForumSummary }
