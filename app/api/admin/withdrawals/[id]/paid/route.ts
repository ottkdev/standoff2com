import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { WalletService } from '@/lib/services/wallet.service'
import { AuditAction } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: params.id },
    })

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Çekim talebi bulunamadı' },
        { status: 404 }
      )
    }

    if (withdrawal.status === 'PAID') {
      return NextResponse.json(
        { error: 'Bu çekim talebi zaten ödenmiş olarak işaretlenmiş' },
        { status: 400 }
      )
    }

    if (withdrawal.status === 'REJECTED' || withdrawal.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Reddedilmiş veya iptal edilmiş çekim talebi ödenemez' },
        { status: 400 }
      )
    }

    // Process payment in transaction
    await prisma.$transaction(async (tx) => {
      // Update withdrawal status
      await tx.withdrawalRequest.update({
        where: { id: params.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          reviewedById: session.user.id,
          reviewedAt: withdrawal.reviewedAt || new Date(),
        },
      })

      // Release held funds (decrease balanceHeld)
      const wallet = await tx.wallet.findUnique({
        where: { userId: withdrawal.userId },
      })

      if (!wallet || wallet.balanceHeld < withdrawal.amount) {
        throw new Error('Yetersiz tutulan bakiye')
      }

      await tx.wallet.update({
        where: { userId: withdrawal.userId },
        data: {
          balanceHeld: {
            decrement: withdrawal.amount,
          },
        },
      })

      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAW_PAID',
          amount: withdrawal.amount,
          status: 'SUCCESS',
          provider: 'MANUAL',
          referenceId: params.id,
          meta: {
            withdrawalRequestId: params.id,
            iban: withdrawal.iban,
            accountName: withdrawal.accountName,
          },
        },
      })
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: AuditAction.APPROVE_REPORT, // Reuse or add WITHDRAWAL_PAID action
        targetType: undefined,
        targetId: params.id,
        details: JSON.stringify({
          amount: withdrawal.amount,
          iban: withdrawal.iban,
          accountName: withdrawal.accountName,
        }),
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    // Notify user
    const { NotificationService } = await import('@/lib/services/notification.service')
    await NotificationService.createNotification({
      type: 'system_announcement',
      userId: withdrawal.userId,
      actorId: session.user.id,
      targetType: undefined,
      targetId: params.id,
      url: '/wallet/history',
      title: 'Çekim Ödendi',
      content: `${(withdrawal.amount / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL tutarındaki çekim talebiniz ödendi.`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

