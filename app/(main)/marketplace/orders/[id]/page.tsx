import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OrderService } from '@/lib/services/order.service'
import { OrderDetail } from '@/components/marketplace/OrderDetail'

interface PageProps {
  params: {
    id: string
  }
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const order = await OrderService.getOrderById(params.id, session.user.id)

  if (!order) {
    notFound()
  }

  return <OrderDetail order={order} currentUserId={session.user.id} />
}

