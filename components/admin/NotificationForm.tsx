'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function NotificationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    userId: '', // Boş = tüm kullanıcılara
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload: any = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
      }

      // Eğer userId boş değilse, sadece o kullanıcıya gönder
      if (formData.userId.trim()) {
        payload.userId = formData.userId
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Başarılı',
          description: formData.userId
            ? 'Bildirim gönderildi'
            : `${data.count || 'Tüm'} kullanıcıya bildirim gönderildi`,
        })
        setFormData({
          title: '',
          content: '',
          type: 'info',
          userId: '',
        })
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Bildirim gönderilemedi')
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Başlık *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          maxLength={200}
          disabled={isLoading}
          placeholder="Bildirim başlığı..."
        />
        <p className="text-xs text-muted-foreground">
          {formData.title.length}/200 karakter
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">İçerik *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          rows={6}
          maxLength={2000}
          disabled={isLoading}
          placeholder="Bildirim içeriği..."
        />
        <p className="text-xs text-muted-foreground">
          {formData.content.length}/2000 karakter
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Bildirim Tipi *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Bilgi (Mavi)</SelectItem>
            <SelectItem value="success">Başarı (Yeşil)</SelectItem>
            <SelectItem value="warning">Uyarı (Sarı)</SelectItem>
            <SelectItem value="error">Hata (Kırmızı)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userId">Kullanıcı ID (Opsiyonel)</Label>
        <Input
          id="userId"
          value={formData.userId}
          onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          disabled={isLoading}
          placeholder="Boş bırakırsanız tüm kullanıcılara gönderilir"
        />
        <p className="text-xs text-muted-foreground">
          Belirli bir kullanıcıya göndermek için kullanıcı ID'sini girin. Boş bırakırsanız tüm
          kullanıcılara gönderilir.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          <strong>Uyarı:</strong> Kullanıcı ID boş bırakılırsa, bildirim tüm aktif kullanıcılara
          gönderilecektir. Bu işlem geri alınamaz.
        </p>
      </div>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {formData.userId ? 'Kullanıcıya Bildirim Gönder' : 'Tüm Kullanıcılara Bildirim Gönder'}
      </Button>
    </form>
  )
}

export default NotificationForm

