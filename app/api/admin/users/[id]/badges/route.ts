import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const body = await request.json()
    const { badgeId } = body

    if (!badgeId) {
      return NextResponse.json({ error: 'badgeId gereklidir' }, { status: 400 })
    }

    await prisma.userBadge.create({
      data: {
        userId: params.id,
        badgeId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Bir hata oluştu' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const body = await request.json()
    const { badgeId } = body

    if (!badgeId) {
      return NextResponse.json({ error: 'badgeId gereklidir' }, { status: 400 })
    }

    await prisma.userBadge.delete({
      where: {
        userId_badgeId: {
          userId: params.id,
          badgeId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Bir hata oluştu' }, { status: 500 })
  }
}

