import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createListingSchema } from '@/lib/validations/marketplace.validation'

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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isBanned: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.' },
        { status: 401 }
      )
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Hesabınız yasaklanmıştır' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createListingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        title: validation.data.title,
        description: validation.data.description,
        price: validation.data.price,
        sellerId: user.id,
        status: 'PENDING',
        images: {
          create: validation.data.images.map((url, index) => ({
            url,
            order: index,
          })),
        },
      },
      include: {
        seller: true,
        images: true,
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

