'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Flag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface ReportButtonProps {
  targetType: 'POST' | 'COMMENT' | 'LISTING' | 'PROFILE'
  targetId: string
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function ReportButton({
  targetType,
  targetId,
  variant = 'ghost',
  size = 'sm',
  className,
}: ReportButtonProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!session?.user) {
    return null
  }

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir sebep seçin',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          note: note.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Rapor oluşturulamadı')
      }

      toast({
        title: 'Başarılı',
        description: 'Raporunuz gönderildi. İnceleme için teşekkürler.',
      })

      setIsOpen(false)
      setReason('')
      setNote('')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTargetLabel = () => {
    switch (targetType) {
      case 'POST':
        return 'konuyu'
      case 'COMMENT':
        return 'yorumu'
      case 'LISTING':
        return 'ilanı'
      case 'PROFILE':
        return 'profili'
      default:
        return 'içeriği'
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Flag className="h-4 w-4 mr-2" />
          Bildir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>İçeriği Bildir</AlertDialogTitle>
          <AlertDialogDescription>
            Bu {getTargetLabel()} bildirmek için bir sebep seçin. Raporunuz moderatörler tarafından incelenecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Sebep *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Sebep seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPAM">Spam</SelectItem>
                <SelectItem value="HARASSMENT">Taciz</SelectItem>
                <SelectItem value="INAPPROPRIATE_CONTENT">Uygunsuz İçerik</SelectItem>
                <SelectItem value="COPYRIGHT_VIOLATION">Telif Hakkı İhlali</SelectItem>
                <SelectItem value="SCAM">Dolandırıcılık</SelectItem>
                <SelectItem value="OTHER">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Not (Opsiyonel)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ek bilgi veya açıklama..."
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">{note.length}/1000</p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting ? 'Gönderiliyor...' : 'Rapor Gönder'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ReportButton

