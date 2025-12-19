import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTicketSchema } from '@/lib/validations/support.validation'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR'

    // Build where clause
    const where: any = {}
    
    if (!isAdmin) {
      // Users can only see their own tickets
      where.userId = session.user.id
    }

    // Optional filters
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')

    if (status) {
      where.status = status
    }
    if (category) {
      where.category = category
    }
    if (priority) {
      where.priority = priority
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(tickets)
  } catch (error: any) {
    console.error('Get tickets error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createTicketSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // Create ticket with first message
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject: validation.data.subject,
        category: validation.data.category,
        priority: validation.data.priority,
        status: 'OPEN',
        messages: {
          create: {
            senderType: 'USER',
            senderId: session.user.id,
            message: validation.data.message,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error: any) {
    console.error('Create ticket error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

