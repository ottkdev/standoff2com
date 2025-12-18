import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(1, 'Red nedeni gereklidir').max(500, 'Red nedeni en fazla 500 karakter olabilir'),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = rejectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const listing = await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        approvedById: session.user.id,
        rejectedAt: new Date(),
        rejectedReason: validation.data.reason,
        approvedAt: null,
      },
    })

    // Log admin action
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ADMIN ACTION] User ${session.user.username} (${session.user.id}) rejected listing ${params.id}. Reason: ${validation.data.reason}`)
    }

    return NextResponse.json({ success: true, listing })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

