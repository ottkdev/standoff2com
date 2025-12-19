import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { ReportStatus } from '@prisma/client'

const resolveReportSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNote: z.string().max(500, 'Admin notu en fazla 500 karakter olabilir').optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = resolveReportSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // Check if report exists and is not already resolved
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Rapor bulunamadı' },
        { status: 404 }
      )
    }

    if (report.status === 'APPROVED' || report.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Bu rapor zaten çözülmüş' },
        { status: 400 }
      )
    }

    // Use transaction to update report and create notification
    const result = await prisma.$transaction(async (tx) => {
      // Update report
      const updatedReport = await tx.report.update({
        where: { id: params.id },
        data: {
          status: validation.data.status as ReportStatus,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          adminNote: validation.data.adminNote?.trim() || null,
        },
      })

      // Create notification for reporter (inside transaction)
      const isApproved = validation.data.status === 'APPROVED'
      const adminMessage = validation.data.adminNote?.trim() || 'Ek bir geri bildirim belirtilmedi.'
      
      const notificationTitle = isApproved ? 'Raporunuz Onaylandı' : 'Raporunuz Reddedildi'
      const notificationContent = isApproved
        ? `Raporunuz adminler tarafından incelendi ve onaylandı.\nGeri bildirim: ${adminMessage}`
        : `Raporunuz adminler tarafından incelendi ve reddedildi.\nGeri bildirim: ${adminMessage}`

      // Check if reporter blocked the admin (security check)
      const isBlocked = await tx.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: report.reporterId,
            blockedId: session.user.id,
          },
        },
      })

      // Only create notification if not blocked and not self
      if (!isBlocked && report.reporterId !== session.user.id) {
        await tx.notification.create({
          data: {
            type: 'system_announcement',
            userId: report.reporterId,
            actorId: session.user.id,
            targetType: null,
            targetId: params.id,
            url: null,
            title: notificationTitle,
            content: notificationContent,
          },
        })
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: isApproved ? 'APPROVE_REPORT' : 'DISMISS_REPORT',
          targetType: 'report',
          targetId: params.id,
          details: JSON.stringify({
            status: validation.data.status,
            adminNote: validation.data.adminNote,
            reporterId: report.reporterId,
          }),
          ipAddress:
            request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            null,
          userAgent: request.headers.get('user-agent') || null,
        },
      })

      return updatedReport
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Report resolution error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

