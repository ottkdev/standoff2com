'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { Banknote, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Withdrawal {
  id: string
  userId: string
  amount: number
  iban: string
  accountName: string
  status: string
  requestedAt: string
  reviewedAt: string | null
  paidAt: string | null
  reviewedById: string | null
  rejectReason: string | null
  user: {
    id: string
    username: string
    email: string
    avatarUrl: string | null
  }
  reviewer: {
    id: string
    username: string
  } | null
}

interface WithdrawalPanelProps {
  withdrawals: Withdrawal[]
  stats: {
    pending: number
    approved: number
    paid: number
    rejected: number
    total: number
  }
  currentPage: number
  totalPages: number
  currentStatus?: string
}

export function WithdrawalPanel({
  withdrawals,
  stats,
  currentPage,
  totalPages,
  currentStatus,
}: WithdrawalPanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const formatAmount = (kurus: number) => {
    return (kurus / 100).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleAction = async (withdrawalId: string, action: 'approve' | 'paid' | 'reject') => {
    setIsLoading(withdrawalId)
    try {
      const endpoint = `/api/admin/withdrawals/${withdrawalId}/${action}`
      const body: any = {}
      if (action === 'reject') {
        if (!rejectReason.trim()) {
          toast({
            title: 'Hata',
            description: 'Red nedeni gereklidir',
            variant: 'destructive',
          })
          setIsLoading(null)
          return
        }
        body.reason = rejectReason
      }

      const response = await fetch(endpoint, {
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
        description: 'İşlem tamamlandı',
      })

      setRejectReason('')
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

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    params.set('page', '1')
    router.push(`/admin/withdrawals?${params.toString()}`)
  }

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Çekim Talepleri</h1>
        <p className="text-muted-foreground">Kullanıcı çekim taleplerini yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Onaylanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ödenen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reddedilen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
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
                <SelectItem value="PENDING">Bekleyen</SelectItem>
                <SelectItem value="APPROVED">Onaylanan</SelectItem>
                <SelectItem value="PAID">Ödenen</SelectItem>
                <SelectItem value="REJECTED">Reddedilen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals List */}
      <div className="space-y-4">
        {withdrawals.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Çekim talebi bulunamadı</p>
            </CardContent>
          </Card>
        ) : (
          withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* User Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={withdrawal.user.avatarUrl || ''} />
                      <AvatarFallback>
                        {withdrawal.user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/profile/${withdrawal.user.username}`}
                          className="font-semibold hover:text-primary"
                        >
                          @{withdrawal.user.username}
                        </Link>
                        <Badge
                          variant={
                            withdrawal.status === 'PENDING'
                              ? 'secondary'
                              : withdrawal.status === 'PAID'
                              ? 'default'
                              : withdrawal.status === 'REJECTED'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {withdrawal.status === 'PENDING' && 'Bekleyen'}
                          {withdrawal.status === 'APPROVED' && 'Onaylanan'}
                          {withdrawal.status === 'PAID' && 'Ödenen'}
                          {withdrawal.status === 'REJECTED' && 'Reddedilen'}
                          {withdrawal.status === 'CANCELLED' && 'İptal'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{withdrawal.user.email}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tutar:</span>
                      <span className="font-bold text-lg">{formatAmount(withdrawal.amount)} ₺</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">IBAN:</span>
                      <span className="font-mono text-sm">{withdrawal.iban}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Hesap Sahibi:</span>
                      <span className="text-sm">{withdrawal.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Talep Tarihi:</span>
                      <span className="text-sm">{formatRelativeTime(withdrawal.requestedAt)}</span>
                    </div>
                    {withdrawal.reviewer && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">İnceleyen:</span>
                        <span className="text-sm">@{withdrawal.reviewer.username}</span>
                      </div>
                    )}
                    {withdrawal.rejectReason && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                        <strong>Red Nedeni:</strong> {withdrawal.rejectReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {withdrawal.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full min-h-[44px]"
                        onClick={() => handleAction(withdrawal.id, 'approve')}
                        disabled={isLoading === withdrawal.id}
                      >
                        {isLoading === withdrawal.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Onayla
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full min-h-[44px]"
                        onClick={() => handleAction(withdrawal.id, 'paid')}
                        disabled={isLoading === withdrawal.id}
                      >
                        {isLoading === withdrawal.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Ödendi Olarak İşaretle
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full min-h-[44px]"
                            disabled={isLoading === withdrawal.id}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reddet
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Çekim Talebini Reddet</AlertDialogTitle>
                            <AlertDialogDescription>
                              Red nedeni belirtin. Kullanıcıya bildirilecektir.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-3 py-4">
                            <Label>Red Nedeni *</Label>
                            <Textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Red nedeni..."
                              rows={3}
                              required
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleAction(withdrawal.id, 'reject')}
                              disabled={!rejectReason.trim()}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Reddet
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {withdrawal.status === 'APPROVED' && (
                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full min-h-[44px]"
                        onClick={() => handleAction(withdrawal.id, 'paid')}
                        disabled={isLoading === withdrawal.id}
                      >
                        {isLoading === withdrawal.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Ödendi Olarak İşaretle
                      </Button>
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
              <Link key={pageNum} href={`/admin/withdrawals?${params.toString()}`}>
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

