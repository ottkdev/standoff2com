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

    // Validate email
    if (!user.email || !user.email.trim()) {
      return NextResponse.json(
        { error: 'Kullanıcı e-posta adresi bulunamadı' },
        { status: 400 }
      )
    }

    // Get user IP - properly handle Vercel x-forwarded-for header
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    // We need the first (client) IP
    let userIp = '127.0.0.1'
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      // Split by comma and get first IP, trim whitespace
      const ips = forwardedFor.split(',').map(ip => ip.trim())
      userIp = ips[0] || request.headers.get('x-real-ip') || '127.0.0.1'
    } else {
      userIp = request.headers.get('x-real-ip') || '127.0.0.1'
    }

    // Validate IP format - must be IPv4
    userIp = userIp.trim()
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipv4Regex.test(userIp) && userIp !== '127.0.0.1') {
      console.warn('Invalid IP format detected, using fallback:', userIp)
      userIp = '127.0.0.1'
    }

    // Ensure payment_amount is in kuruş (integer)
    if (!Number.isInteger(grossAmount) || grossAmount <= 0) {
      return NextResponse.json(
        { error: 'Geçersiz ödeme tutarı' },
        { status: 400 }
      )
    }

    // Validate merchantOid format
    if (!merchantOid || merchantOid.length < 10) {
      return NextResponse.json(
        { error: 'Geçersiz merchant OID' },
        { status: 400 }
      )
    }

    // Validate site URL is set
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    if (!siteUrl || siteUrl.trim() === '') {
      return NextResponse.json(
        { error: 'Site URL yapılandırması eksik' },
        { status: 500 }
      )
    }

    // Log init parameters (without sensitive data)
    console.log('PayTR init request:', {
      merchantOid,
      email: user.email,
      paymentAmount: grossAmount,
      userIp,
      siteUrl,
      testMode: process.env.NODE_ENV === 'development' ? 1 : 0,
    })

    // Generate PayTR hash/token with defensive error handling
    let hash: string
    try {
      hash = PayTRService.generateToken({
        merchantId,
        merchantKey,
        merchantSalt,
        email: user.email.trim(),
        paymentAmount: grossAmount, // Already in kuruş
        merchantOid,
        userIp,
        merchantOkUrl: `${siteUrl}/wallet/deposit/success?merchantOid=${merchantOid}`,
        merchantFailUrl: `${siteUrl}/wallet/deposit/fail?merchantOid=${merchantOid}`,
        testMode: process.env.NODE_ENV === 'development' ? 1 : 0,
      })
    } catch (hashError: any) {
      console.error('PayTR hash generation error:', {
        error: hashError.message,
        stack: hashError.stack,
        merchantOid,
      })
      return NextResponse.json(
        { error: `Hash oluşturma hatası: ${hashError.message}` },
        { status: 500 }
      )
    }

    // Validate hash was generated
    if (!hash || hash.length === 0) {
      console.error('Hash is empty after generation', { merchantOid })
      return NextResponse.json(
        { error: 'Hash oluşturulamadı' },
        { status: 500 }
      )
    }

    // Return PayTR form data (client will POST to PayTR API to get iframe token)
    return NextResponse.json({
      success: true,
      merchantOid,
      hash,
      merchantId,
      merchantKey,
      merchantSalt,
      email: user.email,
      paymentAmount: grossAmount,
      userIp,
      merchantOkUrl: `${siteUrl}/wallet/deposit/success?merchantOid=${merchantOid}`,
      merchantFailUrl: `${siteUrl}/wallet/deposit/fail?merchantOid=${merchantOid}`,
      testMode: process.env.NODE_ENV === 'development' ? 1 : 0,
      currency: 'TL',
      installment: 0,
      language: 'tr',
      timeoutLimit: 30,
    })
  } catch (error: any) {
    console.error('PayTR init error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

