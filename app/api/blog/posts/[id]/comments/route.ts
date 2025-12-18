import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createBlogCommentSchema } from '@/lib/validations/blog.validation'

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

    const body = await request.json()
    const validation = createBlogCommentSchema.safeParse({
      ...body,
      blogPostId: params.id,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const comment = await prisma.blogComment.create({
      data: {
        content: validation.data.content,
        blogPostId: params.id,
        authorId: session.user.id,
        parentId: validation.data.parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    })

    // Update comment count
    await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

