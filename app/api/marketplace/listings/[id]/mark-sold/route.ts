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

    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
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
        { error: 'Bu ilanı satıldı olarak işaretleme yetkiniz yok' },
        { status: 403 }
      )
    }

    await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: {
        status: 'SOLD',
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

