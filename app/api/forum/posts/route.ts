import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForumService } from '@/lib/services/forum.service'
import { createPostSchema } from '@/lib/validations/forum.validation'

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
    const { ModerationService } = await import('@/lib/services/moderation.service')
    const isBanned = await ModerationService.isUserBanned(session.user.id)
    if (isBanned) {
      return NextResponse.json(
        { error: 'Hesabınız yasaklanmıştır. İçerik oluşturamazsınız.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createPostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const post = await ForumService.createPost({
      ...validation.data,
      authorId: session.user.id,
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

