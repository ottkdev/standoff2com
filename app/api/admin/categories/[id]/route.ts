import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı gereklidir').optional(),
  description: z.string().optional(),
  order: z.number().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updateCategorySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (validation.data.name) {
      updateData.name = validation.data.name
      updateData.slug = slugify(validation.data.name)
    }
    if (validation.data.description !== undefined) {
      updateData.description = validation.data.description || null
    }
    if (validation.data.order !== undefined) {
      updateData.order = validation.data.order
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(category)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    await prisma.category.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

