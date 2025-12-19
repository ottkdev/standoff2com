'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ForumRow } from '@/components/forum/ForumRow'
import { MessageSquare, TrendingUp, Eye, ArrowRight, Pin } from 'lucide-react'

interface Post {
  id: string
  title: string
  isPinned: boolean
  viewCount: number
  commentCount: number
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

interface ForumActivityProps {
  newPosts: Post[]
  mostCommented: Post[]
  mostViewed: Post[]
}

type TabType = 'new' | 'comments' | 'views'

export function ForumActivity({ newPosts, mostCommented, mostViewed }: ForumActivityProps) {
  const [activeTab, setActiveTab] = useState<TabType>('new')

  const getActivePosts = () => {
    switch (activeTab) {
      case 'new':
        return newPosts
      case 'comments':
        return mostCommented
      case 'views':
        return mostViewed
      default:
        return newPosts
    }
  }

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'new':
        return 'Yeni Konular'
      case 'comments':
        return 'En Çok Mesaj'
      case 'views':
        return 'En Çok Görüntüleme'
    }
  }

  const activePosts = getActivePosts()
  const pinnedPosts = activePosts.filter((p) => p.isPinned)
  const normalPosts = activePosts.filter((p) => !p.isPinned)

  return (
    <section className="container py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">Topluluktan Son Konular</h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">Forum aktiviteleri ve tartışmalar</p>
        </div>
        <Button variant="ghost" className="gap-2 group w-full md:w-auto" asChild>
          <Link href="/forum">
            Tümünü Gör
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>

      <Card className="glass-effect">
        <CardHeader>
          {/* Tabs */}
          <div className="flex gap-2 border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'new'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Yeni Konular</span>
                <span className="sm:hidden">Yeni</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'comments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">En Çok Mesaj</span>
                <span className="sm:hidden">Mesaj</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('views')}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'views'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <Eye className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">En Çok Görüntüleme</span>
                <span className="sm:hidden">Görüntüleme</span>
              </div>
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Pinned Posts */}
          {pinnedPosts.length > 0 ? (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4 text-green-400">
                <Pin className="h-4 w-4" />
                <span className="text-sm font-semibold">Sabit Konular</span>
              </div>
              <div className="space-y-2">
                {pinnedPosts.map((post) => (
                  <div key={post.id} className="bg-yellow-500/5 border-yellow-500/20 rounded-lg">
                    <ForumRow post={post} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Normal Posts */}
          {normalPosts.length > 0 ? (
            <div>
              {pinnedPosts.length > 0 ? (
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-semibold">Normal Konular</span>
                </div>
              ) : null}
              <div className="space-y-2">
                {normalPosts.map((post) => (
                  <ForumRow key={post.id} post={post} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Empty State */}
          {activePosts.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Henüz konu yok</p>
            </div>
          )}

          {/* Footer Link */}
          <div className="mt-6 pt-6 border-t text-center">
            <Button variant="ghost" className="gap-2 group" asChild>
              <Link href="/forum">
                Forumun tamamını gör
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

