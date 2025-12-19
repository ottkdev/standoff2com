import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PayTRService } from '@/lib/services/paytr.service'
import { WalletService } from '@/lib/services/wallet.service'
import { z } from 'zod'
import crypto from 'crypto'

const initDepositSchema = z.object({
  netCreditAmount: z.number().int().min(1000).max(5000000), // 10 TL - 50,000 TL in kuruş
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Giriş yapmalısınız' },
        { status: 401 }
      )
    }

    // Verify user exists and is not banned
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isBanned: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
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
    const validation = initDepositSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { netCreditAmount } = validation.data

    // Validate amount
    const validationResult = PayTRService.validateDepositAmount(netCreditAmount)
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    // Calculate amounts
    const { feeAmount, grossAmount } = PayTRService.calculateDepositAmounts(netCreditAmount)

    // Generate unique merchant OID
    const merchantOid = `DEPOSIT_${session.user.id}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId: session.user.id,
        grossAmount,
        netCreditAmount,
        feeAmount,
        status: 'PENDING',
        paytrMerchantOid: merchantOid,
      },
    })

    // Create pending transactions
    await WalletService.createTransaction(
      session.user.id,
      'DEPOSIT',
      netCreditAmount,
      'PENDING',
      'PAYTR',
      deposit.id,
      { depositId: deposit.id }
    )

    await WalletService.createTransaction(
      session.user.id,
      'DEPOSIT_FEE',
      feeAmount,
      'PENDING',
      'PAYTR',
      deposit.id,
      { depositId: deposit.id }
    )

    // Get PayTR credentials
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

    // Generate PayTR token
    const hash = PayTRService.generateToken({
      merchantId,
      merchantKey,
      merchantSalt,
      email: user.email,
      paymentAmount: grossAmount,
      merchantOid,
      userIp,
      merchantOkUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wallet/deposit/success`,
      merchantFailUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wallet/deposit/fail`,
      testMode: process.env.NODE_ENV === 'development' ? 1 : 0,
    })

    // Return PayTR iframe URL and data
    return NextResponse.json({
      success: true,
      merchantOid,
      iframeUrl: 'https://www.paytr.com/odeme/guvenli',
      hash,
      merchantId,
      email: user.email,
      paymentAmount: grossAmount,
      merchantOkUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wallet/deposit/success`,
      merchantFailUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wallet/deposit/fail`,
    })
  } catch (error: any) {
    console.error('PayTR init error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

