'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createPostSchema } from '@/lib/validations/forum.validation'
import { Loader2 } from 'lucide-react'

interface PageProps {
  params: {
    category: string
  }
}

export default function CreatePostPage({ params }: PageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
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
      // Get category ID from slug
      const categoryRes = await fetch(`/api/forum/categories?slug=${params.category}`)
      const categoryData = await categoryRes.json()

      if (!categoryRes.ok) {
        throw new Error(categoryData.error || 'Kategori bulunamadı')
      }

      // Validate
      const validation = createPostSchema.safeParse({
        ...formData,
        categoryId: categoryData.id,
      })

      if (!validation.success) {
        throw new Error(validation.error.errors[0].message)
      }

      // Create post
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Konu oluşturulamadı')
      }

      toast({
        title: 'Başarılı',
        description: 'Konu başarıyla oluşturuldu',
      })

      router.push(`/forum/topic/${data.id}`)
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
    <div className="container py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Yeni Konu Aç</CardTitle>
          <CardDescription>
            {params.category} kategorisinde yeni bir konu oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Konu başlığı"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">İçerik *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Konu içeriğinizi yazın..."
                rows={10}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konu Oluştur
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

