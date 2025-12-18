'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function CreateWikiArticlePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    isPublished: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/wiki/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Makale oluşturulamadı')
      }

      toast({
        title: 'Başarılı',
        description: 'Wiki makalesi oluşturuldu',
      })

      router.push(`/wiki/${data.slug}`)
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

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    router.push('/')
    return null
  }

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-4xl">
      <Link href="/admin/wiki">
        <Button variant="ghost" size="sm" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Wiki Yönetimine Dön
        </Button>
      </Link>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-2xl">Yeni Wiki Makalesi</CardTitle>
          <CardDescription>
            SEO-optimize edilmiş, kapsamlı wiki makalesi oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Örn: AK-47 Rehberi: İstatistikler ve Kullanım"
                required
                minLength={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                SEO için anahtar kelimeleri başlıkta kullanın (50-60 karakter ideal)
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SILAHLAR">Silahlar</SelectItem>
                  <SelectItem value="HARITALAR">Haritalar</SelectItem>
                  <SelectItem value="OYUN_MODLARI">Oyun Modları</SelectItem>
                  <SelectItem value="RUTBELER">Rutbeler</SelectItem>
                  <SelectItem value="GUNCELLEMELER">Güncellemeler</SelectItem>
                  <SelectItem value="SKINLER">Skinler</SelectItem>
                  <SelectItem value="EKONOMI">Ekonomi</SelectItem>
                  <SelectItem value="TAKTIKLER">Taktikler</SelectItem>
                  <SelectItem value="SSS">SSS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Özet</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Makalenin kısa özeti (150-300 kelime, SEO için önemli)"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.excerpt.length}/500 karakter
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">İçerik *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Markdown formatında içerik yazın. ## H2, ### H3 başlıklar kullanın."
                rows={20}
                required
                minLength={100}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 800-1500 kelime önerilir. ## H2 ve ### H3 başlıklar kullanın.
              </p>
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <Label htmlFor="featuredImage">Öne Çıkan Görsel URL</Label>
              <Input
                id="featuredImage"
                type="url"
                value={formData.featuredImage}
                onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {/* SEO Fields */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">SEO Ayarları</h3>

              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="Arama motorları için başlık (50-60 karakter)"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  Boş bırakılırsa başlık kullanılır
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="Arama motorları için açıklama (150-160 karakter)"
                  rows={2}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  Boş bırakılırsa özet kullanılır
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="virgülle ayrılmış anahtar kelimeler"
                />
                <p className="text-xs text-muted-foreground">
                  Örn: standoff 2, ak-47, silah rehberi
                </p>
              </div>
            </div>

            {/* Publish */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isPublished" className="cursor-pointer">
                Hemen yayınla
              </Label>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Makale Oluştur
                  </>
                )}
              </Button>
              <Link href="/admin/wiki">
                <Button type="button" variant="outline">
                  İptal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

