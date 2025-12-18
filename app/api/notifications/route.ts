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

    const where: any = {
      OR: [
        { userId: session.user.id }, // Kullanıcıya özel
        { userId: null }, // Genel bildirimler
      ],
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        isRead: false,
      },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
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

    // Eğer userId null ise, tüm kullanıcılara bildirim gönder
    if (!validation.data.userId) {
      // Tüm kullanıcıları al ve her birine bildirim oluştur
      const users = await prisma.user.findMany({
        select: { id: true },
      })

      const notifications = await prisma.notification.createMany({
        data: users.map((user) => ({
          title: validation.data.title,
          content: validation.data.content,
          type: validation.data.type,
          userId: user.id,
        })),
      })

      return NextResponse.json({
        success: true,
        count: notifications.count,
        message: `${notifications.count} kullanıcıya bildirim gönderildi`,
      })
    } else {
      // Tek kullanıcıya bildirim gönder
      const notification = await prisma.notification.create({
        data: {
          title: validation.data.title,
          content: validation.data.content,
          type: validation.data.type,
          userId: validation.data.userId,
        },
      })

      return NextResponse.json(notification, { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

