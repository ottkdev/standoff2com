'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { updateProfileSchema } from '@/lib/validations/user.validation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
  })

  useEffect(() => {
    if (session?.user) {
      fetch(`/api/users/${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setFormData({
              displayName: data.displayName || '',
              bio: data.bio || '',
              avatarUrl: data.avatarUrl || '',
            })
          }
          setIsLoadingData(false)
        })
        .catch(() => {
          setIsLoadingData(false)
        })
    }
  }, [session])

  if (!session) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validation = updateProfileSchema.safeParse(formData)
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message)
      }

      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Profil güncellenemedi')
      }

      toast({
        title: 'Başarılı',
        description: 'Profiliniz güncellendi',
      })

      await update()
      router.push(`/profile/${session.user.username}`)
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="container py-6 md:py-10 max-w-2xl px-4 md:px-6 w-full overflow-x-hidden">
        <Card className="glass-effect">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6 md:py-10 max-w-2xl px-4 md:px-6 w-full overflow-x-hidden">
      <Link
        href={`/profile/${session.user.username}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Profile Dön
      </Link>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Profili Düzenle</CardTitle>
          <CardDescription>Profil bilgilerinizi güncelleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Görünen Ad</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="İsim Soyisim"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biyografi</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Hakkınızda..."
                rows={5}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 karakter
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Profil Fotoğrafı URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="https://..."
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

