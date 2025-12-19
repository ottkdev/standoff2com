import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTicketSchema } from '@/lib/validations/support.validation'

export async function GET(request: Request) {
  try {
    // Auth check - strict validation
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
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
    // Auth check - strict validation
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı. Lütfen giriş yapın.' },
        { status: 401 }
      )
    }

    if (!session.user) {
      return NextResponse.json(
        { error: 'Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      )
    }

    if (!session.user.id) {
      return NextResponse.json(
        { error: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Geçersiz JSON formatı' },
        { status: 400 }
      )
    }

    // Validate input
    const validation = createTicketSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json(
        { error: firstError?.message || 'Geçersiz form verisi' },
        { status: 400 }
      )
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isBanned: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      )
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Hesabınız yasaklanmıştır. Destek talebi oluşturamazsınız.' },
        { status: 403 }
      )
    }

    // Validate all required fields before creating
    const ticketData = {
      userId: session.user.id,
      subject: validation.data.subject.trim(),
      category: validation.data.category,
      priority: validation.data.priority || 'MEDIUM',
      status: 'OPEN' as const,
    }

    const messageData = {
      senderType: 'USER' as const,
      senderId: session.user.id,
      message: validation.data.message.trim(),
    }

    // Create ticket with first message - with explicit error handling
    const ticket = await prisma.supportTicket.create({
      data: {
        ...ticketData,
        messages: {
          create: messageData,
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
    
    // More specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Bu destek talebi zaten mevcut' },
        { status: 409 }
      )
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı referansı' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Destek talebi oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}

