import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OrderService } from '@/lib/services/order.service'
import DisputeForm from '@/components/marketplace/DisputeForm'

interface PageProps {
  params: {
    id: string
  }
}

export default async function DisputePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const order = await OrderService.getOrderById(params.id, session.user.id)

  if (!order) {
    notFound()
  }

  if (order.buyerId !== session.user.id) {
    redirect(`/marketplace/orders/${params.id}`)
  }

  if (order.status !== 'PENDING_DELIVERY') {
    redirect(`/marketplace/orders/${params.id}`)
  }

  if (order.dispute) {
    redirect(`/marketplace/orders/${params.id}`)
  }

  return <DisputeForm order={order} />
}

