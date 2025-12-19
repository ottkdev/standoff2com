'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  provider: string
  referenceId: string | null
  createdAt: string
}

interface WalletHistoryProps {
  transactions: Transaction[]
  total: number
  page: number
  totalPages: number
}

export function WalletHistory({
  transactions,
  total,
  page,
  totalPages,
}: WalletHistoryProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const formatAmount = (kurus: number) => {
    return (kurus / 100).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      DEPOSIT: 'Yükleme',
      DEPOSIT_FEE: 'Yükleme Ücreti',
      HOLD: 'Tutulan',
      RELEASE: 'Serbest Bırakıldı',
      REFUND: 'İade',
      WITHDRAW_REQUEST: 'Çekim Talebi',
      WITHDRAW_APPROVED: 'Çekim Onaylandı',
      WITHDRAW_REJECTED: 'Çekim Reddedildi',
      WITHDRAW_PAID: 'Çekim Ödendi',
    }
    return labels[type] || type
  }

  const getTransactionColor = (type: string) => {
    if (type.includes('DEPOSIT') && !type.includes('FEE')) return 'text-green-500'
    if (type === 'RELEASE') return 'text-green-500'
    if (type === 'REFUND') return 'text-blue-500'
    if (type.includes('WITHDRAW')) return 'text-orange-500'
    if (type === 'HOLD') return 'text-yellow-500'
    return 'text-muted-foreground'
  }

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    router.push(`/wallet/history?${params.toString()}`)
  }

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 max-w-4xl">
      <Link
        href="/wallet"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Cüzdana Dön
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">İşlem Geçmişi</h1>
        <p className="text-muted-foreground">Toplam {total} işlem</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">İşlem Tipi</label>
              <Select
                value={searchParams.get('type') || 'all'}
                onValueChange={(v) => handleFilterChange('type', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="DEPOSIT">Yükleme</SelectItem>
                  <SelectItem value="HOLD">Tutulan</SelectItem>
                  <SelectItem value="RELEASE">Serbest Bırakıldı</SelectItem>
                  <SelectItem value="REFUND">İade</SelectItem>
                  <SelectItem value="WITHDRAW_REQUEST">Çekim Talebi</SelectItem>
                  <SelectItem value="WITHDRAW_PAID">Çekim Ödendi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Durum</label>
              <Select
                value={searchParams.get('status') || 'all'}
                onValueChange={(v) => handleFilterChange('status', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="SUCCESS">Başarılı</SelectItem>
                  <SelectItem value="PENDING">Beklemede</SelectItem>
                  <SelectItem value="FAILED">Başarısız</SelectItem>
                  <SelectItem value="CANCELLED">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardContent className="pt-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>İşlem bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`font-medium ${getTransactionColor(tx.type)}`}>
                        {getTransactionLabel(tx.type)}
                      </span>
                      <Badge
                        variant={
                          tx.status === 'SUCCESS'
                            ? 'default'
                            : tx.status === 'PENDING'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {tx.status === 'SUCCESS' && 'Başarılı'}
                        {tx.status === 'PENDING' && 'Beklemede'}
                        {tx.status === 'FAILED' && 'Başarısız'}
                        {tx.status === 'CANCELLED' && 'İptal'}
                      </Badge>
                      {tx.provider && (
                        <Badge variant="outline" className="text-xs">
                          {tx.provider}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(tx.createdAt)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div
                      className={`font-semibold text-lg ${
                        tx.type.includes('DEPOSIT') && !tx.type.includes('FEE')
                          ? 'text-green-500'
                          : tx.type === 'RELEASE'
                          ? 'text-green-500'
                          : tx.type === 'REFUND'
                          ? 'text-blue-500'
                          : tx.type.includes('WITHDRAW')
                          ? 'text-orange-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {tx.type.includes('WITHDRAW') || tx.type === 'HOLD' ? '-' : '+'}
                      {formatAmount(tx.amount)} ₺
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', String(pageNum))
                return (
                  <Link key={pageNum} href={`/wallet/history?${params.toString()}`}>
                    <Button
                      variant={pageNum === page ? 'default' : 'outline'}
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
        </CardContent>
      </Card>
    </div>
  )
}

