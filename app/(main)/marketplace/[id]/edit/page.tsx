'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { updateListingSchema } from '@/lib/validations/marketplace.validation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    images: [] as string[],
  })

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    fetch(`/api/marketplace/listings/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast({
            title: 'Hata',
            description: data.error,
            variant: 'destructive',
          })
          router.push('/marketplace')
          return
        }

        if (data.seller.id !== session?.user?.id) {
          toast({
            title: 'Yetki yok',
            description: 'Bu ilanı düzenleme yetkiniz yok',
            variant: 'destructive',
          })
          router.push(`/marketplace/${params.id}`)
          return
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          price: data.price.toString() || '',
          images: data.images.map((img: any) => img.url) || [],
        })
        setIsLoadingData(false)
      })
      .catch(() => {
        setIsLoadingData(false)
      })
  }, [params.id, session, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validation = updateListingSchema.safeParse({
        ...formData,
        price: parseFloat(formData.price),
      })

      if (!validation.success) {
        throw new Error(validation.error.errors[0].message)
      }

      const response = await fetch(`/api/marketplace/listings/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Güncelleme başarısız')
      }

      toast({
        title: 'Başarılı',
        description: 'İlan güncellendi',
      })

      router.push(`/marketplace/${params.id}`)
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
      <div className="container py-10 max-w-3xl">
        <Card className="glass-effect">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-3xl">
      <Link
        href={`/marketplace/${params.id}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        İlana Dön
      </Link>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>İlanı Düzenle</CardTitle>
          <CardDescription>İlan bilgilerini güncelleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Görseller (URL)</Label>
              <div className="space-y-2">
                {formData.images.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => {
                        const newImages = [...formData.images]
                        newImages[index] = e.target.value
                        setFormData({ ...formData, images: newImages })
                      }}
                      placeholder="https://..."
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          images: formData.images.filter((_, i) => i !== index),
                        })
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                {formData.images.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        images: [...formData.images, ''],
                      })
                    }}
                    disabled={isLoading}
                  >
                    Görsel Ekle
                  </Button>
                )}
              </div>
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

