import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Get all unique conversations
  const [sentMessages, receivedMessages] = await Promise.all([
    prisma.message.findMany({
      where: { senderId: session.user.id },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.message.findMany({
      where: { receiverId: session.user.id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Group by user
  const conversations = new Map()
  
  sentMessages.forEach((msg) => {
    const userId = msg.receiverId
    if (!conversations.has(userId)) {
      conversations.set(userId, {
        user: msg.receiver,
        lastMessage: msg,
        unreadCount: 0,
      })
    } else {
      const conv = conversations.get(userId)
      if (msg.createdAt > conv.lastMessage.createdAt) {
        conv.lastMessage = msg
      }
    }
  })

  receivedMessages.forEach((msg) => {
    const userId = msg.senderId
    if (!conversations.has(userId)) {
      conversations.set(userId, {
        user: msg.sender,
        lastMessage: msg,
        unreadCount: msg.isRead ? 0 : 1,
      })
    } else {
      const conv = conversations.get(userId)
      if (msg.createdAt > conv.lastMessage.createdAt) {
        conv.lastMessage = msg
      }
      if (!msg.isRead) {
        conv.unreadCount += 1
      }
    }
  })

  const conversationList = Array.from(conversations.values()).sort(
    (a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
  )

  // Calculate stable "now" once for server-side rendering
  // This ensures server and client render the same relative time initially
  const stableNow = new Date()

  return (
    <div className="container py-6 md:py-10 max-w-4xl px-4 md:px-6 max-w-full overflow-x-hidden">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words">Mesajlar</h1>
        <p className="text-sm md:text-base text-muted-foreground break-words">Topluluk üyeleriyle mesajlaşın</p>
      </div>

      {conversationList.length === 0 ? (
        <Card className="glass-effect">
          <CardContent className="pt-12 pb-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Henüz mesajınız yok</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle>Konuşmalar ({conversationList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conversationList.map((conv) => (
                <Link
                  key={conv.user.id}
                  href={`/messages/${conv.user.id}`}
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                    <AvatarImage src={conv.user.avatarUrl || ''} />
                    <AvatarFallback className="text-sm md:text-base">
                      {conv.user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm md:text-base truncate">
                        {conv.user.username}
                      </span>
                      {conv.user.isVerified && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="ml-auto text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate break-words">
                      {conv.lastMessage.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                      {formatRelativeTime(conv.lastMessage.createdAt, stableNow)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

