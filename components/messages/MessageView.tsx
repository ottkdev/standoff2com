'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2, ArrowLeft, Send } from 'lucide-react'
import { RelativeTime } from '@/components/ui/RelativeTime'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface MessageViewProps {
  otherUser: {
    id: string
    username: string
    avatarUrl: string | null
    isVerified: boolean
  }
  messages: any[]
  session: any
}

export function MessageView({ otherUser, messages: initialMessages, session: initialSession }: MessageViewProps) {
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
        setMessages([...messages, newMessage])
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
    <div className="container py-10 max-w-4xl">
      <Link href="/messages" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" />
        Mesajlara Dön
      </Link>

      <Card className="glass-effect">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b">
            <Avatar>
              <AvatarImage src={otherUser.avatarUrl || ''} />
              <AvatarFallback>
                {otherUser.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{otherUser.username}</span>
                {otherUser.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isOwn = message.senderId === session?.user?.id
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender.avatarUrl || ''} />
                    <AvatarFallback>
                      {message.sender.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <RelativeTime date={message.createdAt} />
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Mesajınızı yazın..."
                rows={2}
                disabled={isSending}
                className="resize-none"
              />
              <Button type="submit" disabled={isSending || !messageContent.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

