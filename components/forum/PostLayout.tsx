'use client'

import PostAuthorPanel from './PostAuthorPanel'
import PostContent from './PostContent'

interface PostLayoutProps {
  // Author data
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
  // Post data
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
  // Current user
  currentUserId?: string
  currentUserRole?: string
  // Actions
  onLike?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onReply?: (postId: string) => void
  onQuote?: (content: string) => void
}

export function PostLayout({
  author,
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
  currentUserId,
  currentUserRole,
  onLike,
  onEdit,
  onDelete,
  onReply,
  onQuote,
}: PostLayoutProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/20 transition-colors">
      <div className="flex flex-col md:flex-row w-full overflow-x-hidden">
        {/* Left Panel - Author Info */}
        <PostAuthorPanel author={author} postNumber={postNumber} />

        {/* Right Panel - Content */}
        <PostContent
          id={id}
          title={title}
          content={content}
          images={images}
          createdAt={createdAt}
          updatedAt={updatedAt}
          isPinned={isPinned}
          isLocked={isLocked}
          likeCount={likeCount}
          commentCount={commentCount}
          viewCount={viewCount}
          isLiked={isLiked}
          postNumber={postNumber}
          category={category}
          authorId={author.id}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onLike={onLike}
          onEdit={onEdit}
          onDelete={onDelete}
          onReply={onReply}
          onQuote={onQuote}
        />
      </div>
    </div>
  )
}

export default PostLayout

