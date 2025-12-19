'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  label?: string
  username?: string
}

export function AvatarUpload({
  value,
  onChange,
  disabled = false,
  label = 'Profil Fotoğrafı',
  username = '',
}: AvatarUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Sadece JPEG, PNG ve WebP formatları desteklenmektedir'
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    if (!allowedExtensions.includes(extension)) {
      return 'Geçersiz dosya uzantısı'
    }

    // Check file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return 'Dosya boyutu 5MB\'dan büyük olamaz'
    }

    return null
  }

  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (!file) return

      const error = validateFile(file)
      if (error) {
        toast({
          title: 'Hata',
          description: error,
          variant: 'destructive',
        })
        return
      }

      setUploading(true)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Yükleme başarısız')
        }

        onChange(data.url)
        toast({
          title: 'Başarılı',
          description: 'Profil fotoğrafı yüklendi',
        })
      } catch (error: any) {
        toast({
          title: 'Hata',
          description: error.message || 'Yükleme başarısız',
          variant: 'destructive',
        })
      } finally {
        setUploading(false)
      }
    },
    [onChange, toast]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled || uploading) return
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [disabled, uploading, handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removeAvatar = () => {
    onChange('')
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex items-center gap-4">
        {/* Avatar Preview */}
        <div className="relative">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-border">
            {value ? (
              <AvatarImage src={value} alt="Avatar" />
            ) : (
              <AvatarFallback className="text-xl sm:text-2xl">
                {username ? username[0].toUpperCase() : <User className="h-8 w-8" />}
              </AvatarFallback>
            )}
          </Avatar>
          {value && !disabled && (
            <button
              type="button"
              onClick={removeAvatar}
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
              aria-label="Fotoğrafı kaldır"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            disabled={disabled || uploading}
            className="hidden"
          />
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={cn(
              'border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-colors',
              disabled || uploading
                ? 'border-muted bg-muted/50 cursor-not-allowed'
                : 'border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer'
            )}
          >
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-xs sm:text-sm font-medium">
                  {disabled
                    ? 'Yükleme devre dışı'
                    : uploading
                    ? 'Yükleniyor...'
                    : 'Dosya seçin veya sürükleyin'}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WebP (max 5MB)
                </p>
              </div>
              {!disabled && !uploading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 min-h-[44px] text-xs sm:text-sm"
                >
                  <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  Fotoğraf Seç
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

