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
    <div className="container py-4 sm:py-6 md:py-8 max-w-5xl px-3 sm:px-4 md:px-5 lg:px-6 max-w-full overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 break-words">Mesajlar</h1>
        <p className="text-xs sm:text-sm text-muted-foreground break-words">Topluluk üyeleriyle mesajlaşın</p>
      </div>

      {conversationList.length === 0 ? (
        <Card className="glass-effect">
          <CardContent className="pt-8 sm:pt-10 pb-8 sm:pb-10 text-center">
            <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground break-words">Henüz mesajınız yok</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Konuşmalar ({conversationList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 sm:space-y-2">
              {conversationList.map((conv) => (
                <Link
                  key={conv.user.id}
                  href={`/messages/${conv.user.id}`}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage src={conv.user.avatarUrl || ''} />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {conv.user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1 flex-wrap">
                      <span className="font-semibold text-xs sm:text-sm truncate">
                        {conv.user.username}
                      </span>
                      {conv.user.isVerified && (
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      )}
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="ml-auto text-[10px]">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate break-words line-clamp-1">
                      {conv.lastMessage.content}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
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

