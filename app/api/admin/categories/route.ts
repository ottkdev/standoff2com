import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı gereklidir'),
  description: z.string().optional(),
  order: z.number().default(0),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createCategorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const slug = slugify(validation.data.name)

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Bu isimde bir kategori zaten var' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: validation.data.name,
        slug,
        description: validation.data.description || null,
        order: validation.data.order,
      },
    })

    return NextResponse.json(category)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

