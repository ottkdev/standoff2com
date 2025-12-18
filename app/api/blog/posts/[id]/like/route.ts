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

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const existing = await prisma.blogLike.findUnique({
      where: {
        userId_blogPostId: {
          userId: session.user.id,
          blogPostId: params.id,
        },
      },
    })

    if (existing) {
      // Unlike
      await prisma.blogLike.delete({
        where: {
          userId_blogPostId: {
            userId: session.user.id,
            blogPostId: params.id,
          },
        },
      })
      await prisma.blogPost.update({
        where: { id: params.id },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      })
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await prisma.blogLike.create({
        data: {
          userId: session.user.id,
          blogPostId: params.id,
        },
      })
      await prisma.blogPost.update({
        where: { id: params.id },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

