import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReportService } from '@/lib/services/report.service'
import { ModerationService } from '@/lib/services/moderation.service'
import { z } from 'zod'
import { ReportTargetType, ReportReason } from '@prisma/client'

const createReportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'LISTING', 'PROFILE']),
  targetId: z.string().min(1),
  reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'COPYRIGHT_VIOLATION', 'SCAM', 'OTHER']),
  note: z.string().max(1000).optional(),
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
        { error: 'Hesabınız yasaklanmış, rapor oluşturamazsınız' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createReportSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const report = await ReportService.createReport(
      session.user.id,
      validation.data.targetType as ReportTargetType,
      validation.data.targetId,
      validation.data.reason as ReportReason,
      validation.data.note
    )

    return NextResponse.json(report, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any
    const targetType = searchParams.get('targetType') as any
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await ReportService.getReports({
      status,
      targetType,
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

