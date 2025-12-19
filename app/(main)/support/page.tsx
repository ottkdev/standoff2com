'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatRelativeTime } from '@/lib/utils'
import { Plus, MessageSquare, Loader2, HelpCircle } from 'lucide-react'

interface Ticket {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  createdAt: string
  lastMessageAt: string
  user: {
    username: string
  }
  _count: {
    messages: number
  }
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

const categoryLabels: Record<string, string> = {
  PAYMENT: 'Ödeme',
  MARKETPLACE: 'Marketplace',
  ACCOUNT: 'Hesap',
  TECHNICAL: 'Teknik',
  OTHER: 'Diğer',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
}

export default function SupportPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'MEDIUM',
    message: '',
  })

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }
    fetchTickets()
  }, [session, router])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/support/tickets', {
        credentials: 'include',
      })
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      } else {
        const error = await response.json()
        toast({
          title: 'Hata',
          description: error.error || 'Talepler yüklenemedi',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Fetch tickets error:', error)
      toast({
        title: 'Hata',
        description: 'Talepler yüklenirken bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    if (!formData.subject.trim()) {
      toast({
        title: 'Hata',
        description: 'Konu boş olamaz',
        variant: 'destructive',
      })
      return
    }

    if (!formData.category) {
      toast({
        title: 'Hata',
        description: 'Kategori seçmelisiniz',
        variant: 'destructive',
      })
      return
    }

    if (!formData.message.trim()) {
      toast({
        title: 'Hata',
        description: 'Açıklama boş olamaz',
        variant: 'destructive',
      })
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: formData.subject.trim(),
          category: formData.category,
          priority: formData.priority,
          message: formData.message.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Destek talebi oluşturulamadı')
      }

      toast({
        title: 'Başarılı',
        description: 'Destek talebiniz oluşturuldu',
      })

      setOpenDialog(false)
      setFormData({ subject: '', category: '', priority: 'MEDIUM', message: '' })
      await fetchTickets()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="container py-4 sm:py-6 md:py-8 max-w-5xl px-3 sm:px-4 md:px-5 lg:px-6 w-full overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 break-words leading-tight">
              Destek Talepleri
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground break-words">
              Destek talebinizi oluşturun veya mevcut taleplerinizi görüntüleyin
            </p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 h-9 px-3 text-sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Yeni Talep</span>
                <span className="sm:hidden">Yeni</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Destek Talebi</DialogTitle>
                <DialogDescription>
                  Sorununuzu detaylı bir şekilde açıklayın
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Konu *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Örn: Ödeme sorunu"
                    required
                    disabled={creating}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      disabled={creating}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PAYMENT">Ödeme</SelectItem>
                        <SelectItem value="MARKETPLACE">Marketplace</SelectItem>
                        <SelectItem value="ACCOUNT">Hesap</SelectItem>
                        <SelectItem value="TECHNICAL">Teknik</SelectItem>
                        <SelectItem value="OTHER">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Öncelik</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      disabled={creating}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Düşük</SelectItem>
                        <SelectItem value="MEDIUM">Orta</SelectItem>
                        <SelectItem value="HIGH">Yüksek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Açıklama *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
                    rows={6}
                    required
                    disabled={creating}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenDialog(false)}
                    disabled={creating}
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Oluştur
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="glass-effect">
          <CardContent className="pt-10 pb-10 text-center">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-1">Henüz destek talebiniz yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              İlk destek talebinizi oluşturmak için yukarıdaki butona tıklayın
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="glass-effect hover:border-primary/40 hover:shadow-md transition-all"
            >
              <Link href={`/support/${ticket.id}`} className="contents">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-start gap-2 sm:gap-3 mb-2">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h3 className="text-sm sm:text-base font-semibold mb-1 break-words line-clamp-2 overflow-wrap-anywhere">
                            {ticket.subject}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                              {categoryLabels[ticket.category] || ticket.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                              {priorityLabels[ticket.priority] || ticket.priority}
                            </Badge>
                            <span>•</span>
                            <span>{ticket._count.messages} mesaj</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <Badge className={`${statusColors[ticket.status] || 'bg-muted'} text-[10px] sm:text-xs px-2 py-1`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </Badge>
                      <div className="text-right text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(ticket.lastMessageAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

