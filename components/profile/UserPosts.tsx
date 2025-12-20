import { prisma } from '@/lib/db'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Pin, Lock } from 'lucide-react'

interface UserPostsProps {
  userId: string
}

async function UserPosts({ userId }: UserPostsProps) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
  })

  if (posts.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Henüz konu açılmamış
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {post.isPinned && (
                  <Pin className="h-3 w-3 text-yellow-500" />
                )}
                {post.isLocked && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
                <Badge variant="outline" className="text-xs">
                  {post.category.name}
                </Badge>
              </div>
              <Link
                href={`/forum/topic/${post.id}`}
                className="font-semibold hover:text-primary block mb-1"
              >
                {post.title}
              </Link>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{formatRelativeTime(post.createdAt)}</span>
                <span>💬 {post._count.comments}</span>
                <span>❤️ {post._count.likes}</span>
                <span>👁 {post.viewCount}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      {posts.length >= 10 && (
        <div className="text-center pt-4">
          <Link href={`/forum?user=${userId}`} className="text-sm text-primary hover:underline">
            Tüm konuları gör →
          </Link>
        </div>
      )}
    </div>
  )
}

export default UserPosts
export { UserPosts }

