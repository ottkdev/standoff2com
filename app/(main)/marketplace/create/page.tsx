'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/hooks/use-toast'
import { createListingSchema } from '@/lib/validations/marketplace.validation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateListingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    images: [] as string[],
  })

  if (!session) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validation = createListingSchema.safeParse({
        ...formData,
        price: parseFloat(formData.price),
      })

      if (!validation.success) {
        throw new Error(validation.error.errors[0].message)
      }

      const response = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'İlan oluşturulamadı')
      }

      toast({
        title: 'Başarılı',
        description: 'İlanınız oluşturuldu ve onay bekliyor',
      })

      router.push(`/marketplace/${data.id}`)
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

  return (
    <div className="page-container-narrow py-4 sm:py-6 md:py-8 overflow-x-hidden">
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-primary mb-3 sm:mb-4 text-xs sm:text-sm">
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="truncate">Marketplace'e Dön</span>
      </Link>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl break-words">Yeni İlan Oluştur</CardTitle>
          <CardDescription className="text-xs sm:text-sm break-words">
            Standoff 2 ile ilgili eşya, hesap veya hizmet satışı yapabilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Örn: Standoff 2 Premium Hesap"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="İlanınızın detaylı açıklaması..."
                rows={8}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Fiyat (₺) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
                disabled={isLoading}
              />
            </div>

            <ImageUpload
              value={formData.images}
              onChange={(urls) => setFormData({ ...formData, images: urls })}
              maxImages={10}
              disabled={isLoading}
              label="Görseller"
              required
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                İlan Oluştur
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

