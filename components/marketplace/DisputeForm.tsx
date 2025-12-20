'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DisputeFormProps {
  order: {
    id: string
    listing: {
      title: string
    }
  }
}

function DisputeForm({ order }: DisputeFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!reason.trim()) {
        toast({
          title: 'Hata',
          description: 'İtiraz nedeni gereklidir',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          reason: reason.trim(),
          note: note.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'İtiraz açılamadı')
      }

      toast({
        title: 'Başarılı',
        description: 'İtiraz açıldı. Admin incelemesi bekleniyor.',
      })

      router.push(`/marketplace/orders/${order.id}`)
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 max-w-2xl">
      <Link
        href={`/marketplace/orders/${order.id}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Siparişe Dön
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            İtiraz Aç
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Uyarı:</strong> İtiraz açtığınızda sipariş dondurulacak ve admin incelemesi
              bekleyecektir. İtiraz nedeni detaylı olarak açıklayın.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reason">İtiraz Nedeni *</Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger>
                  <SelectValue placeholder="İtiraz nedeni seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ürün gelmedi">Ürün gelmedi</SelectItem>
                  <SelectItem value="Ürün hasarlı">Ürün hasarlı</SelectItem>
                  <SelectItem value="Ürün farklı">Ürün farklı</SelectItem>
                  <SelectItem value="Satıcı iletişim kurmuyor">Satıcı iletişim kurmuyor</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="İtirazınızı detaylı olarak açıklayın..."
                rows={6}
                maxLength={2000}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">{note.length}/2000</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                variant="destructive"
                className="w-full sm:w-auto min-h-[44px]"
                disabled={isSubmitting || !reason}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    İtiraz Aç
                  </>
                )}
              </Button>
              <Link href={`/marketplace/orders/${order.id}`} className="flex-1 sm:flex-initial">
                <Button type="button" variant="outline" className="w-full min-h-[44px]">
                  İptal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default DisputeForm

