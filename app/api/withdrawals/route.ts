import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { WalletService } from '@/lib/services/wallet.service'
import { ModerationService } from '@/lib/services/moderation.service'
import { z } from 'zod'

const createWithdrawalSchema = z.object({
  amount: z.number().int().min(5000), // 50 TL minimum in kuruş
  iban: z.string().regex(/^TR\d{24}$/i, 'Geçersiz IBAN formatı'),
  accountName: z.string().min(1).max(200),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    // Check if user is banned
    const isBanned = await ModerationService.isUserBanned(session.user.id)
    if (isBanned) {
      return NextResponse.json(
        { error: 'Hesabınız yasaklanmıştır' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createWithdrawalSchema.safeParse({
      ...body,
      iban: body.iban?.replace(/\s/g, '').toUpperCase(),
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { amount, iban, accountName } = validation.data

    // Check wallet balance
    const wallet = await WalletService.getWallet(session.user.id)
    if (wallet.balanceAvailable < amount) {
      return NextResponse.json(
        { error: 'Yetersiz bakiye' },
        { status: 400 }
      )
    }

    // Check for pending withdrawals (rate limiting)
    const pendingCount = await prisma.withdrawalRequest.count({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
    })

    if (pendingCount >= 3) {
      return NextResponse.json(
        { error: 'Bekleyen çekim talebiniz var. Lütfen onay bekleyin.' },
        { status: 400 }
      )
    }

    // Create withdrawal request and hold funds in a transaction
    const withdrawal = await prisma.$transaction(async (tx) => {
      // Create withdrawal request
      const request = await tx.withdrawalRequest.create({
        data: {
          userId: session.user.id,
          amount,
          iban,
          accountName,
          status: 'PENDING',
        },
      })

      // Hold funds (move from available to held)
      await WalletService.hold(
        session.user.id,
        amount,
        'WITHDRAW_REQUEST',
        request.id,
        { withdrawalRequestId: request.id }
      )

      return request
    })

    return NextResponse.json(withdrawal, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

