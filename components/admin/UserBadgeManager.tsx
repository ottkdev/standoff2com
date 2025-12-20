'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface UserBadgeManagerProps {
  userId: string
  badges: Array<{ id: string; name: string; color?: string | null }>
  userBadges: Array<{ badgeId: string; badge: { name: string; color?: string | null } }>
}

export function UserBadgeManager({ userId, badges, userBadges }: UserBadgeManagerProps) {
  const { toast } = useToast()
  const [availableBadges, setAvailableBadges] = useState(badges)
  const [assigned, setAssigned] = useState(userBadges)
  const [selectedBadge, setSelectedBadge] = useState('')
  const [creating, setCreating] = useState(false)
  const [newBadge, setNewBadge] = useState({ name: '', color: '', iconUrl: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAssign = async () => {
    if (!selectedBadge) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId: selectedBadge }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Atama başarısız')
      }
      const badge = availableBadges.find((b) => b.id === selectedBadge)
      if (badge) {
        setAssigned((prev) => [...prev, { badgeId: badge.id, badge }])
      }
      toast({ title: 'Başarılı', description: 'Rozet eklendi' })
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (badgeId: string) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/badges`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Silme başarısız')
      }
      setAssigned((prev) => prev.filter((b) => b.badgeId !== badgeId))
      toast({ title: 'Başarılı', description: 'Rozet kaldırıldı' })
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreate = async () => {
    if (!newBadge.name.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBadge.name.trim(),
          color: newBadge.color || undefined,
          iconUrl: newBadge.iconUrl || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Rozet oluşturulamadı')
      }
      setAvailableBadges((prev) => [data, ...prev])
      setSelectedBadge(data.id)
      setNewBadge({ name: '', color: '', iconUrl: '' })
      setCreating(false)
      toast({ title: 'Rozet oluşturuldu', description: data.name })
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Rozetler</Label>
        <p className="text-sm text-muted-foreground">Kullanıcıya rozet ata veya kaldır.</p>
        <div className="flex items-center gap-2">
          <select
            value={selectedBadge}
            onChange={(e) => setSelectedBadge(e.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm flex-1"
            disabled={isSubmitting}
          >
            <option value="">Rozet seç</option>
            {availableBadges.map((badge) => (
              <option key={badge.id} value={badge.id}>
                {badge.name}
              </option>
            ))}
          </select>
          <Button type="button" size="sm" onClick={handleAssign} disabled={!selectedBadge || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setCreating((p) => !p)}>
            Yeni
          </Button>
        </div>
      </div>

      {creating && (
        <div className="rounded-lg border border-border/70 p-3 space-y-2">
          <div className="grid md:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label>Ad</Label>
              <Input
                value={newBadge.name}
                onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                placeholder="Örn: Pro Oyuncu"
              />
            </div>
            <div className="space-y-1">
              <Label>Renk (opsiyonel)</Label>
              <Input
                value={newBadge.color}
                onChange={(e) => setNewBadge({ ...newBadge, color: e.target.value })}
                placeholder="#F97316 veya bg-primary"
              />
            </div>
            <div className="space-y-1">
              <Label>Icon URL (opsiyonel)</Label>
              <Input
                value={newBadge.iconUrl}
                onChange={(e) => setNewBadge({ ...newBadge, iconUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)} disabled={isSubmitting}>
              Vazgeç
            </Button>
            <Button type="button" size="sm" onClick={handleCreate} disabled={isSubmitting || !newBadge.name.trim()}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Oluştur'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Mevcut Rozetler</Label>
        {assigned.length === 0 && (
          <p className="text-sm text-muted-foreground">Bu kullanıcıya atanmış rozet yok.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {assigned.map((userBadge) => (
            <Badge
              key={userBadge.badgeId}
              variant="secondary"
              className="flex items-center gap-2"
              style={userBadge.badge.color ? { backgroundColor: userBadge.badge.color } : undefined}
            >
              {userBadge.badge.name}
              <button
                type="button"
                className="text-xs text-foreground/80 hover:text-destructive transition"
                onClick={() => handleRemove(userBadge.badgeId)}
                disabled={isSubmitting}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserBadgeManager

