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

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const listing = await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: {
        status: 'ACTIVE',
        approvedById: session.user.id,
        approvedAt: new Date(),
        rejectedAt: null,
        rejectedReason: null,
      },
    })

    // Log admin action
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ADMIN ACTION] User ${session.user.username} (${session.user.id}) approved listing ${params.id}`)
    }

    return NextResponse.json({ success: true, listing })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

