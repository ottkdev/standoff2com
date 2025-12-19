import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OrderService } from '@/lib/services/order.service'
import { OrderList } from '@/components/marketplace/OrderList'

interface PageProps {
  searchParams: {
    role?: string
    status?: string
    page?: string
  }
}

export default async function MarketplaceOrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const role = (searchParams.role as 'buyer' | 'seller' | 'all') || 'all'
  const status = searchParams.status as any
  const page = parseInt(searchParams.page || '1')
  const limit = 20

  const { orders, total, totalPages } = await OrderService.getUserOrders(session.user.id, {
    role,
    status,
    page,
    limit,
  })

  // Serialize dates
  const serializedOrders = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
    autoReleaseAt: order.autoReleaseAt instanceof Date ? order.autoReleaseAt.toISOString() : order.autoReleaseAt,
    completedAt: order.completedAt instanceof Date ? order.completedAt.toISOString() : order.completedAt,
    disputedAt: order.disputedAt instanceof Date ? order.disputedAt.toISOString() : order.disputedAt,
    listing: {
      ...order.listing,
      createdAt: order.listing.createdAt instanceof Date ? order.listing.createdAt.toISOString() : order.listing.createdAt,
      updatedAt: order.listing.updatedAt instanceof Date ? order.listing.updatedAt.toISOString() : order.listing.updatedAt,
      deletedAt: order.listing.deletedAt instanceof Date ? order.listing.deletedAt.toISOString() : order.listing.deletedAt,
      images: order.listing.images.map((img) => ({
        ...img,
        createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : img.createdAt,
      })),
    },
  }))

  return (
    <OrderList
      orders={serializedOrders}
      total={total}
      page={page}
      totalPages={totalPages}
      currentRole={role}
      currentStatus={status}
    />
  )
}

