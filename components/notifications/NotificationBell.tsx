'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCircle2, UserPlus, MessageSquare, ShoppingBag, AlertTriangle, Ban, Megaphone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface NotificationActor {
  id: string
  username: string
  avatarUrl: string | null
}

interface Notification {
  id: string
  title: string
  content: string
  type: string
  url: string | null
  isRead: boolean
  createdAt: string
  actor: NotificationActor | null
}

interface NotificationResponse {
  notifications: Notification[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function NotificationBell() {
  const router = useRouter()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchNotifications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const response = await fetch(`/api/notifications?page=${pageNum}&limit=20`)
      if (response.ok) {
        const data: NotificationResponse = await response.json()
        
        if (append) {
          setNotifications((prev) => [...prev, ...data.notifications])
        } else {
          setNotifications(data.notifications)
        }
        
        setUnreadCount(data.unreadCount)
        setHasMore(data.pagination.page < data.pagination.totalPages)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(1)
    // Her 30 saniyede bir kontrol et
    const interval = setInterval(() => fetchNotifications(1), 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (notificationId: string, navigateToUrl?: string | null) => {
    try {
      const notification = notifications.find((n) => n.id === notificationId)
      if (!notification) return

      // Mark as read
      if (!notification.isRead) {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'POST',
        })
        if (response.ok) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          )
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      }

      // Navigate to URL if provided
      if (navigateToUrl) {
        router.push(navigateToUrl)
      }
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenemedi:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      })
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        )
        setUnreadCount(0)
        toast({
          title: 'Başarılı',
          description: 'Tüm bildirimler okundu olarak işaretlendi',
        })
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Bildirimler güncellenemedi',
        variant: 'destructive',
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'forum_reply':
      case 'comment_reply':
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'marketplace_approval':
      case 'marketplace_sold':
        return <ShoppingBag className="h-4 w-4 text-green-500" />
      case 'marketplace_rejection':
        return <ShoppingBag className="h-4 w-4 text-red-500" />
      case 'admin_warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'admin_ban':
        return <Ban className="h-4 w-4 text-red-500" />
      case 'system_announcement':
        return <Megaphone className="h-4 w-4 text-primary" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'follow':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'forum_reply':
      case 'comment_reply':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'marketplace_approval':
      case 'marketplace_sold':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'marketplace_rejection':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'admin_warning':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'admin_ban':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'system_announcement':
        return 'bg-primary/10 text-primary border-primary/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] sm:w-[400px] max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold">Bildirimler</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 min-h-[28px]"
              onClick={(e) => {
                e.stopPropagation()
                markAllAsRead()
              }}
            >
              Tümünü okundu işaretle
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px] sm:h-[500px]">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Bildirim yok</p>
              <p className="text-xs text-muted-foreground">Yeni bildirimler burada görünecek</p>
            </div>
          ) : (
            <>
              <div className="space-y-1 p-2">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex items-start gap-3 p-3 cursor-pointer rounded-lg min-h-[80px] hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      markAsRead(notification.id, notification.url)
                    }}
                  >
                    {/* Actor Avatar */}
                    {notification.actor ? (
                      <Avatar className="h-10 w-10 flex-shrink-0 mt-0.5">
                        <AvatarImage src={notification.actor.avatarUrl || ''} />
                        <AvatarFallback className="text-xs">
                          {notification.actor.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-muted mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {!notification.actor && (
                            <div className="flex-shrink-0">{getTypeIcon(notification.type)}</div>
                          )}
                          <p className="text-sm font-semibold line-clamp-1 break-words">
                            {notification.title}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 break-words mb-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                        {notification.url && (
                          <Badge variant="outline" className="text-xs h-5 px-1.5">
                            Görüntüle
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              {hasMore && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => fetchNotifications(page + 1, true)}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      'Daha fazla yükle'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

