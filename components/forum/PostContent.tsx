'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/ui/RelativeTime'
import {
  Heart,
  MessageSquare,
  Quote,
  Reply,
  Edit,
  Trash2,
  MoreVertical,
  Pin,
  Lock,
} from 'lucide-react'
import NextImage from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface PostContentProps {
  id: string
  title?: string
  content: string
  images?: Array<{ id: string; url: string }>
  createdAt: Date | string
  updatedAt?: Date | string
  isPinned?: boolean
  isLocked?: boolean
  likeCount: number
  commentCount: number
  viewCount?: number
  isLiked?: boolean
  postNumber?: number
  category?: {
    name: string
    slug: string
  }
  authorId: string
  currentUserId?: string
  currentUserRole?: string
  onLike?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onReply?: (postId: string) => void
  onQuote?: (content: string) => void
}

export function PostContent({
  id,
  title,
  content,
  images,
  createdAt,
  updatedAt,
  isPinned,
  isLocked,
  likeCount,
  commentCount,
  viewCount,
  isLiked,
  postNumber,
  category,
  authorId,
  currentUserId,
  currentUserRole,
  onLike,
  onEdit,
  onDelete,
  onReply,
  onQuote,
}: PostContentProps) {
  const { toast } = useToast()
  const router = useRouter()
  const isOwner = currentUserId === authorId
  const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR'

  const handleQuote = () => {
    if (onQuote) {
      onQuote(content)
    }
  }

  const handleReply = () => {
    if (onReply) {
      onReply(id)
    }
  }

  return (
    <div className="flex-1 bg-background p-3 sm:p-4 md:p-6 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {isPinned ? (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Pin className="h-3 w-3 mr-1" />
                Sabit
              </Badge>
            ) : null}
            {isLocked ? (
              <Badge variant="outline" className="text-muted-foreground">
                <Lock className="h-3 w-3 mr-1" />
                Kilitli
              </Badge>
            ) : null}
            {category ? (
              <Link href={`/forum/${category.slug}`}>
                <Badge variant="outline" className="hover:bg-primary/10">
                  {category.name}
                </Badge>
              </Link>
            ) : null}
            {postNumber ? (
              <span className="text-xs text-muted-foreground">#{postNumber}</span>
            ) : null}
          </div>
          {title ? (
            <h1 className="text-xl md:text-2xl font-bold mb-2 break-words">{title}</h1>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
            <RelativeTime date={createdAt} />
            {updatedAt && updatedAt !== createdAt ? (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="text-xs whitespace-nowrap">Düzenlendi: <RelativeTime date={updatedAt} /></span>
              </>
            ) : null}
            {viewCount !== undefined ? (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap">{viewCount.toLocaleString('tr-TR')} görüntülenme</span>
              </>
            ) : null}
          </div>
        </div>
        {(isOwner || isAdmin) ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && onEdit ? (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </DropdownMenuItem>
              ) : null}
              {(isOwner || isAdmin) && onDelete ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none mb-6 break-words">
        <div className="whitespace-pre-wrap text-foreground break-words">{content}</div>
      </div>

      {/* Images */}
      {images && images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-video rounded-lg overflow-hidden border border-border"
            >
              <NextImage
                src={image.url}
                alt="Post image"
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-border">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {onLike ? (
            <Button
              variant={isLiked ? 'default' : 'outline'}
              size="sm"
              onClick={onLike}
              disabled={!currentUserId}
              className="min-h-[44px]"
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount}
            </Button>
          ) : null}
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            {commentCount} yorum
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onQuote ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleQuote}
              disabled={!currentUserId}
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              <Quote className="h-4 w-4 mr-2" />
              Alıntıla
            </Button>
          ) : null}
          {onReply && !isLocked ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReply}
              disabled={!currentUserId}
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              <Reply className="h-4 w-4 mr-2" />
              Cevapla
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

