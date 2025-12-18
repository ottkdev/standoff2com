import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForumService } from '@/lib/services/forum.service'
import { formatRelativeTime } from '@/lib/utils'
import { PostView } from '@/components/forum/PostView'

interface PageProps {
  params: {
    id: string
  }
}

export default async function TopicPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const post = await ForumService.getPostById(params.id, session?.user?.id)

  if (!post) {
    notFound()
  }

  return <PostView post={post} session={session} />
}

