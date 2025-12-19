import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DisputeService } from '@/lib/services/dispute.service'
import { DisputePanel } from '@/components/admin/DisputePanel'

interface PageProps {
  searchParams: {
    status?: string
    page?: string
  }
}

export default async function AdminDisputesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const status = searchParams.status as any
  const page = parseInt(searchParams.page || '1')
  const limit = 20

  const { disputes, total, totalPages } = await DisputeService.getDisputes({
    status,
    page,
    limit,
  })

  // Serialize dates
  const serializedDisputes = disputes.map((dispute) => ({
    ...dispute,
    createdAt: dispute.createdAt instanceof Date ? dispute.createdAt.toISOString() : dispute.createdAt,
    resolvedAt: dispute.resolvedAt instanceof Date ? dispute.resolvedAt.toISOString() : dispute.resolvedAt,
  }))

  const stats = {
    open: await DisputeService.getDisputes({ status: 'OPEN', limit: 1 }).then((r) => r.total),
    resolved: await DisputeService.getDisputes({ status: 'RESOLVED', limit: 1 }).then((r) => r.total),
    total,
  }

  return (
    <DisputePanel
      disputes={serializedDisputes}
      stats={stats}
      currentPage={page}
      totalPages={totalPages}
      currentStatus={status}
    />
  )
}

