import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DisputeService } from '@/lib/services/dispute.service'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const resolveDisputeSchema = z.object({
  resolution: z.enum(['REFUND_BUYER', 'RELEASE_SELLER', 'PARTIAL']),
  buyerAmount: z.number().int().optional(), // For PARTIAL resolution
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
    const validation = resolveDisputeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { resolution, buyerAmount } = validation.data

    // For PARTIAL resolution, validate amounts
    if (resolution === 'PARTIAL' && buyerAmount === undefined) {
      return NextResponse.json(
        { error: 'Kısmi çözüm için alıcı tutarı gereklidir' },
        { status: 400 }
      )
    }

    const dispute = await DisputeService.getDisputeById(params.id)
    if (!dispute) {
      return NextResponse.json(
        { error: 'İtiraz bulunamadı' },
        { status: 404 }
      )
    }

    const meta: any = {}
    if (resolution === 'PARTIAL' && buyerAmount !== undefined) {
      meta.buyerAmount = buyerAmount
      meta.sellerAmount = dispute.order.amount - buyerAmount
    }

    const resolved = await DisputeService.resolveDispute(
      params.id,
      session.user.id,
      resolution,
      meta
    )

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: AuditAction.APPROVE_REPORT, // Reuse or add DISPUTE_RESOLVED action
        targetType: 'dispute',
        targetId: params.id,
        details: JSON.stringify({
          resolution,
          orderId: dispute.orderId,
          meta,
        }),
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json(resolved)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

