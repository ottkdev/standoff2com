'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { updateBlogPostSchema } from '@/lib/validations/blog.validation'
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    coverImage: '',
    isPublished: false,
  })

  useEffect(() => {
    fetch(`/api/blog/posts/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setFormData({
            title: data.title || '',
            content: data.content || '',
            excerpt: data.excerpt || '',
            coverImage: data.coverImage || '',
            isPublished: data.isPublished || false,
          })
        }
        setIsLoadingData(false)
      })
      .catch(() => {
        setIsLoadingData(false)
      })
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validation = updateBlogPostSchema.safeParse(formData)
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message)
      }

      const response = await fetch(`/api/blog/posts/${params.id}`, {
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
        description: 'Blog yazısı güncellendi',
      })

      router.push('/admin/blog')
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

  const handleDelete = async () => {
    if (!confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/blog/posts/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'Blog yazısı silindi',
        })
        router.push('/admin/blog')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Silme başarısız')
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
      <div className="container py-10 max-w-4xl">
        <Card className="glass-effect">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-4xl">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Blog'a Dön
      </Link>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Blog Yazısını Düzenle</CardTitle>
          <CardDescription>Blog yazısı bilgilerini güncelleyin</CardDescription>
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
              <Label htmlFor="excerpt">Özet</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">İçerik *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Kapak Görseli URL</Label>
              <Input
                id="coverImage"
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                disabled={isLoading}
                className="rounded"
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Yayınlandı
              </Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

