'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'

interface RejectListingDialogProps {
  listingId: string
  onReject: () => void
}

export function RejectListingDialog({ listingId, onReject }: RejectListingDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReject = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Hata',
        description: 'Red nedeni gereklidir',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/marketplace/${listingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'İlan reddedildi',
        })
        setIsOpen(false)
        setReason('')
        router.refresh()
        onReject()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Reddetme başarısız')
      }
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-1">
          <X className="h-4 w-4" />
          Reddet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>İlanı Reddet</DialogTitle>
          <DialogDescription>
            İlanı reddetmek için bir neden belirtin. Bu neden kullanıcıya gösterilecektir.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Red Nedeni *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="İlan neden reddediliyor?"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsOpen(false)
              setReason('')
            }}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting || !reason.trim()}
          >
            Reddet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RejectListingDialog
export { RejectListingDialog }

