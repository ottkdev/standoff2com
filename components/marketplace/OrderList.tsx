'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Package, ArrowLeft } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import Image from 'next/image'

interface Order {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  amount: number
  status: string
  createdAt: string
  completedAt: string | null
  listing: {
    id: string
    title: string
    images: Array<{ url: string }>
  }
  buyer: {
    id: string
    username: string
    avatarUrl: string | null
  }
  seller: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

interface OrderListProps {
  orders: Order[]
  total: number
  page: number
  totalPages: number
  currentRole: 'buyer' | 'seller' | 'all'
  currentStatus?: string
}

export function OrderList({
  orders,
  total,
  page,
  totalPages,
  currentRole,
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

  const getStatusVariant = (status: string) => {
    if (status === 'COMPLETED') return 'default'
    if (status === 'PENDING_DELIVERY') return 'secondary'
    if (status === 'DISPUTED') return 'destructive'
    return 'outline'
  }

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (key === 'role' && value !== 'all') params.set('role', value)
    if (key === 'status' && value) params.set('status', value)
    params.set('page', '1')
    router.push(`/marketplace/orders?${params.toString()}`)
  }

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 max-w-6xl">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Marketplace'e Dön
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Siparişlerim</h1>
        <p className="text-muted-foreground">Toplam {total} sipariş</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Rol</Label>
              <Select value={currentRole} onValueChange={(v) => handleFilterChange('role', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="buyer">Alıcı</SelectItem>
                  <SelectItem value="seller">Satıcı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Durum</Label>
              <Select
                value={currentStatus || ''}
                onValueChange={(v) => handleFilterChange('status', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tümü</SelectItem>
                  <SelectItem value="PENDING_DELIVERY">Teslimat Bekleniyor</SelectItem>
                  <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                  <SelectItem value="DISPUTED">İtiraz Edildi</SelectItem>
                  <SelectItem value="REFUNDED">İade Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                    {/* Image */}
                    <div className="relative w-full md:w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {order.listing.images[0] ? (
                        <Image
                          src={order.listing.images[0].url}
                          alt={order.listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1 break-words">
                            {order.listing.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {currentRole === 'buyer' || currentRole === 'all'
                              ? `Satıcı: @${order.seller.username}`
                              : `Alıcı: @${order.buyer.username}`}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-primary">
                          {formatAmount(order.amount)} ₺
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatRelativeTime(order.createdAt)}
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
            if (currentRole !== 'all') params.set('role', currentRole)
            if (currentStatus) params.set('status', currentStatus)
            params.set('page', String(pageNum))
            return (
              <Link key={pageNum} href={`/marketplace/orders?${params.toString()}`}>
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
    </div>
  )
}

