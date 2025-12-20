'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, Send, Loader2, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Message {
  id: string
  senderType: 'USER' | 'ADMIN'
  senderId: string | null
  message: string
  createdAt: string
}

interface Ticket {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  messages: Message[]
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  WAITING_USER: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CLOSED: 'bg-green-500/20 text-green-400 border-green-500/30',
}

const statusLabels: Record<string, string> = {
  OPEN: 'Açık',
  IN_PROGRESS: 'İşlemde',
  WAITING_USER: 'Yanıt Bekleniyor',
  CLOSED: 'Kapalı',
}

export default function TicketDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }
    fetchTicket()
  }, [session, router, params.id])

  useEffect(() => {
    scrollToBottom()
  }, [ticket?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/support/tickets/${params.id}`, {
        credentials: 'include',
      })
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setTicket(data)
      } else {
        const error = await response.json()
        toast({
          title: 'Hata',
          description: error.error || 'Destek talebi bulunamadı',
          variant: 'destructive',
        })
        router.push('/support')
      }
    } catch (error) {
      console.error('Fetch ticket error:', error)
      toast({
        title: 'Hata',
        description: 'Bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || ticket?.status === 'CLOSED') return

    setSending(true)

    try {
      const response = await fetch(`/api/support/tickets/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: message.trim() }),
      })

      const data = await response.json()

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Mesaj gönderilemedi')
      }

      setMessage('')
      await fetchTicket()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <div className="page-container-narrow py-4 sm:py-6 md:py-8 overflow-x-hidden">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!ticket) {
    return null
  }

  const isClosed = ticket.status === 'CLOSED'

  return (
    <div className="container py-4 sm:py-6 md:py-8 max-w-4xl px-3 sm:px-4 md:px-5 lg:px-6 w-full overflow-x-hidden">
      <Link
        href="/support"
        className="inline-flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-primary mb-3 sm:mb-4 text-xs sm:text-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="truncate">Destek Taleplerine Dön</span>
      </Link>

      <Card className="glass-effect mb-4 sm:mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 break-words leading-tight">
                {ticket.subject}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Badge className={`${statusColors[ticket.status] || 'bg-muted'} text-[10px] sm:text-xs px-2 py-1`}>
                  {statusLabels[ticket.status] || ticket.status}
                </Badge>
                <span>•</span>
                <span>{formatRelativeTime(ticket.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="glass-effect mb-4 sm:mb-6">
        <CardContent className="p-0">
          <div className="h-[400px] sm:h-[500px] md:h-[600px] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {ticket.messages.map((msg) => {
              const isUser = msg.senderType === 'USER'
              const isCurrentUser = msg.senderId === session?.user?.id

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-start' : 'justify-end'}`}
                >
                  {isUser && (
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
                      <AvatarImage src={ticket.user.avatarUrl || ''} />
                      <AvatarFallback className="text-xs">
                        {ticket.user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`flex flex-col max-w-[85%] sm:max-w-[75%] min-w-0 ${
                      isUser ? 'items-start' : 'items-end'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 break-words overflow-wrap-anywhere w-full ${
                        isUser
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word">
                        {msg.message}
                      </p>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 px-1">
                      {formatRelativeTime(msg.createdAt)}
                    </span>
                  </div>
                  {!isUser && (
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        A
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Message Input */}
      {!isClosed && (
        <Card className="glass-effect">
          <CardContent className="p-3 sm:p-4">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mesajınızı yazın..."
                rows={3}
                disabled={sending}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={sending || !message.trim()} size="sm" className="gap-2">
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Gönder
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isClosed && (
        <Card className="glass-effect border-green-500/30">
          <CardContent className="p-3 sm:p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Bu destek talebi kapatılmıştır. Yeni mesaj ekleyemezsiniz.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

