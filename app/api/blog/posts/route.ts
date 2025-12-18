import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createBlogPostSchema } from '@/lib/validations/blog.validation'
import { slugify } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createBlogPostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const slug = slugify(validation.data.title) + '-' + Date.now()

    const post = await prisma.blogPost.create({
      data: {
        ...validation.data,
        slug,
        authorId: session.user.id,
        publishedAt: validation.data.isPublished ? new Date() : null,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

