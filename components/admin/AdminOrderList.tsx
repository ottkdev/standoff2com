'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Package, AlertTriangle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Order {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  amount: number
  status: string
  createdAt: Date | string
  completedAt: Date | string | null
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
  dispute: {
    id: string
    status: string
  } | null
}

interface OrderListProps {
  orders: Order[]
  stats: {
    pending: number
    completed: number
    disputed: number
    total: number
  }
  currentPage: number
  totalPages: number
  currentStatus?: string
}

export function OrderList({
  orders,
  stats,
  currentPage,
  totalPages,
  currentStatus,
}: OrderListProps) {
  const router = useRouter()

  const formatAmount = (kurus: number) => {
    return (kurus / 100).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING_DELIVERY: 'Teslimat Bekleniyor',
      COMPLETED: 'Tamamlandı',
      DISPUTED: 'İtiraz Edildi',
      REFUNDED: 'İade Edildi',
      CANCELLED: 'İptal Edildi',
    }
    return labels[status] || status
  }

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    params.set('page', '1')
    router.push(`/admin/orders?${params.toString()}`)
  }

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Siparişler</h1>
        <p className="text-muted-foreground">Tüm siparişleri görüntüleyin ve yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">İtiraz Edilen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.disputed}</div>
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
                <SelectItem value="PENDING_DELIVERY">Teslimat Bekleniyor</SelectItem>
                <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                <SelectItem value="DISPUTED">İtiraz Edildi</SelectItem>
                <SelectItem value="REFUNDED">İade Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Sipariş bulunamadı</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/marketplace/orders/${order.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1 break-words">
                            {order.listing.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>Alıcı: @{order.buyer.username}</span>
                            <span>•</span>
                            <span>Satıcı: @{order.seller.username}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            variant={
                              order.status === 'COMPLETED'
                                ? 'default'
                                : order.status === 'PENDING_DELIVERY'
                                ? 'secondary'
                                : order.status === 'DISPUTED'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {getStatusLabel(order.status)}
                          </Badge>
                          {order.dispute && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              İtiraz
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-lg font-bold text-primary">
                          {formatAmount(order.amount)} ₺
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatRelativeTime(
                            order.createdAt instanceof Date
                              ? order.createdAt.toISOString()
                              : order.createdAt
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
              <Link key={pageNum} href={`/admin/orders?${params.toString()}`}>
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

