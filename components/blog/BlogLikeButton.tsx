'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BlogLikeButtonProps {
  postId: string
  initialLiked: boolean
  initialCount: number
}

export function BlogLikeButton({ postId, initialLiked, initialCount }: BlogLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLike = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/blog/posts/${postId}/like`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        setCount((prev) => (data.liked ? prev + 1 : prev - 1))
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Bir hata oluştu')
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

  return (
    <Button
      onClick={handleLike}
      variant={isLiked ? 'default' : 'outline'}
      className="gap-2"
      disabled={isLoading}
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      {count}
    </Button>
  )
}

export default BlogLikeButton

