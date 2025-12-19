import { prisma } from '@/lib/db'
import { WalletTransactionType, WalletTransactionStatus, WalletTransactionProvider } from '@prisma/client'

export class WalletService {
  /**
   * Get or create wallet for user
   */
  static async getOrCreateWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balanceAvailable: 0,
          balanceHeld: 0,
        },
      })
    }

    return wallet
  }

  /**
   * Get wallet with balance
   */
  static async getWallet(userId: string) {
    return this.getOrCreateWallet(userId)
  }

  /**
   * Create wallet transaction (does not modify balance - use credit/debit methods)
   */
  static async createTransaction(
    userId: string,
    type: WalletTransactionType,
    amount: number, // in kuruş
    status: WalletTransactionStatus,
    provider: WalletTransactionProvider,
    referenceId?: string,
    meta?: any
  ) {
    return prisma.walletTransaction.create({
      data: {
        userId,
        type,
        amount,
        status,
        provider,
        referenceId: referenceId || null,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
      },
    })
  }

  /**
   * Credit wallet (increase available balance)
   */
  static async credit(
    userId: string,
    amount: number, // in kuruş
    type: WalletTransactionType,
    provider: WalletTransactionProvider,
    referenceId?: string,
    meta?: any
  ) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        create: {
          userId,
          balanceAvailable: amount,
          balanceHeld: 0,
        },
        update: {
          balanceAvailable: {
            increment: amount,
          },
        },
      })

      await tx.walletTransaction.create({
        data: {
          userId,
          type,
          amount,
          status: 'SUCCESS',
          provider,
          referenceId: referenceId || null,
          meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
        },
      })

      return wallet
    })
  }

  /**
   * Debit wallet (decrease available balance)
   */
  static async debit(
    userId: string,
    amount: number, // in kuruş
    type: WalletTransactionType,
    provider: WalletTransactionProvider,
    referenceId?: string,
    meta?: any
  ) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!wallet) {
        throw new Error('Cüzdan bulunamadı')
      }

      if (wallet.balanceAvailable < amount) {
        throw new Error('Yetersiz bakiye')
      }

      const updated = await tx.wallet.update({
        where: { userId },
        data: {
          balanceAvailable: {
            decrement: amount,
          },
        },
      })

      await tx.walletTransaction.create({
        data: {
          userId,
          type,
          amount,
          status: 'SUCCESS',
          provider,
          referenceId: referenceId || null,
          meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
        },
      })

      return updated
    })
  }

  /**
   * Hold funds (move from available to held)
   */
  static async hold(
    userId: string,
    amount: number, // in kuruş
    type: WalletTransactionType,
    referenceId?: string,
    meta?: any
  ) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!wallet) {
        throw new Error('Cüzdan bulunamadı')
      }

      if (wallet.balanceAvailable < amount) {
        throw new Error('Yetersiz bakiye')
      }

      const updated = await tx.wallet.update({
        where: { userId },
        data: {
          balanceAvailable: {
            decrement: amount,
          },
          balanceHeld: {
            increment: amount,
          },
        },
      })

      await tx.walletTransaction.create({
        data: {
          userId,
          type,
          amount,
          status: 'SUCCESS',
          provider: 'INTERNAL',
          referenceId: referenceId || null,
          meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
        },
      })

      return updated
    })
  }

  /**
   * Release held funds (move from held to available for recipient)
   */
  static async release(
    fromUserId: string,
    toUserId: string,
    amount: number, // in kuruş
    referenceId?: string,
    meta?: any
  ) {
    return prisma.$transaction(async (tx) => {
      // Decrease held balance from buyer
      const fromWallet = await tx.wallet.findUnique({
        where: { userId: fromUserId },
      })

      if (!fromWallet || fromWallet.balanceHeld < amount) {
        throw new Error('Yetersiz tutulan bakiye')
      }

      await tx.wallet.update({
        where: { userId: fromUserId },
        data: {
          balanceHeld: {
            decrement: amount,
          },
        },
      })

      // Increase available balance for seller
      await tx.wallet.upsert({
        where: { userId: toUserId },
        create: {
          userId: toUserId,
          balanceAvailable: amount,
          balanceHeld: 0,
        },
        update: {
          balanceAvailable: {
            increment: amount,
          },
        },
      })

      // Create transactions
      await tx.walletTransaction.create({
        data: {
          userId: fromUserId,
          type: 'RELEASE',
          amount,
          status: 'SUCCESS',
          provider: 'INTERNAL',
          referenceId: referenceId || null,
          meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
        },
      })

      await tx.walletTransaction.create({
        data: {
          userId: toUserId,
          type: 'DEPOSIT',
          amount,
          status: 'SUCCESS',
          provider: 'INTERNAL',
          referenceId: referenceId || null,
          meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
        },
      })
    })
  }

  /**
   * Refund held funds (move from held back to available for same user)
   */
  static async refund(
    userId: string,
    amount: number, // in kuruş
    referenceId?: string,
    meta?: any
  ) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!wallet || wallet.balanceHeld < amount) {
        throw new Error('Yetersiz tutulan bakiye')
      }

      const updated = await tx.wallet.update({
        where: { userId },
        data: {
          balanceHeld: {
            decrement: amount,
          },
          balanceAvailable: {
            increment: amount,
          },
        },
      })

      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'REFUND',
          amount,
          status: 'SUCCESS',
          provider: 'INTERNAL',
          referenceId: referenceId || null,
          meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
        },
      })

      return updated
    })
  }

  /**
   * Get transaction history
   */
  static async getTransactions(
    userId: string,
    filters?: {
      type?: WalletTransactionType
      status?: WalletTransactionStatus
      page?: number
      limit?: number
    }
  ) {
    const page = filters?.page || 1
    const limit = Math.min(50, filters?.limit || 20)
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (filters?.type) where.type = filters.type
    if (filters?.status) where.status = filters.status

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.walletTransaction.count({ where }),
    ])

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}

