import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
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
    const { banned, reason, bannedUntil } = body

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        isBanned: banned,
        bannedUntil: banned ? (bannedUntil ? new Date(bannedUntil) : null) : null,
      },
    })

    // Create notification if banned
    if (banned) {
      const { NotificationService } = await import('@/lib/services/notification.service')
      await NotificationService.notifyAdminBan(
        params.id,
        session.user.id,
        reason || 'Yasaklama nedeni belirtilmedi',
        bannedUntil ? new Date(bannedUntil) : null
      )
    }

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

