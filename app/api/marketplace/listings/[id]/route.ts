import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateListingSchema } from '@/lib/validations/marketplace.validation'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        id: params.id,
        deletedAt: null, // Soft delete kontrolü
      },
      include: {
        seller: true,
        images: true,
      },
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'İlan bulunamadı' },
        { status: 404 }
      )
    }

    const isOwner = session?.user?.id === listing.sellerId
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MODERATOR'
    const isPublic = listing.status === 'ACTIVE'

    if (!isPublic && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Bu ilana erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    return NextResponse.json(listing)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
      select: { sellerId: true },
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'İlan bulunamadı' },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu ilanı düzenleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updateListingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (validation.data.title !== undefined) updateData.title = validation.data.title
    if (validation.data.description !== undefined) updateData.description = validation.data.description
    if (validation.data.price !== undefined) updateData.price = validation.data.price
    if (validation.data.images !== undefined) {
      updateData.images = {
        deleteMany: {},
        create: validation.data.images.map((url, index) => ({
          url,
          order: index,
        })),
      }
    }

    const updated = await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: updateData,
      include: {
        seller: true,
        images: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
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

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
      select: { sellerId: true },
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'İlan bulunamadı' },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu ilanı silme yetkiniz yok' },
        { status: 403 }
      )
    }

    // Soft delete
    await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

