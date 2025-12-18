'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/utils'
import { CheckCircle2, MessageSquare, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface BlogPostViewProps {
  post: any
  session: any
}

export function BlogPostView({ post, session: initialSession }: BlogPostViewProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [commentContent, setCommentContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comments, setComments] = useState(post.comments || [])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !commentContent.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/blog/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent }),
      })

      if (response.ok) {
        const newComment = await response.json()
        setComments([...comments, newComment])
        setCommentContent('')
        toast({
          title: 'Yorum eklendi',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Yorum eklenemedi')
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Yorumlar ({comments.length})</h2>
      </div>

      {/* Comment Form */}
      {session && (
        <Card className="glass-effect mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <Textarea
                placeholder="Yorumunuzu yazın..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={4}
                disabled={isSubmitting}
                className="resize-none"
              />
              <Button type="submit" disabled={isSubmitting || !commentContent.trim()} className="gap-2">
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Gönderiliyor...' : 'Yorum Yap'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!session && (
        <Card className="glass-effect mb-6">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Yorum yapmak için giriş yapmalısınız
            </p>
            <Link href="/login">
              <Button>Giriş Yap</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment: any) => (
          <Card key={comment.id} className="glass-effect">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={comment.author.avatarUrl || ''} />
                  <AvatarFallback>
                    {comment.author.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/profile/${comment.author.username}`}
                      className="font-semibold hover:text-primary flex items-center gap-1"
                    >
                      {comment.author.username}
                      {comment.author.isVerified && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {comments.length === 0 && (
        <Card className="glass-effect">
          <CardContent className="pt-12 pb-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Henüz yorum yapılmamış</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

