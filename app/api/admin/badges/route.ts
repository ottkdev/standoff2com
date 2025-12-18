import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const badges = await prisma.badge.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(badges)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, iconUrl } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Rozet adı gereklidir' }, { status: 400 })
    }

    const badge = await prisma.badge.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color?.trim() || null,
        iconUrl: iconUrl?.trim() || null,
      },
    })

    return NextResponse.json(badge, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Bir hata oluştu' }, { status: 500 })
  }
}

