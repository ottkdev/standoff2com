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

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'İçerik gereklidir' },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Yorum bulunamadı' },
        { status: 404 }
      )
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu yorumu düzenleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const updated = await prisma.comment.update({
      where: { id: params.id },
      data: { content: content.trim() },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
