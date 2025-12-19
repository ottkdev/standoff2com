import { NextResponse } from 'next/server'
import { OrderService } from '@/lib/services/order.service'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // This endpoint can be called by anyone (idempotent)
    // It checks if auto-release time has passed and processes if needed
    const result = await OrderService.autoReleaseOrder(params.id)

    if (!result) {
      return NextResponse.json({ message: 'Not ready for auto-release or already processed' })
    }

    return NextResponse.json({ success: true, order: result })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

