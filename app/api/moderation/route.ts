import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ModerationService } from '@/lib/services/moderation.service'
import { ReportService } from '@/lib/services/report.service'
import { z } from 'zod'

const moderationActionSchema = z.object({
  action: z.enum([
    'delete_post',
    'restore_post',
    'delete_comment',
    'restore_comment',
    'delete_listing',
    'restore_listing',
    'warn_user',
    'ban_user',
    'unban_user',
    'approve_report',
    'dismiss_report',
  ]),
  targetType: z.enum(['post', 'comment', 'listing', 'user', 'report']),
  targetId: z.string(),
  reason: z.string().optional(),
  bannedUntil: z.string().optional(), // ISO date string
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = moderationActionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { action, targetType, targetId, reason, bannedUntil } = validation.data

    let result: any

    switch (action) {
      case 'delete_post':
        result = await ModerationService.deletePost(targetId, session.user.id, reason, request)
        break
      case 'restore_post':
        result = await ModerationService.restorePost(targetId, session.user.id, request)
        break
      case 'delete_comment':
        result = await ModerationService.deleteComment(targetId, session.user.id, reason, request)
        break
      case 'restore_comment':
        result = await ModerationService.restoreComment(targetId, session.user.id, request)
        break
      case 'delete_listing':
        result = await ModerationService.deleteListing(targetId, session.user.id, reason, request)
        break
      case 'restore_listing':
        result = await ModerationService.restoreListing(targetId, session.user.id, request)
        break
      case 'warn_user':
        if (!reason) {
          return NextResponse.json(
            { error: 'Uyarı için sebep gereklidir' },
            { status: 400 }
          )
        }
        result = await ModerationService.warnUser(targetId, session.user.id, reason, request)
        break
      case 'ban_user':
        if (!reason) {
          return NextResponse.json(
            { error: 'Yasaklama için sebep gereklidir' },
            { status: 400 }
          )
        }
        const banDate = bannedUntil ? new Date(bannedUntil) : null
        result = await ModerationService.banUser(targetId, session.user.id, reason, banDate, request)
        break
      case 'unban_user':
        result = await ModerationService.unbanUser(targetId, session.user.id, request)
        break
      case 'approve_report':
        await ReportService.updateReportStatus(targetId, 'RESOLVED', session.user.id)
        result = { success: true, message: 'Rapor onaylandı' }
        break
      case 'dismiss_report':
        await ReportService.updateReportStatus(targetId, 'DISMISSED', session.user.id)
        result = { success: true, message: 'Rapor reddedildi' }
        break
      default:
        return NextResponse.json(
          { error: 'Geçersiz işlem' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

