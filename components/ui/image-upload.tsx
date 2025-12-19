'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  disabled?: boolean
  label?: string
  required?: boolean
}

export function ImageUpload({
  value,
  onChange,
  maxImages = 10,
  disabled = false,
  label = 'Görseller',
  required = false,
}: ImageUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState<Record<number, boolean>>({})
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
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)
      const remainingSlots = maxImages - value.length

      if (fileArray.length > remainingSlots) {
        toast({
          title: 'Hata',
          description: `En fazla ${remainingSlots} görsel daha ekleyebilirsiniz`,
          variant: 'destructive',
        })
        return
      }

      // Validate all files first
      for (const file of fileArray) {
        const error = validateFile(file)
        if (error) {
          toast({
            title: 'Hata',
            description: `${file.name}: ${error}`,
            variant: 'destructive',
          })
          return
        }
      }

      // Upload files
      const uploadPromises = fileArray.map(async (file, index) => {
        const uploadIndex = value.length + index
        setUploading((prev) => ({ ...prev, [uploadIndex]: true }))

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

          return data.url
        } catch (error: any) {
          toast({
            title: 'Hata',
            description: `${file.name}: ${error.message || 'Yükleme başarısız'}`,
            variant: 'destructive',
          })
          return null
        } finally {
          setUploading((prev) => {
            const newState = { ...prev }
            delete newState[uploadIndex]
            return newState
          })
        }
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      const validUrls = uploadedUrls.filter((url): url is string => url !== null)

      if (validUrls.length > 0) {
        onChange([...value, ...validUrls])
      }
    },
    [value, maxImages, onChange, toast]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled) return
      handleFileSelect(e.dataTransfer.files)
    },
    [disabled, handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index)
    onChange(newImages)
  }

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && '*'}
      </Label>

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group"
            >
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                  aria-label="Görseli kaldır"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {uploading[index] && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {value.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors',
            disabled
              ? 'border-muted bg-muted/50 cursor-not-allowed'
              : 'border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={disabled}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {Object.keys(uploading).length > 0 ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Upload className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {disabled ? 'Yükleme devre dışı' : 'Görsel yüklemek için tıklayın veya sürükleyin'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP (max 5MB) • {value.length}/{maxImages}
              </p>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={Object.keys(uploading).length > 0}
                className="mt-2 min-h-[44px]"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Dosya Seç
              </Button>
            )}
          </div>
        </div>
      )}

      {value.length >= maxImages && (
        <p className="text-xs text-muted-foreground">
          Maksimum {maxImages} görsel eklenebilir
        </p>
      )}
    </div>
  )
}

