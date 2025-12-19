import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createNotificationSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir'),
  content: z.string().min(1, 'İçerik gereklidir').max(2000, 'İçerik en fazla 2000 karakter olabilir'),
  type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
  userId: z.string().optional(), // null = tüm kullanıcılara
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id, // Only user-specific notifications
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createNotificationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { NotificationService } = await import('@/lib/services/notification.service')

    // Eğer userId null ise, tüm kullanıcılara bildirim gönder
    if (!validation.data.userId) {
      await NotificationService.broadcastSystemAnnouncement(
        validation.data.title,
        validation.data.content,
        body.url || undefined
      )

      const userCount = await prisma.user.count()

      return NextResponse.json({
        success: true,
        count: userCount,
        message: `${userCount} kullanıcıya bildirim gönderildi`,
      })
    } else {
      // Tek kullanıcıya bildirim gönder
      await NotificationService.notifySystemAnnouncement(
        validation.data.userId,
        validation.data.title,
        validation.data.content,
        body.url || undefined
      )

      return NextResponse.json({ success: true }, { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

