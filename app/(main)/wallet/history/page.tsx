import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WalletService } from '@/lib/services/wallet.service'
import { WalletHistory } from '@/components/wallet/WalletHistory'

interface PageProps {
  searchParams: {
    page?: string
    type?: string
    status?: string
  }
}

export default async function WalletHistoryPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const page = parseInt(searchParams.page || '1')
  const limit = 20

  const { transactions, total, totalPages } = await WalletService.getTransactions(
    session.user.id,
    {
      type: searchParams.type as any,
      status: searchParams.status as any,
      page,
      limit,
    }
  )

  // Serialize dates
  const serializedTransactions = transactions.map((t) => ({
    ...t,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
  }))

  return (
    <WalletHistory
      transactions={serializedTransactions}
      total={total}
      page={page}
      totalPages={totalPages}
    />
  )
}

