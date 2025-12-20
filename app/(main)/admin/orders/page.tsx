import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma, OrderStatus } from '@prisma/client'
import { OrderList } from '@/components/admin/AdminOrderList'

interface PageProps {
  searchParams: {
    status?: string
    page?: string
  }
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const status = searchParams.status === 'all' ? undefined : (searchParams.status as OrderStatus | undefined)
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: Prisma.MarketplaceOrderWhereInput = {}
  if (status) where.status = status

  const [orders, total] = await Promise.all([
    prisma.marketplaceOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        dispute: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
    prisma.marketplaceOrder.count({ where }),
  ])

  const stats = {
    pending: await prisma.marketplaceOrder.count({ where: { status: 'PENDING_DELIVERY' } }),
    completed: await prisma.marketplaceOrder.count({ where: { status: 'COMPLETED' } }),
    disputed: await prisma.marketplaceOrder.count({ where: { status: 'DISPUTED' } }),
    total,
  }

  return (
    <OrderList
      orders={orders}
      stats={stats}
      currentPage={page}
      totalPages={Math.ceil(total / limit)}
      currentStatus={status}
    />
  )
}

