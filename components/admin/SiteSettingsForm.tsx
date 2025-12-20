'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SiteSettingsForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    siteName: '',
    siteDescription: '',
    logoUrl: '',
    footerText: '',
    registrationOpen: true,
    guestViewing: true,
    emailFromName: '',
    emailFromEmail: '',
  })

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast({
            title: 'Hata',
            description: data.error,
            variant: 'destructive',
          })
          return
        }

        setFormData({
          siteName: data.siteName || '',
          siteDescription: data.siteDescription || '',
          logoUrl: data.logoUrl || '',
          footerText: data.footerText || '',
          registrationOpen: data.registrationOpen ?? true,
          guestViewing: data.guestViewing ?? true,
          emailFromName: data.emailFromName || '',
          emailFromEmail: data.emailFromEmail || '',
        })
        setIsLoadingData(false)
      })
      .catch(() => {
        setIsLoadingData(false)
      })
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'Site ayarları kaydedildi',
        })
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Kaydetme başarısız')
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

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Genel Ayarlar */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Genel Ayarlar</CardTitle>
          <CardDescription>Site genel bilgileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Adı *</Label>
            <Input
              id="siteName"
              value={formData.siteName}
              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Açıklaması</Label>
            <Textarea
              id="siteDescription"
              value={formData.siteDescription}
              onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
              rows={3}
              disabled={isLoading}
              placeholder="Site açıklaması..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              disabled={isLoading}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerText">Footer Metni</Label>
            <Textarea
              id="footerText"
              value={formData.footerText}
              onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              rows={2}
              disabled={isLoading}
              placeholder="Footer'da gösterilecek metin..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Güvenlik Ayarları */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Güvenlik Ayarları</CardTitle>
          <CardDescription>Site güvenlik ve erişim ayarları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="registrationOpen">Yeni Kullanıcı Kaydı</Label>
              <p className="text-sm text-muted-foreground">
                Yeni kullanıcıların kayıt olabilmesi
              </p>
            </div>
            <input
              type="checkbox"
              id="registrationOpen"
              checked={formData.registrationOpen}
              onChange={(e) => setFormData({ ...formData, registrationOpen: e.target.checked })}
              disabled={isLoading}
              className="rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="guestViewing">Misafir İçerik Görüntüleme</Label>
              <p className="text-sm text-muted-foreground">
                Giriş yapmamış kullanıcıların içerikleri görebilmesi
              </p>
            </div>
            <input
              type="checkbox"
              id="guestViewing"
              checked={formData.guestViewing}
              onChange={(e) => setFormData({ ...formData, guestViewing: e.target.checked })}
              disabled={isLoading}
              className="rounded"
            />
          </div>
        </CardContent>
      </Card>

      {/* E-posta Ayarları */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>E-posta Ayarları</CardTitle>
          <CardDescription>E-posta gönderim ayarları (şimdilik mock)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailFromName">Gönderen Adı</Label>
            <Input
              id="emailFromName"
              value={formData.emailFromName}
              onChange={(e) => setFormData({ ...formData, emailFromName: e.target.value })}
              disabled={isLoading}
              placeholder="Standoff 2 Topluluk"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailFromEmail">Gönderen E-posta</Label>
            <Input
              id="emailFromEmail"
              type="email"
              value={formData.emailFromEmail}
              onChange={(e) => setFormData({ ...formData, emailFromEmail: e.target.value })}
              disabled={isLoading}
              placeholder="noreply@example.com"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Not: E-posta gönderim özelliği şu anda aktif değildir. Bu ayarlar gelecek
            güncellemelerde kullanılacaktır.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ayarları Kaydet
        </Button>
      </div>
    </form>
  )
}

export default SiteSettingsForm
