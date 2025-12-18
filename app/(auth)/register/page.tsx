'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { registerSchema } from '@/lib/validations/user.validation'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate
    const validation = registerSchema.safeParse(formData)
    if (!validation.success) {
      toast({
        title: 'Doğrulama hatası',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt başarısız')
      }

      toast({
        title: 'Kayıt başarılı',
        description: 'Hesabınız oluşturuldu. Giriş yapabilirsiniz.',
      })
      router.push('/login')
    } catch (error: any) {
      toast({
        title: 'Kayıt başarısız',
        description: error.message || 'Bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Kayıt Ol</CardTitle>
          <CardDescription>
            Yeni hesap oluşturmak için bilgilerinizi girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı *</Label>
              <Input
                id="username"
                type="text"
                placeholder="kullaniciadi"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Sadece harf, rakam ve alt çizgi
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                En az 6 karakter
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Görünen Ad (Opsiyonel)</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="İsim Soyisim"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
            <Link href="/login" className="text-primary hover:underline">
              Giriş yap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

