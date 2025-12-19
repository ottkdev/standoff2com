import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createMessageSchema } from '@/lib/validations/support.validation'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR'

    // Check ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      select: { userId: true, status: true },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Destek talebi bulunamadı' },
        { status: 404 }
      )
    }

    if (!isAdmin && ticket.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu destek talebine erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    const messages = await prisma.supportMessage.findMany({
      where: { ticketId: params.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR'

    // Check ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      select: { userId: true, status: true },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Destek talebi bulunamadı' },
        { status: 404 }
      )
    }

    if (!isAdmin && ticket.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu destek talebine erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    // Check if ticket is closed
    if (ticket.status === 'CLOSED' && !isAdmin) {
      return NextResponse.json(
        { error: 'Kapalı destek talebine mesaj eklenemez' },
        { status: 400 }
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

    // Create message and update ticket
    const [message] = await Promise.all([
      prisma.supportMessage.create({
        data: {
          ticketId: params.id,
          senderType: isAdmin ? 'ADMIN' : 'USER',
          senderId: session.user.id,
          message: validation.data.message,
        },
      }),
      prisma.supportTicket.update({
        where: { id: params.id },
        data: {
          lastMessageAt: new Date(),
          // Auto-update status if needed
          ...(ticket.status === 'WAITING_USER' && !isAdmin
            ? { status: 'OPEN' }
            : ticket.status === 'OPEN' && isAdmin
            ? { status: 'IN_PROGRESS' }
            : {}),
        },
      }),
    ])

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    console.error('Create message error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

