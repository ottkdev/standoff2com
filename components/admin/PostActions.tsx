'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Pin, Lock, Unlock, Trash2 } from 'lucide-react'

interface PostActionsProps {
  post: {
    id: string
    isPinned: boolean
    isLocked: boolean
  }
}

export function PostActions({ post }: PostActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'delete') => {
    setIsLoading(true)
    try {
      let response
      if (action === 'delete') {
        if (!confirm('Bu konuyu silmek istediğinize emin misiniz?')) {
          setIsLoading(false)
          return
        }
        response = await fetch(`/api/admin/forum/posts/${post.id}`, {
          method: 'DELETE',
        })
      } else {
        response = await fetch(`/api/admin/forum/posts/${post.id}/${action}`, {
          method: 'POST',
        })
      }

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'İşlem tamamlandı',
        })
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'İşlem başarısız')
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
    <>
      {post.isPinned ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('unpin')}
          disabled={isLoading}
          aria-label="Sabitlemeyi kaldır"
        >
          <Unlock className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('pin')}
          disabled={isLoading}
          aria-label="Sabitle"
        >
          <Pin className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
      {post.isLocked ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('unlock')}
          disabled={isLoading}
          aria-label="Kilidi aç"
        >
          <Unlock className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('lock')}
          disabled={isLoading}
          aria-label="Kilitle"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleAction('delete')}
        disabled={isLoading}
        aria-label="Sil"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </>
  )
}

export default PostActions
export { PostActions }

