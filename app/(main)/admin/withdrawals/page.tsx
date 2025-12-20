import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma, WithdrawalStatus } from '@prisma/client'
import WithdrawalPanel from '@/components/admin/WithdrawalPanel'

interface PageProps {
  searchParams: {
    status?: string
    page?: string
  }
}

export default async function AdminWithdrawalsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const status = searchParams.status === 'all' ? undefined : (searchParams.status as WithdrawalStatus | undefined)
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: Prisma.WithdrawalRequestWhereInput = {}
  if (status) where.status = status

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { requestedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    }),
    prisma.withdrawalRequest.count({ where }),
  ])

  const stats = {
    pending: await prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
    approved: await prisma.withdrawalRequest.count({ where: { status: 'APPROVED' } }),
    paid: await prisma.withdrawalRequest.count({ where: { status: 'PAID' } }),
    rejected: await prisma.withdrawalRequest.count({ where: { status: 'REJECTED' } }),
    total,
  }

  // Serialize dates
  const serializedWithdrawals = withdrawals.map((w) => ({
    ...w,
    requestedAt: w.requestedAt instanceof Date ? w.requestedAt.toISOString() : w.requestedAt,
    reviewedAt: w.reviewedAt instanceof Date ? w.reviewedAt.toISOString() : w.reviewedAt,
    paidAt: w.paidAt instanceof Date ? w.paidAt.toISOString() : w.paidAt,
  }))

  return (
    <WithdrawalPanel
      withdrawals={serializedWithdrawals}
      stats={stats}
      currentPage={page}
      totalPages={Math.ceil(total / limit)}
      currentStatus={status}
    />
  )
}

