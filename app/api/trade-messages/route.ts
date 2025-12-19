import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ModerationService } from '@/lib/services/moderation.service'
import { z } from 'zod'

const createMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(2000),
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
        { error: 'Hesabınız yasaklanmıştır' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { conversationId, content } = validation.data

    // Verify conversation exists and user is participant
    const conversation = await prisma.tradeConversation.findUnique({
      where: { id: conversationId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Konuşma bulunamadı' },
        { status: 404 }
      )
    }

    if (conversation.buyerId !== session.user.id && conversation.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu konuşmaya erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    if (conversation.isLocked) {
      return NextResponse.json(
        { error: 'Bu konuşma kilitli' },
        { status: 400 }
      )
    }

    // Create message
    const message = await prisma.tradeMessage.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Notify other party
    const recipientId =
      conversation.buyerId === session.user.id
        ? conversation.sellerId
        : conversation.buyerId

    const { NotificationService } = await import('@/lib/services/notification.service')
    await NotificationService.createNotification({
      type: 'forum_reply',
      userId: recipientId,
      actorId: session.user.id,
      targetType: undefined,
      targetId: conversation.orderId,
      url: `/marketplace/orders/${conversation.orderId}`,
      title: 'Yeni Mesaj',
      content: `Siparişiniz için yeni mesaj aldınız.`,
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

