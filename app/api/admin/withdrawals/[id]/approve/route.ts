import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
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

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Bu çekim talebi zaten işlenmiş' },
        { status: 400 }
      )
    }

    // Update status to APPROVED
    const updated = await prisma.withdrawalRequest.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: AuditAction.APPROVE_REPORT, // Reuse existing action or add new one
        targetType: undefined,
        targetId: params.id,
        details: JSON.stringify({ amount: withdrawal.amount, iban: withdrawal.iban }),
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          null,
        userAgent: request.headers.get('user-agent') || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

