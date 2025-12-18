'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Ban, CheckCircle2 } from 'lucide-react'

interface UserEditFormProps {
  user: any
}

export function UserEditForm({ user }: UserEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    role: user.role,
    isVerified: user.isVerified,
    isBanned: user.isBanned,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Güncelleme başarısız')
      }

      toast({
        title: 'Başarılı',
        description: 'Kullanıcı güncellendi',
      })

      router.refresh()
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

  const handleBan = async () => {
    if (!confirm('Kullanıcıyı yasaklamak istediğinize emin misiniz?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !user.isBanned }),
      })

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: user.isBanned ? 'Yasak kaldırıldı' : 'Kullanıcı yasaklandı',
        })
        router.refresh()
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
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle>Kullanıcıyı Düzenle</CardTitle>
        <CardDescription>{user.username} kullanıcısının ayarlarını değiştir</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Kullanıcı</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Verified</Label>
              <p className="text-sm text-muted-foreground">
                Kullanıcıya verified rozeti ver
              </p>
            </div>
            <Button
              type="button"
              variant={formData.isVerified ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData({ ...formData, isVerified: !formData.isVerified })}
              disabled={isLoading}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {formData.isVerified ? 'Verified' : 'Verify Et'}
            </Button>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
            <Button
              type="button"
              variant={user.isBanned ? 'default' : 'destructive'}
              onClick={handleBan}
              disabled={isLoading}
            >
              <Ban className="h-4 w-4 mr-2" />
              {user.isBanned ? 'Yasağı Kaldır' : 'Yasakla'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

