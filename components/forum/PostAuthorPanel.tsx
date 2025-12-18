'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Shield, Crown, User, MessageSquare, Heart } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface PostAuthorPanelProps {
  author: {
    id: string
    username: string
    displayName?: string | null
    avatarUrl?: string | null
    role: 'USER' | 'MODERATOR' | 'ADMIN'
    isVerified: boolean
    postCount?: number
    commentCount?: number
    createdAt: Date | string
  }
  postNumber?: number
}

export function PostAuthorPanel({ author, postNumber }: PostAuthorPanelProps) {
  const getRoleBadge = () => {
    switch (author.role) {
      case 'ADMIN':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <Crown className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
      case 'MODERATOR':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Shield className="h-3 w-3 mr-1" />
            Moderator
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            <User className="h-3 w-3 mr-1" />
            Üye
          </Badge>
        )
    }
  }

  const totalPosts = (author.postCount || 0) + (author.commentCount || 0)

  return (
    <div className="w-full md:w-64 flex-shrink-0 bg-muted/30 md:border-r border-b md:border-b-0 border-border p-3 md:p-4">
      <div className="flex flex-row md:flex-col items-center md:text-center space-y-0 md:space-y-3 gap-3 md:gap-0">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Link href={`/profile/${author.username}`} className="block">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
              <AvatarImage src={author.avatarUrl || ''} />
              <AvatarFallback className="text-xl md:text-2xl">
                {author.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>

        {/* Username */}
        <div className="flex-1 md:w-full min-w-0">
          <Link
            href={`/profile/${author.username}`}
            className="font-semibold text-sm md:text-base lg:text-lg hover:text-primary transition-colors flex items-center justify-center gap-1 break-words"
          >
            <span className="truncate">{author.displayName || author.username}</span>
            {author.isVerified ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : null}
          </Link>
        </div>

        {/* Role Badge */}
        <div className="md:w-full">{getRoleBadge()}</div>

        {/* Stats - Hidden on mobile */}
        <div className="hidden md:block w-full space-y-2 text-sm">
          <div className="flex items-center justify-between px-2">
            <span className="text-muted-foreground">Mesajlar</span>
            <span className="font-medium">{totalPosts.toLocaleString('tr-TR')}</span>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-muted-foreground">Konular</span>
            <span className="font-medium">{(author.postCount || 0).toLocaleString('tr-TR')}</span>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-muted-foreground">Yorumlar</span>
            <span className="font-medium">{(author.commentCount || 0).toLocaleString('tr-TR')}</span>
          </div>
        </div>

        {/* Join Date - Hidden on mobile */}
        <div className="hidden md:block w-full pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <div>Katılım Tarihi</div>
            <div className="font-medium mt-1">
              {new Date(author.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
              })}
            </div>
          </div>
        </div>

        {/* Post Number */}
        {postNumber ? (
          <div className="w-full pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground text-center md:text-left">
              <span className="font-medium">#{postNumber}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

