'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { updatePostSchema } from '@/lib/validations/forum.validation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
  })

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    // Load post data
    fetch(`/api/forum/posts/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast({
            title: 'Hata',
            description: data.error,
            variant: 'destructive',
          })
          router.push('/forum')
          return
        }

        if (data.authorId !== session?.user?.id) {
          toast({
            title: 'Yetki yok',
            description: 'Bu konuyu düzenleme yetkiniz yok',
            variant: 'destructive',
          })
          router.push(`/forum/topic/${params.id}`)
          return
        }

        setFormData({
          title: data.title || '',
          content: data.content || '',
          categoryId: data.categoryId || '',
        })

        // Load categories
        return fetch('/api/forum/categories')
      })
      .then((res) => res?.json())
      .then((data) => {
        if (data) {
          setCategories(data)
        }
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
      const validation = updatePostSchema.safeParse(formData)
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message)
      }

      const response = await fetch(`/api/forum/posts/${params.id}`, {
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
        description: 'Konu güncellendi',
      })

      router.push(`/forum/topic/${params.id}`)
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
        href={`/forum/topic/${params.id}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Konuya Dön
      </Link>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Konuyu Düzenle</CardTitle>
          <CardDescription>Konu bilgilerini güncelleyin</CardDescription>
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
              <Label htmlFor="categoryId">Kategori *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">İçerik *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                required
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

