'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
import { AlertTriangle, CheckCircle2, Loader2, DollarSign } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Dispute {
  id: string
  orderId: string
  openedById: string
  reason: string
  note: string | null
  status: string
  resolution: string | null
  createdAt: string
  resolvedAt: string | null
  order: {
    id: string
    amount: number
    listing: {
      id: string
      title: string
    }
    buyer: {
      id: string
      username: string
    }
    seller: {
      id: string
      username: string
    }
  }
  opener: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

interface DisputePanelProps {
  disputes: Dispute[]
  stats: {
    open: number
    resolved: number
    total: number
  }
  currentPage: number
  totalPages: number
  currentStatus?: string
}

export function DisputePanel({
  disputes,
  stats,
  currentPage,
  totalPages,
  currentStatus,
}: DisputePanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [selectedResolution, setSelectedResolution] = useState<'REFUND_BUYER' | 'RELEASE_SELLER' | 'PARTIAL'>('REFUND_BUYER')
  const [partialBuyerAmount, setPartialBuyerAmount] = useState('')

  const formatAmount = (kurus: number) => {
    return (kurus / 100).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleResolve = async (disputeId: string) => {
    setIsLoading(disputeId)
    try {
      const body: any = { resolution: selectedResolution }
      if (selectedResolution === 'PARTIAL') {
        const buyerAmount = parseFloat(partialBuyerAmount) * 100
        if (!buyerAmount || buyerAmount <= 0) {
          toast({
            title: 'Hata',
            description: 'Geçerli bir alıcı tutarı girin',
            variant: 'destructive',
          })
          setIsLoading(null)
          return
        }
        body.buyerAmount = buyerAmount
      }

      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'İşlem başarısız')
      }

      toast({
        title: 'Başarılı',
        description: 'İtiraz çözüldü',
      })

      setPartialBuyerAmount('')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleStatusFilter = (status?: string) => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    params.set('page', '1')
    router.push(`/admin/disputes?${params.toString()}`)
  }

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">İtirazlar</h1>
        <p className="text-muted-foreground">Sipariş itirazlarını yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Açık İtirazlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Çözülen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Durum Filtresi</Label>
            <Select value={currentStatus || 'all'} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="OPEN">Açık</SelectItem>
                <SelectItem value="RESOLVED">Çözülen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes List */}
      <div className="space-y-4">
        {disputes.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>İtiraz bulunamadı</p>
            </CardContent>
          </Card>
        ) : (
          disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Dispute Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={dispute.opener.avatarUrl || ''} />
                        <AvatarFallback>
                          {dispute.opener.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/profile/${dispute.opener.username}`}
                            className="font-semibold hover:text-primary"
                          >
                            @{dispute.opener.username}
                          </Link>
                          <Badge
                            variant={dispute.status === 'OPEN' ? 'destructive' : 'default'}
                          >
                            {dispute.status === 'OPEN' ? 'Açık' : 'Çözüldü'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatRelativeTime(dispute.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2 break-words">
                        {dispute.order.listing.title}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tutar:</span>
                          <span className="font-bold">{formatAmount(dispute.order.amount)} ₺</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Alıcı:</span>
                          <Link
                            href={`/profile/${dispute.order.buyer.username}`}
                            className="hover:text-primary"
                          >
                            @{dispute.order.buyer.username}
                          </Link>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Satıcı:</span>
                          <Link
                            href={`/profile/${dispute.order.seller.username}`}
                            className="hover:text-primary"
                          >
                            @{dispute.order.seller.username}
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">İtiraz Nedeni:</p>
                      <p className="text-sm break-words">{dispute.reason}</p>
                      {dispute.note && (
                        <>
                          <p className="text-sm font-medium mt-2 mb-1">Not:</p>
                          <p className="text-sm break-words">{dispute.note}</p>
                        </>
                      )}
                    </div>

                    {dispute.resolution && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                          Çözüm: {dispute.resolution === 'REFUND_BUYER' && 'Alıcıya İade'}
                          {dispute.resolution === 'RELEASE_SELLER' && 'Satıcıya Ödeme'}
                          {dispute.resolution === 'PARTIAL' && 'Kısmi Çözüm'}
                        </p>
                        {dispute.resolvedAt && (
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(dispute.resolvedAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {dispute.status === 'OPEN' && (
                    <div className="lg:min-w-[300px] space-y-3">
                      <div>
                        <Label>Çözüm Tipi</Label>
                        <Select
                          value={selectedResolution}
                          onValueChange={(v: any) => setSelectedResolution(v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="REFUND_BUYER">Alıcıya İade</SelectItem>
                            <SelectItem value="RELEASE_SELLER">Satıcıya Ödeme</SelectItem>
                            <SelectItem value="PARTIAL">Kısmi Çözüm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedResolution === 'PARTIAL' && (
                        <div>
                          <Label>Alıcı Tutarı (TL)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={partialBuyerAmount}
                            onChange={(e) => setPartialBuyerAmount(e.target.value)}
                            placeholder="0.00"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Toplam: {formatAmount(dispute.order.amount)} ₺
                          </p>
                        </div>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="w-full min-h-[44px]"
                            disabled={isLoading === dispute.id}
                          >
                            {isLoading === dispute.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                İşleniyor...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                İtirazı Çöz
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>İtirazı Çöz</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu işlem geri alınamaz. Ödeme işlemi hemen gerçekleştirilecektir.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-4">
                            <p className="text-sm">
                              Çözüm: {selectedResolution === 'REFUND_BUYER' && 'Alıcıya tam iade'}
                              {selectedResolution === 'RELEASE_SELLER' && 'Satıcıya tam ödeme'}
                              {selectedResolution === 'PARTIAL' &&
                                `Kısmi: Alıcı ${partialBuyerAmount || '0'} TL, Satıcı ${((dispute.order.amount / 100) - parseFloat(partialBuyerAmount || '0')).toFixed(2)} TL`}
                            </p>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading === dispute.id}>
                              İptal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleResolve(dispute.id)}
                              disabled={isLoading === dispute.id}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Onayla
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Link href={`/marketplace/orders/${dispute.orderId}`}>
                        <Button variant="outline" className="w-full min-h-[44px]">
                          Siparişi Görüntüle
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const params = new URLSearchParams()
            if (currentStatus) params.set('status', currentStatus)
            params.set('page', String(pageNum))
            return (
              <Link key={pageNum} href={`/admin/disputes?${params.toString()}`}>
                <Button
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  className="min-h-[44px] min-w-[44px]"
                >
                  {pageNum}
                </Button>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

