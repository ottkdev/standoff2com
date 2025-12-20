import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const merchantOid = searchParams.get('merchantOid')

    if (!merchantOid) {
      return NextResponse.json(
        { error: 'merchantOid gereklidir' },
        { status: 400 }
      )
    }

    const deposit = await prisma.deposit.findUnique({
      where: { paytrMerchantOid: merchantOid },
      select: {
        id: true,
        userId: true,
        grossAmount: true,
        netCreditAmount: true,
        feeAmount: true,
        status: true,
        paytrMerchantOid: true,
        createdAt: true,
      },
    })

    if (!deposit) {
      return NextResponse.json(
        { error: 'Deposit bulunamadı' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (deposit.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu deposit\'e erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    return NextResponse.json(deposit)
  } catch (error: any) {
    console.error('Get deposit error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

