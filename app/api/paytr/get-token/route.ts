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
    // Use non-null assertions since we've validated above
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
    let userIp = '127.0.0.1'
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim())
      userIp = ips[0] || request.headers.get('x-real-ip') || '127.0.0.1'
    } else {
      userIp = request.headers.get('x-real-ip') || '127.0.0.1'
    }
    userIp = userIp.trim()

    // Validate payment amount is in kuruş (integer)
    if (!Number.isInteger(deposit.grossAmount) || deposit.grossAmount <= 0) {
      console.error('Invalid payment amount:', deposit.grossAmount)
      return NextResponse.json(
        { error: 'Geçersiz ödeme tutarı' },
        { status: 400 }
      )
    }

    // Determine test mode: explicit PAYTR_TEST_MODE env var takes precedence
    // If PAYTR_TEST_MODE is '1' or 'true', force test mode
    // Otherwise, fall back to NODE_ENV check
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

    // Validate IP is IPv4 format (basic check)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipv4Regex.test(userIp) && userIp !== '127.0.0.1') {
      console.warn('Invalid IP format, using fallback:', userIp)
      userIp = '127.0.0.1'
    }

    // Import PayTRService
    const { PayTRService } = await import('@/lib/services/paytr.service')

    // Prepare callback URL (PayTR panel must match this) - generate ONLY ONCE
    const callbackUrl = `${validatedSiteUrl.trim()}/api/paytr/callback`
    const merchantOkUrl = `${validatedSiteUrl.trim()}/wallet/deposit/success?merchantOid=${merchantOid}`
    const merchantFailUrl = `${validatedSiteUrl.trim()}/wallet/deposit/fail?merchantOid=${merchantOid}`

    // Generate hash with defensive error handling
    let hash: string
    try {
      hash = PayTRService.generateToken({
        merchantId: validatedMerchantId.trim(),
        merchantKey: validatedMerchantKey.trim(),
        merchantSalt: validatedMerchantSalt.trim(),
        email: user.email.trim(),
        paymentAmount: deposit.grossAmount, // Already in kuruş
        merchantOid,
        userIp,
        merchantOkUrl,
        merchantFailUrl,
        testMode: testModeValue,
      })
    } catch (hashError: any) {
      console.error('PayTR hash generation error:', hashError)
      return NextResponse.json(
        { error: `Hash oluşturma hatası: ${hashError.message}` },
        { status: 500 }
      )
    }

    if (!hash || hash.length === 0) {
      console.error('Hash is empty after generation')
      return NextResponse.json(
        { error: 'Hash oluşturulamadı' },
        { status: 500 }
      )
    }

    // Prepare PayTR API call - all values must be strings
    // callbackUrl, merchantOkUrl, merchantFailUrl already defined above
    const testMode = String(testModeValue) // Convert to string: '0' or '1'

    // Validate all required fields before sending to PayTR
    if (!validatedMerchantId || !validatedMerchantKey || !validatedMerchantSalt || !merchantOid || !user.email || !hash || !userIp) {
      console.error('Missing required PayTR fields:', {
        hasMerchantId: !!validatedMerchantId,
        hasMerchantKey: !!validatedMerchantKey,
        hasMerchantSalt: !!validatedMerchantSalt,
        hasMerchantOid: !!merchantOid,
        hasEmail: !!user.email,
        hasHash: !!hash,
        hasUserIp: !!userIp,
      })
      return NextResponse.json(
        { error: 'PayTR için gerekli alanlar eksik' },
        { status: 400 }
      )
    }

    // Log request parameters (without sensitive data)
    console.log('PayTR get-token request parameters:', {
      merchantId: validatedMerchantId,
      merchantOid,
      email: user.email,
      paymentAmount: deposit.grossAmount,
      paymentAmountString: String(deposit.grossAmount),
      userIp,
      testMode,
      testModeValue,
      merchantOkUrl,
      merchantFailUrl,
      callbackUrl,
      siteUrl: validatedSiteUrl,
      paytrTestModeEnv: paytrTestMode,
    })

    // Call PayTR API to get token - ALL values MUST be strings
    const paytrFormData = new FormData()
    paytrFormData.append('merchant_id', String(validatedMerchantId).trim())
    paytrFormData.append('merchant_key', String(validatedMerchantKey).trim())
    paytrFormData.append('merchant_salt', String(validatedMerchantSalt).trim())
    paytrFormData.append('merchant_oid', String(merchantOid))
    paytrFormData.append('email', String(user.email).trim())
    paytrFormData.append('payment_amount', String(deposit.grossAmount)) // In kuruş, as string
    paytrFormData.append('paytr_token', String(hash))
    paytrFormData.append('user_ip', String(userIp))
    paytrFormData.append('merchant_ok_url', String(merchantOkUrl))
    paytrFormData.append('merchant_fail_url', String(merchantFailUrl))
    paytrFormData.append('callback_url', String(callbackUrl)) // PayTR callback URL
    paytrFormData.append('test_mode', String(testMode)) // Must be '0' or '1' as string
    paytrFormData.append('currency', 'TL')
    paytrFormData.append('installment', '0')
    paytrFormData.append('lang', 'tr')
    paytrFormData.append('timeout_limit', '30')

    // Log FormData values for debugging (without sensitive data)
    console.log('PayTR FormData values:', {
      merchant_id: String(validatedMerchantId).substring(0, 5) + '...',
      merchant_oid: String(merchantOid),
      email: String(user.email).trim(),
      payment_amount: String(deposit.grossAmount),
      user_ip: String(userIp),
      test_mode: String(testMode),
      callback_url: String(callbackUrl),
      merchant_ok_url: String(merchantOkUrl),
      merchant_fail_url: String(merchantFailUrl),
    })

    // Call PayTR API
    let paytrResponse: Response
    let paytrResult: string
    
    try {
      console.log('Calling PayTR API: https://www.paytr.com/odeme/api/get-token')
      paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
        method: 'POST',
        body: paytrFormData,
      })

      paytrResult = await paytrResponse.text()
      console.log('PayTR API response status:', paytrResponse.status)
      console.log('PayTR API response statusText:', paytrResponse.statusText)
      console.log('PayTR API response body (full):', paytrResult)
      console.log('PayTR API response body length:', paytrResult.length)
      
      // Log response headers for debugging
      const responseHeaders: Record<string, string> = {}
      paytrResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
      console.log('PayTR API response headers:', responseHeaders)
    } catch (fetchError: any) {
      console.error('PayTR API fetch error:', {
        message: fetchError.message,
        stack: fetchError.stack,
        name: fetchError.name,
      })
      return NextResponse.json(
        { error: `PayTR API'ye bağlanılamadı: ${fetchError.message}` },
        { status: 500 }
      )
    }

    // PayTR returns "token=..." on success, or error message on failure
    if (paytrResult.startsWith('token=')) {
      const token = paytrResult.replace('token=', '').trim()
      if (!token || token.length === 0) {
        console.error('PayTR returned empty token')
        return NextResponse.json(
          { error: 'PayTR token boş döndü' },
          { status: 500 }
        )
      }
      console.log('PayTR token received successfully, length:', token.length)
      return NextResponse.json({
        success: true,
        token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${token}`,
      })
    } else {
      // PayTR returned an error - log it and return to client
      console.error('PayTR API error response:', {
        status: paytrResponse.status,
        statusText: paytrResponse.statusText,
        body: paytrResult,
        merchantOid,
      })
      return NextResponse.json(
        { 
          error: paytrResult || 'PayTR ödeme başlatılamadı',
          paytrError: paytrResult, // Include raw error for debugging
        },
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

