import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const rateSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rating, comment } = rateSchema.parse(body)

    // Get order and verify buyer
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: params.id },
      include: {
        listing: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the buyer can rate this order' },
        { status: 403 }
      )
    }

    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Can only rate completed orders' },
        { status: 400 }
      )
    }

    // Check if already rated
    const existingRating = await prisma.sellerRating.findUnique({
      where: { orderId: params.id },
    })

    if (existingRating) {
      return NextResponse.json(
        { error: 'Order already rated' },
        { status: 400 }
      )
    }

    // Create rating
    await prisma.sellerRating.create({
      data: {
        orderId: params.id,
        sellerId: order.sellerId,
        buyerId: session.user.id,
        rating,
        comment: comment?.trim() || undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error rating seller:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to rate seller' },
      { status: 500 }
    )
  }
}

