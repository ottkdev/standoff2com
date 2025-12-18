import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserService } from '@/lib/services/user.service'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    // Verify user exists in database
    const { prisma } = await import('@/lib/db')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı ID gereklidir' },
        { status: 400 }
      )
    }

    await UserService.followUser(session.user.id, userId)

    return NextResponse.json({ message: 'Kullanıcı takip edildi' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

