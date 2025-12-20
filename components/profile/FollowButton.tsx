'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
}

function FollowButton({ userId, isFollowing: initialIsFollowing }: FollowButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const endpoint = isFollowing ? '/api/users/unfollow' : '/api/users/follow'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        toast({
          title: isFollowing ? 'Takipten çıkıldı' : 'Takip edildi',
        })
        router.refresh()
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
      onClick={handleToggle}
      variant={isFollowing ? 'outline' : 'default'}
      disabled={isLoading}
    >
      {isLoading ? 'İşleniyor...' : isFollowing ? 'Takipten Çık' : 'Takip Et'}
    </Button>
  )
}

export default FollowButton
export { FollowButton }

