import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { MessageView } from '@/components/messages/MessageView'

interface PageProps {
  params: {
    userId: string
  }
}

export default async function ConversationPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      isVerified: true,
    },
  })

  if (!otherUser) {
    notFound()
  }

  if (otherUser.id === session.user.id) {
    redirect('/messages')
  }

  // Get messages
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: otherUser.id },
        { senderId: otherUser.id, receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  })

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      receiverId: session.user.id,
      senderId: otherUser.id,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })

  return <MessageView otherUser={otherUser} messages={messages} session={session} />
}

