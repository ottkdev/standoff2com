import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (slug) {
      const category = await prisma.category.findUnique({
        where: { slug },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Kategori bulunamadı' },
          { status: 404 }
        )
      }

      return NextResponse.json(category)
    }

    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

