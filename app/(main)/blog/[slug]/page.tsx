import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { BlogPostView } from '@/components/blog/BlogPostView'
import { BlogLikeButton } from '@/components/blog/BlogLikeButton'
import { BookOpen, Calendar, User, Heart, MessageSquare, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const post = await prisma.blogPost.findUnique({
    where: {
      slug: params.slug,
      isPublished: true,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          isVerified: true,
          displayName: true,
        },
      },
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      comments: {
        where: {
          parentId: null,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  isVerified: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      likes: session?.user?.id
        ? {
            where: {
              userId: session.user.id,
            },
          }
        : false,
    },
  })

  if (!post) {
    notFound()
  }

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  })

  const isLiked = post.likes && post.likes.length > 0

  return (
    <div className="container py-10 max-w-4xl">
      <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        Blog'a Dön
      </Link>

      <article>
        {/* Header */}
        <div className="mb-8">
          {post.category && (
            <Link href={`/blog?category=${post.category.slug}`}>
              <Badge variant="secondary" className="mb-4">
                {post.category.name}
              </Badge>
            </Link>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author.avatarUrl || ''} />
                <AvatarFallback>{post.author.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <Link href={`/profile/${post.author.username}`} className="hover:text-primary flex items-center gap-1">
                {post.author.username}
                {post.author.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.publishedAt || post.createdAt)}
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {post.viewCount} görüntülenme
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Content */}
        <Card className="glass-effect mb-8">
          <CardContent className="pt-6">
            <div className="prose prose-invert prose-lg max-w-none">
              <div className="whitespace-pre-wrap">{post.content}</div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 py-6 border-y mb-8">
          <BlogLikeButton
            postId={post.id}
            initialLiked={isLiked}
            initialCount={post.likeCount}
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            {post.commentCount} yorum
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <BlogPostView post={post} session={session} />
    </div>
  )
}

