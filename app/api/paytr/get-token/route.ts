import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { merchantOid } = body

    if (!merchantOid) {
      return NextResponse.json(
        { error: 'merchantOid gereklidir' },
        { status: 400 }
      )
    }

    // Get deposit to verify ownership
    const deposit = await prisma.deposit.findUnique({
      where: { paytrMerchantOid: merchantOid },
      select: {
        id: true,
        userId: true,
        grossAmount: true,
        netCreditAmount: true,
        status: true,
      },
    })

    if (!deposit) {
      return NextResponse.json(
        { error: 'Deposit bulunamadı' },
        { status: 404 }
      )
    }

    if (deposit.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bu deposit\'e erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    if (deposit.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Bu deposit zaten işlenmiş' },
        { status: 400 }
      )
    }

    // Get user and PayTR credentials
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    const merchantId = process.env.PAYTR_MERCHANT_ID
    const merchantKey = process.env.PAYTR_MERCHANT_KEY
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT

    if (!merchantId || !merchantKey || !merchantSalt) {
      return NextResponse.json(
        { error: 'PayTR yapılandırması eksik' },
        { status: 500 }
      )
    }

    // Get user IP
    const userIp =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    // Import PayTRService
    const { PayTRService } = await import('@/lib/services/paytr.service')

    // Generate hash
    const hash = PayTRService.generateToken({
      merchantId,
      merchantKey,
      merchantSalt,
      email: user.email,
      paymentAmount: deposit.grossAmount,
      merchantOid,
      userIp,
      merchantOkUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wallet/deposit/success?merchantOid=${merchantOid}`,
      merchantFailUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wallet/deposit/fail?merchantOid=${merchantOid}`,
      testMode: process.env.NODE_ENV === 'development' ? 1 : 0,
    })

    // Call PayTR API to get token
    const paytrFormData = new FormData()
    paytrFormData.append('merchant_id', merchantId)
    paytrFormData.append('merchant_key', merchantKey)
    paytrFormData.append('merchant_salt', merchantSalt)
    paytrFormData.append('merchant_oid', merchantOid)
    paytrFormData.append('email', user.email)
    paytrFormData.append('payment_amount', deposit.grossAmount.toString())
    paytrFormData.append('paytr_token', hash)
    paytrFormData.append('user_ip', userIp)
    paytrFormData.append('merchant_ok_url', `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wallet/deposit/success?merchantOid=${merchantOid}`)
    paytrFormData.append('merchant_fail_url', `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wallet/deposit/fail?merchantOid=${merchantOid}`)
    paytrFormData.append('test_mode', process.env.NODE_ENV === 'development' ? '1' : '0')
    paytrFormData.append('currency', 'TL')
    paytrFormData.append('installment', '0')
    paytrFormData.append('lang', 'tr')
    paytrFormData.append('timeout_limit', '30')

    const paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      body: paytrFormData,
    })

    if (!paytrResponse.ok) {
      return NextResponse.json(
        { error: 'PayTR token alınamadı' },
        { status: 500 }
      )
    }

    const paytrResult = await paytrResponse.text()

    // PayTR returns "token=..." or error message
    if (paytrResult.startsWith('token=')) {
      const token = paytrResult.replace('token=', '')
      return NextResponse.json({
        success: true,
        token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${token}`,
      })
    } else {
      return NextResponse.json(
        { error: paytrResult || 'PayTR ödeme başlatılamadı' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('PayTR get-token error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

