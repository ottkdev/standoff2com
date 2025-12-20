'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react'
import ProfileLink from './ProfileLink'
import RelativeTime from '@/components/ui/RelativeTime'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | string | null
  createdAt: Date | string
  author: {
    username: string
    avatarUrl: string | null
    isVerified: boolean
  }
  category: {
    name: string
    slug: string
  } | null
}

interface BlogSummaryProps {
  posts: BlogPost[]
}

function BlogSummary({ posts }: BlogSummaryProps) {
  if (posts.length === 0) return null

  return (
    <div className="w-full space-y-4 relative">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-yellow-500/10 rounded-2xl blur-2xl" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-semibold text-lg md:text-xl">Haberler & Rehberler</h3>
            <p className="text-xs text-muted-foreground hidden sm:block">Oyuncular için güncel duyurular ve rehberler</p>
          </div>
        </div>
        <Link href="/blog">
          <span className="text-sm text-primary hover:underline flex items-center gap-1">
            <span className="hidden sm:inline">Tümünü gör</span>
            <span className="sm:hidden">Tümü</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="hover:border-primary/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all h-full flex flex-col overflow-hidden">
            <Link href={`/blog/${post.slug}`} className="contents">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-amber-400 to-orange-500" />
              <CardHeader className="pb-2 flex-shrink-0">
                {post.category ? (
                  <Badge variant="secondary" className="w-fit mb-2 text-xs">
                    {post.category.name}
                  </Badge>
                ) : null}
                <CardTitle className="text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-shrink-0">
                  {post.excerpt || 'Yazı özeti yok'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                  <Avatar className="h-5 w-5 flex-shrink-0">
                    <AvatarImage src={post.author.avatarUrl || ''} />
                    <AvatarFallback className="text-xs">
                      {post.author.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ProfileLink
                    username={post.author.username}
                    isVerified={post.author.isVerified}
                    className="hover:text-primary truncate flex-1 min-w-0"
                    noLink
                  />
                  <span>•</span>
                  <RelativeTime date={post.publishedAt || post.createdAt} className="whitespace-nowrap" />
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default BlogSummary
