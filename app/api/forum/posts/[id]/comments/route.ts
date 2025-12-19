import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ForumService } from '@/lib/services/forum.service'
import { createCommentSchema } from '@/lib/validations/forum.validation'

export async function POST(
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

    // Check if user is banned
    const { ModerationService } = await import('@/lib/services/moderation.service')
    const isBanned = await ModerationService.isUserBanned(session.user.id)
    if (isBanned) {
      return NextResponse.json(
        { error: 'Hesabınız yasaklanmıştır. Yorum yapamazsınız.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createCommentSchema.safeParse({
      ...body,
      postId: params.id,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const comment = await ForumService.createComment({
      ...validation.data,
      authorId: session.user.id,
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

