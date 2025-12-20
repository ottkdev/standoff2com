'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Send,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import SellerRatingForm from '@/components/marketplace/SellerRatingForm'

interface OrderDetailProps {
  order: any
  currentUserId: string
}

function OrderDetail({ order, currentUserId }: OrderDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [orderState, setOrderState] = useState(order)

  useEffect(() => {
    // Auto-release check on mount
    if (orderState.status === 'PENDING_DELIVERY' && orderState.autoReleaseAt) {
      const checkAutoRelease = async () => {
        try {
          await fetch(`/api/orders/${orderState.id}/auto-release`, { method: 'POST' })
          router.refresh()
        } catch (error) {
          console.error('Auto-release check failed:', error)
        }
      }
      checkAutoRelease()
    }
  }, [orderState.id, orderState.status, orderState.autoReleaseAt, router])

  const isBuyer = orderState.buyerId === currentUserId
  const isSeller = orderState.sellerId === currentUserId
  const canConfirmDelivery = isBuyer && orderState.status === 'PENDING_DELIVERY'
  const canRate = isBuyer && orderState.status === 'COMPLETED' && !orderState.rating
  const conversation = orderState.conversation

  const formatAmount = (kurus: number) => {
    return (kurus / 100).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !conversation) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/trade-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: message.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Mesaj gönderilemedi')
      }

      setMessage('')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleConfirmDelivery = async () => {
    setIsConfirming(true)
    try {
      const response = await fetch(`/api/orders/${orderState.id}/confirm-delivery`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Teslimat onaylanamadı')
      }

      toast({
        title: 'Başarılı',
        description: 'Teslimat onaylandı. Ödeme satıcıya aktarıldı.',
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 max-w-4xl">
      <Link
        href="/marketplace/orders"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Siparişlere Dön
      </Link>

      {/* Order Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5" />
                Sipariş Detayı
              </CardTitle>
              <Badge
                variant={
                  orderState.status === 'COMPLETED'
                    ? 'default'
                    : orderState.status === 'PENDING_DELIVERY'
                    ? 'secondary'
                    : orderState.status === 'DISPUTED'
                    ? 'destructive'
                    : 'outline'
                }
              >
                {orderState.status === 'PENDING_DELIVERY' && 'Teslimat Bekleniyor'}
                {orderState.status === 'COMPLETED' && 'Tamamlandı'}
                {orderState.status === 'DISPUTED' && 'İtiraz Edildi'}
                {orderState.status === 'REFUNDED' && 'İade Edildi'}
                {orderState.status === 'CANCELLED' && 'İptal Edildi'}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatAmount(orderState.amount)} ₺
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Listing Info */}
          <div className="flex gap-4">
            {orderState.listing.images[0] && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={orderState.listing.images[0].url}
                  alt={orderState.listing.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1 break-words">{orderState.listing.title}</h3>
              <Link
                href={`/marketplace/${orderState.listingId}`}
                className="text-sm text-primary hover:underline"
              >
                İlana Git →
              </Link>
            </div>
          </div>

          {/* User Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Alıcı</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={orderState.buyer.avatarUrl || ''} />
                  <AvatarFallback>{orderState.buyer.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <Link
                  href={`/profile/${orderState.buyer.username}`}
                  className="font-medium hover:text-primary"
                >
                  @{orderState.buyer.username}
                </Link>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Satıcı</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={orderState.seller.avatarUrl || ''} />
                  <AvatarFallback>{orderState.seller.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <Link
                  href={`/profile/${orderState.seller.username}`}
                  className="font-medium hover:text-primary"
                >
                  @{orderState.seller.username}
                </Link>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="pt-4 border-t space-y-1 text-sm text-muted-foreground">
            <p>Oluşturulma: {formatRelativeTime(orderState.createdAt)}</p>
            {orderState.completedAt && (
              <p>Tamamlanma: {formatRelativeTime(orderState.completedAt)}</p>
            )}
            {orderState.autoReleaseAt && orderState.status === 'PENDING_DELIVERY' && (
              <p className="text-yellow-600 dark:text-yellow-400">
                Otomatik ödeme: {formatRelativeTime(orderState.autoReleaseAt)}
              </p>
            )}
          </div>

          {/* Actions */}
          {canConfirmDelivery && (
            <div className="pt-4 border-t space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full min-h-[44px]">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Ürünü Aldım - Teslimatı Onayla
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Teslimatı Onayla</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ürünü aldığınızı onaylıyor musunuz? Onayladığınızda ödeme satıcıya
                      aktarılacaktır.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isConfirming}>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmDelivery}
                      disabled={isConfirming}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Onaylanıyor...
                        </>
                      ) : (
                        'Onayla'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {!orderState.dispute && (
                <Link href={`/marketplace/orders/${orderState.id}/dispute`}>
                  <Button variant="destructive" className="w-full min-h-[44px]">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    İtiraz Aç
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Rating Form */}
          {canRate && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3 text-sm">Satıcıyı Değerlendir</h4>
              <SellerRatingForm
                orderId={orderState.id}
                sellerId={orderState.sellerId}
                onSuccess={() => {
                  router.refresh()
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Conversation */}
      {conversation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Sipariş Mesajlaşması
              {conversation.isLocked && (
                <Badge variant="outline" className="ml-auto">
                  Kilitli
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
              {conversation.messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Henüz mesaj yok
                </p>
              ) : (
                conversation.messages.map((msg: any) => {
                  const isOwn = msg.senderId === currentUserId
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={msg.sender.avatarUrl || ''} />
                        <AvatarFallback>
                          {msg.sender.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
                        <div
                          className={`inline-block p-3 rounded-lg ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Message Input */}
            {!conversation.isLocked && (
              <div className="flex gap-2 pt-4 border-t">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mesaj yazın..."
                  rows={3}
                  disabled={isSending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className="min-h-[44px]"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default OrderDetail

