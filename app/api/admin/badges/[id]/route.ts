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
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, iconUrl } = body

    const updateData: any = {}
    if (typeof name === 'string' && name.trim()) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color?.trim() || null
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl?.trim() || null

    const badge = await prisma.badge.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(badge)
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

    await prisma.badge.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Bir hata oluştu' }, { status: 500 })
  }
}

