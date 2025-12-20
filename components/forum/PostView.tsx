'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, Pin, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { PostLayout } from './PostLayout'
import { PostWithDetails } from '@/lib/types/forum'
import { ReportButton } from '@/components/report/ReportButton'

interface PostViewProps {
  post: PostWithDetails
  session: Session | null
}

function PostView({ post, session }: PostViewProps) {
  const { data: sessionData, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [commentContent, setCommentContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postState, setPostState] = useState(post)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [quoteContent, setQuoteContent] = useState<string | null>(null)
  const [replyToId, setReplyToId] = useState<string | null>(null)

  const currentUserId = sessionData?.user?.id
  const currentUserRole = sessionData?.user?.role
  const isOwner = currentUserId === postState.authorId
  const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR'

  const handleLike = async () => {
    if (!sessionData) {
      toast({
        title: 'Giriş gerekli',
        description: 'Beğenmek için giriş yapmalısınız',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/forum/posts/${post.id}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setPostState({
          ...postState,
          isLiked: data.liked,
          likeCount: data.liked
            ? postState.likeCount + 1
            : postState.likeCount - 1,
        })
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Bir hata oluştu',
        variant: 'destructive',
      })
    }
  }

  const handleCommentLike = async (commentId: string) => {
    if (!sessionData) {
      toast({
        title: 'Giriş gerekli',
        description: 'Beğenmek için giriş yapmalısınız',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/forum/comments/${commentId}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setPostState({
          ...postState,
          comments: (postState.comments || []).map((c: NonNullable<PostWithDetails['comments']>[number]) =>
            c.id === commentId
              ? {
                  ...c,
                  isLiked: data.liked,
                  likeCount: data.liked
                    ? (c.likeCount || c._count?.likes || 0) + 1
                    : (c.likeCount || c._count?.likes || 0) - 1,
                }
              : c
          ),
        })
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Bir hata oluştu',
        variant: 'destructive',
      })
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionData || !commentContent.trim()) return

    setIsSubmitting(true)
    try {
      const body: { content: string; parentId?: string } = { content: commentContent }
      if (replyToId) {
        body.parentId = replyToId
      }
      if (quoteContent) {
        body.content = `[quote]${quoteContent}[/quote]\n\n${commentContent}`
      }

      const response = await fetch(`/api/forum/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const newComment = await response.json()
        setPostState({
          ...postState,
          comments: [...postState.comments, newComment],
          commentCount: postState.commentCount + 1,
        })
        setCommentContent('')
        setQuoteContent(null)
        setReplyToId(null)
        toast({
          title: 'Yorum eklendi',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Yorum eklenemedi')
      }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Bir hata oluştu'
        toast({
          title: 'Hata',
          description: message,
          variant: 'destructive',
        })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPost = () => {
    router.push(`/forum/topic/${postState.id}/edit`)
  }

  const handleDeletePost = async () => {
    if (!confirm('Bu konuyu silmek istediğinize emin misiniz?')) return
    try {
      const response = await fetch(`/api/forum/posts/${postState.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast({ title: 'Konu silindi' })
        router.push(`/forum/${postState.category.slug}`)
      }
    } catch (error) {
      toast({ title: 'Hata', variant: 'destructive' })
    }
  }

  const handleEditComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/forum/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingCommentContent }),
      })
      if (response.ok) {
        setPostState({
          ...postState,
          comments: (postState.comments || []).map((c: NonNullable<PostWithDetails['comments']>[number]) =>
            c.id === commentId ? { ...c, content: editingCommentContent } : c
          ),
        })
        setEditingCommentId(null)
        setEditingCommentContent('')
        toast({ title: 'Yorum güncellendi' })
      }
    } catch (error) {
      toast({ title: 'Hata', variant: 'destructive' })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return
    try {
      const response = await fetch(`/api/forum/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setPostState({
          ...postState,
          comments: (postState.comments || []).filter((c: NonNullable<PostWithDetails['comments']>[number]) => c.id !== commentId),
          commentCount: postState.commentCount - 1,
        })
        toast({ title: 'Yorum silindi' })
      }
    } catch (error) {
      toast({ title: 'Hata', variant: 'destructive' })
    }
  }

  const handleQuote = (content: string) => {
    setQuoteContent(content)
    setCommentContent(`[quote]${content}[/quote]\n\n`)
  }

  const handleReply = (postId: string) => {
    setReplyToId(postId)
    const comment = (postState.comments || []).find((c: NonNullable<PostWithDetails['comments']>[number]) => c.id === postId)
    if (comment) {
      setCommentContent(`@${comment.author.username} `)
    }
  }

  // Calculate post numbers
  let postNumber = 1

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 max-w-full overflow-x-hidden">
      {/* Main Post */}
      <div className="mb-4 md:mb-6">
        <PostLayout
          author={postState.author}
          id={postState.id}
          title={postState.title}
          content={postState.content}
          images={postState.images}
          createdAt={postState.createdAt}
          updatedAt={postState.updatedAt}
          isPinned={postState.isPinned}
          isLocked={postState.isLocked}
          likeCount={postState.likeCount}
          commentCount={postState.commentCount}
          viewCount={postState.viewCount}
          isLiked={postState.isLiked}
          postNumber={postNumber++}
          category={postState.category}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onLike={handleLike}
          onEdit={isOwner ? handleEditPost : undefined}
          onDelete={(isOwner || isAdmin) ? handleDeletePost : undefined}
        />
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
          <h2 className="text-xl md:text-2xl font-bold break-words">
            Yorumlar ({postState.commentCount})
          </h2>
        </div>

        {/* Comment Form */}
        {sessionData && !postState.isLocked && (
          <Card className="mb-6">
            <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                {quoteContent && (
                  <div className="p-3 bg-muted rounded-lg border-l-4 border-primary break-words">
                    <div className="text-xs md:text-sm text-muted-foreground mb-1">Alıntı:</div>
                    <div className="text-xs md:text-sm whitespace-pre-wrap break-words">{quoteContent}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 min-h-[44px]"
                      onClick={() => {
                        setQuoteContent(null)
                        setCommentContent('')
                      }}
                    >
                      Alıntıyı Kaldır
                    </Button>
                  </div>
                )}
                {replyToId && (
                  <div className="p-3 bg-muted rounded-lg break-words">
                    <div className="text-xs md:text-sm text-muted-foreground break-words">
                      {(postState.comments || []).find((c: NonNullable<PostWithDetails['comments']>[number]) => c.id === replyToId)?.author.username}
                      {' '}kullanıcısına cevap veriyorsunuz
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 min-h-[44px]"
                      onClick={() => {
                        setReplyToId(null)
                        setCommentContent('')
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                )}
                <Textarea
                  placeholder="Yorumunuzu yazın..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={6}
                  disabled={isSubmitting}
                  className="w-full resize-none"
                />
                <Button type="submit" disabled={isSubmitting || !commentContent.trim()} className="w-full sm:w-auto min-h-[44px]">
                  {isSubmitting ? 'Gönderiliyor...' : 'Yorum Yap'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {postState.isLocked && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground text-center justify-center">
                <Lock className="h-4 w-4" />
                <p>Bu konu kilitlenmiştir. Yeni yorum eklenemez.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {(postState.comments || []).map((comment: NonNullable<PostWithDetails['comments']>[number]) => {
            const isCommentOwner = currentUserId === comment.authorId
            const isCommentAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR'
            const isEditing = editingCommentId === comment.id

            return (
              <div key={comment.id}>
                <PostLayout
                  author={comment.author}
                  id={comment.id}
                  content={comment.content}
                  createdAt={comment.createdAt}
                  updatedAt={comment.updatedAt}
                  likeCount={comment._count?.likes || comment.likeCount || 0}
                  commentCount={0}
                  isLiked={comment.isLiked}
                  postNumber={postNumber++}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onLike={() => handleCommentLike(comment.id)}
                  onEdit={
                    isCommentOwner && !isEditing
                      ? () => {
                          setEditingCommentId(comment.id)
                          setEditingCommentContent(comment.content)
                        }
                      : isEditing
                      ? () => handleEditComment(comment.id)
                      : undefined
                  }
                  onDelete={(isCommentOwner || isCommentAdmin) ? () => handleDeleteComment(comment.id) : undefined}
                  onReply={!postState.isLocked ? () => handleReply(comment.id) : undefined}
                  onQuote={!postState.isLocked ? () => handleQuote(comment.content) : undefined}
                />
                {isEditing && (
                  <Card className="mt-2 ml-0 md:ml-64">
                    <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
                      <div className="space-y-2">
                        <Textarea
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          rows={4}
                          className="w-full resize-none"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment.id)}
                            className="min-h-[44px] flex-1 sm:flex-initial"
                          >
                            Kaydet
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCommentId(null)
                              setEditingCommentContent('')
                            }}
                          >
                            İptal
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          })}
        </div>

        {(!postState.comments || postState.comments.length === 0) && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Henüz yorum yapılmamış</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default PostView
export { PostView }
