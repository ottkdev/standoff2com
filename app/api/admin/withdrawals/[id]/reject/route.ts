import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { WalletService } from '@/lib/services/wallet.service'
import { AuditAction } from '@prisma/client'
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(1, 'Red nedeni gereklidir').max(500),
})

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

    const body = await request.json()
    const validation = rejectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
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

    if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Bu çekim talebi reddedilemez' },
        { status: 400 }
      )
    }

    // Reject and release hold in transaction
    await prisma.$transaction(async (tx) => {
      // Update withdrawal status
      await tx.withdrawalRequest.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          rejectReason: validation.data.reason,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        },
      })

      // Release hold back to available balance
      await WalletService.refund(
        withdrawal.userId,
        withdrawal.amount,
        params.id,
        { withdrawalRequestId: params.id, rejectReason: validation.data.reason }
      )

      // Update transaction status
      await tx.walletTransaction.updateMany({
        where: {
          referenceId: params.id,
          type: 'WITHDRAW_REQUEST',
        },
        data: {
          status: 'CANCELLED',
        },
      })

      // Create reject transaction
      await tx.walletTransaction.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAW_REJECTED',
          amount: withdrawal.amount,
          status: 'SUCCESS',
          provider: 'INTERNAL',
          referenceId: params.id,
          meta: {
            withdrawalRequestId: params.id,
            rejectReason: validation.data.reason,
          },
        },
      })
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: AuditAction.DISMISS_REPORT, // Reuse or add WITHDRAWAL_REJECTED action
        targetType: undefined,
        targetId: params.id,
        details: JSON.stringify({
          amount: withdrawal.amount,
          reason: validation.data.reason,
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
      type: 'admin_warning',
      userId: withdrawal.userId,
      actorId: session.user.id,
      targetType: undefined,
      targetId: params.id,
      url: '/wallet/history',
      title: 'Çekim Talebi Reddedildi',
      content: `Çekim talebiniz reddedildi. Sebep: ${validation.data.reason}. Tutar hesabınıza iade edildi.`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

