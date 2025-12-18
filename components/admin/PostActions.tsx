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
          title="Sabitlemeyi kaldır"
        >
          <Unlock className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('pin')}
          disabled={isLoading}
          title="Sabitle"
        >
          <Pin className="h-4 w-4" />
        </Button>
      )}
      {post.isLocked ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('unlock')}
          disabled={isLoading}
          title="Kilidi aç"
        >
          <Unlock className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('lock')}
          disabled={isLoading}
          title="Kilitle"
        >
          <Lock className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => handleAction('delete')}
        disabled={isLoading}
        title="Sil"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  )
}

