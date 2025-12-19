import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WalletService } from '@/lib/services/wallet.service'
import { WalletOverview } from '@/components/wallet/WalletOverview'

export default async function WalletPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  const wallet = await WalletService.getWallet(session.user.id)
  const { transactions } = await WalletService.getTransactions(session.user.id, {
    page: 1,
    limit: 10,
  })

  // Serialize dates
  const serializedWallet = {
    ...wallet,
    createdAt: wallet.createdAt instanceof Date ? wallet.createdAt.toISOString() : wallet.createdAt,
    updatedAt: wallet.updatedAt instanceof Date ? wallet.updatedAt.toISOString() : wallet.updatedAt,
  }
  const serializedTransactions = transactions.map((t) => ({
    ...t,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
  }))

  return <WalletOverview wallet={serializedWallet} recentTransactions={serializedTransactions} />
}

