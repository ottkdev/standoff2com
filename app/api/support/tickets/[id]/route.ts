import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateTicketStatusSchema } from '@/lib/validations/support.validation'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Strict auth check
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR'

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Destek talebi bulunamadı' },
        { status: 404 }
      )
    }

    // Check permissions
    if (!isAdmin && ticket.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu destek talebine erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    return NextResponse.json(ticket)
  } catch (error: any) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Strict auth check
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updateTicketStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: {
        status: validation.data.status,
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
      },
    })

    return NextResponse.json(ticket)
  } catch (error: any) {
    console.error('Update ticket error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

