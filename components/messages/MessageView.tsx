'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2, ArrowLeft, Send } from 'lucide-react'
import RelativeTime from '@/components/ui/RelativeTime'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  createdAt: Date
  isRead: boolean
  sender: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

interface Session {
  user: {
    id: string
    username: string
    role: string
  }
}

interface MessageViewProps {
  otherUser: {
    id: string
    username: string
    avatarUrl: string | null
    isVerified: boolean
  }
  messages: Message[]
  session: Session
}

function MessageView({ otherUser, messages: initialMessages, session: initialSession }: MessageViewProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [messages, setMessages] = useState(initialMessages)
  const [messageContent, setMessageContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageContent.trim() || !session) return

    setIsSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: otherUser.id,
          content: messageContent,
        }),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessages((prev) => [...prev, newMessage])
        setMessageContent('')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Mesaj gönderilemedi')
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="page-container-narrow py-6 md:py-10 overflow-x-hidden">
      <Link href="/messages" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 md:mb-6 text-sm md:text-base">
        <ArrowLeft className="h-4 w-4" />
        <span className="truncate">Mesajlara Dön</span>
      </Link>

      <Card className="glass-effect">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center gap-3 md:gap-4 p-4 border-b">
            <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
              <AvatarImage src={otherUser.avatarUrl || ''} />
              <AvatarFallback className="text-sm md:text-base">
                {otherUser.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm md:text-base truncate">{otherUser.username}</span>
                {otherUser.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[400px] md:h-[500px] overflow-y-auto p-3 md:p-4 space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender.id === session?.user?.id
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 md:gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.sender.avatarUrl || ''} />
                    <AvatarFallback className="text-xs">
                      {message.sender.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 min-w-0 ${isOwn ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block p-2 md:p-3 rounded-lg max-w-[85%] sm:max-w-[75%] md:max-w-none ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-xs md:text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                      <RelativeTime date={message.createdAt} />
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 md:p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Mesajınızı yazın..."
                rows={2}
                disabled={isSending}
                className="resize-none flex-1 min-w-0"
              />
              <Button type="submit" disabled={isSending || !messageContent.trim()} className="min-h-[44px] min-w-[44px] flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default MessageView

