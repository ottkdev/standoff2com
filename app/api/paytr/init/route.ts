import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PayTRService } from '@/lib/services/paytr.service'
import { WalletService } from '@/lib/services/wallet.service'
import { z } from 'zod'
import crypto from 'crypto'

const MERCHANT_OID_PREFIX = 'DEP'
const MERCHANT_OID_REGEX = /^[A-Z0-9]+$/

function generateMerchantOidCandidate() {
  const random = crypto.randomBytes(8).toString('hex').toUpperCase() // 16 chars
  return `${MERCHANT_OID_PREFIX}${random}` // 19 chars, within 32
}

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

    // Generate unique, PayTR-compliant merchant OID (A-Z0-9, <=32, no underscore/dash)
    async function generateUniqueMerchantOid(): Promise<string> {
      for (let i = 0; i < 5; i++) {
        const candidate = generateMerchantOidCandidate()
        if (candidate.length <= 32 && MERCHANT_OID_REGEX.test(candidate)) {
          const exists = await prisma.deposit.findUnique({
            where: { paytrMerchantOid: candidate },
            select: { id: true },
          })
          if (!exists) return candidate
        }
      }
      throw new Error('Geçerli merchant_oid üretilemedi')
    }

    const merchantOid = await generateUniqueMerchantOid()

    // Create deposit record with final merchantOid
    const updatedDeposit = await prisma.deposit.create({
      data: {
        userId: session.user.id,
        grossAmount,
        netCreditAmount,
        feeAmount,
        status: 'PENDING',
        paytrMerchantOid: merchantOid,
      },
      select: {
        id: true,
        userId: true,
        grossAmount: true,
        netCreditAmount: true,
        feeAmount: true,
        status: true,
        paytrMerchantOid: true,
      },
    })

    const finalMerchantOid = updatedDeposit.paytrMerchantOid

    // Create pending transactions
    await WalletService.createTransaction(
      session.user.id,
      'DEPOSIT',
      netCreditAmount,
      'PENDING',
      'PAYTR',
      updatedDeposit.id,
      { depositId: updatedDeposit.id }
    )

    await WalletService.createTransaction(
      session.user.id,
      'DEPOSIT_FEE',
      feeAmount,
      'PENDING',
      'PAYTR',
      updatedDeposit.id,
      { depositId: updatedDeposit.id }
    )

    // Validate all PayTR environment variables with clear error messages
    const merchantId = process.env.PAYTR_MERCHANT_ID
    const merchantKey = process.env.PAYTR_MERCHANT_KEY
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    const paytrTestMode = process.env.PAYTR_TEST_MODE

    const missingVars: string[] = []
    if (!merchantId || merchantId.trim() === '') missingVars.push('PAYTR_MERCHANT_ID')
    if (!merchantKey || merchantKey.trim() === '') missingVars.push('PAYTR_MERCHANT_KEY')
    if (!merchantSalt || merchantSalt.trim() === '') missingVars.push('PAYTR_MERCHANT_SALT')
    if (!siteUrl || siteUrl.trim() === '') missingVars.push('NEXT_PUBLIC_SITE_URL')

    if (missingVars.length > 0) {
      console.error('Missing PayTR environment variables:', missingVars)
      return NextResponse.json(
        { 
          error: `PayTR yapılandırması eksik: ${missingVars.join(', ')}`,
          missingVars,
        },
        { status: 500 }
      )
    }

    // TypeScript: After validation, we know these are defined
    const validatedMerchantId = merchantId!
    const validatedMerchantKey = merchantKey!
    const validatedMerchantSalt = merchantSalt!
    const validatedSiteUrl = siteUrl!

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

    // Determine test mode: explicit PAYTR_TEST_MODE env var takes precedence
    let testModeValue: number
    if (paytrTestMode === '1' || paytrTestMode?.toLowerCase() === 'true') {
      testModeValue = 1
      console.log('PayTR test mode: ENABLED (via PAYTR_TEST_MODE env)')
    } else if (process.env.NODE_ENV === 'development') {
      testModeValue = 1
      console.log('PayTR test mode: ENABLED (via NODE_ENV=development)')
    } else {
      testModeValue = 0
      console.log('PayTR test mode: DISABLED (production)')
    }

    // Log merchant_oid before sending to PayTR (CRITICAL for debugging)
    console.log('PayTR merchant_oid generated:', {
      merchantOid: finalMerchantOid,
      length: finalMerchantOid.length,
      isValid: /^[A-Za-z0-9]+$/.test(finalMerchantOid) && finalMerchantOid.length <= 32,
      depositId: deposit.id,
    })

    // Log init parameters (without sensitive data)
    console.log('PayTR init request:', {
      merchantOid: finalMerchantOid,
      email: user.email,
      paymentAmount: grossAmount,
      userIp,
      siteUrl: validatedSiteUrl.trim(),
      testMode: testModeValue,
      paytrTestModeEnv: paytrTestMode,
    })

    // Generate PayTR hash/token with defensive error handling
    let hash: string
    try {
      hash = PayTRService.generateToken({
        merchantId: validatedMerchantId.trim(),
        merchantKey: validatedMerchantKey.trim(),
        merchantSalt: validatedMerchantSalt.trim(),
        email: user.email.trim(),
        paymentAmount: grossAmount, // Already in kuruş
        merchantOid: finalMerchantOid,
        userIp,
        merchantOkUrl: `${validatedSiteUrl.trim()}/wallet/deposit/success?merchantOid=${finalMerchantOid}`,
        merchantFailUrl: `${validatedSiteUrl.trim()}/wallet/deposit/fail?merchantOid=${finalMerchantOid}`,
        testMode: testModeValue,
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
      merchantOid: finalMerchantOid,
      hash,
      merchantId: validatedMerchantId,
      merchantKey: validatedMerchantKey,
      merchantSalt: validatedMerchantSalt,
      email: user.email,
      paymentAmount: grossAmount,
      userIp,
      merchantOkUrl: `${validatedSiteUrl.trim()}/wallet/deposit/success?merchantOid=${finalMerchantOid}`,
      merchantFailUrl: `${validatedSiteUrl.trim()}/wallet/deposit/fail?merchantOid=${finalMerchantOid}`,
      testMode: testModeValue,
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

