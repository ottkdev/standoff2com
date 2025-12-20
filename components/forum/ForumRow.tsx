'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Eye, Pin, CheckCircle2 } from 'lucide-react'
import ProfileLink from '@/components/home/ProfileLink'
import RelativeTime from '@/components/ui/RelativeTime'

interface ForumRowProps {
  post: {
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
}

export function ForumRow({ post }: ForumRowProps) {
  return (
    <div className="rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all group">
      <Link 
        href={`/forum/topic/${post.id}`}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 cursor-pointer"
      >
        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={post.author.avatarUrl || ''} />
          <AvatarFallback>
            {post.author.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {post.isPinned ? (
              <Pin className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            ) : null}
            <h3 className="font-semibold break-words group-hover:text-primary transition-colors text-sm md:text-base">
              {post.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {post.category.name}
            </Badge>
            <ProfileLink
              username={post.author.username}
              isVerified={post.author.isVerified}
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
              noLink
            />
            <span className="text-xs text-muted-foreground">•</span>
            <RelativeTime date={post.createdAt} className="text-xs text-muted-foreground" />
          </div>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{post.commentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{post.viewCount.toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}

