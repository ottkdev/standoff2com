import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listing = await prisma.marketplaceListing.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await prisma.marketplaceListingLike.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: params.id,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 })
    }

    // Create like
    await prisma.marketplaceListingLike.create({
      data: {
        userId: session.user.id,
        listingId: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error liking listing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to like listing' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.marketplaceListingLike.delete({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: params.id,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error unliking listing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unlike listing' },
      { status: 500 }
    )
  }
}

