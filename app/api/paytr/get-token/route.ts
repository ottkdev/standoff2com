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
    let userIp = '8.8.8.8'
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim()).filter(Boolean)
      userIp = ips[0] || request.headers.get('x-real-ip') || '8.8.8.8'
    } else {
      userIp = request.headers.get('x-real-ip') || '8.8.8.8'
    }
    userIp = userIp.trim() || '8.8.8.8'

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
    const missingPaytrFields: string[] = []
    if (!validatedMerchantId) missingPaytrFields.push('merchant_id')
    if (!validatedMerchantKey) missingPaytrFields.push('merchant_key')
    if (!validatedMerchantSalt) missingPaytrFields.push('merchant_salt')
    if (!merchantOid) missingPaytrFields.push('merchant_oid')
    if (!user.email) missingPaytrFields.push('email')
    if (!hash) missingPaytrFields.push('hash')
    if (!userIp) missingPaytrFields.push('user_ip')
    if (missingPaytrFields.length > 0) {
      console.error('Missing required PayTR fields:', missingPaytrFields)
      return NextResponse.json(
        { error: `Eksik PayTR alanları: ${missingPaytrFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Log merchant_oid before sending to PayTR (CRITICAL for debugging)
    console.log('PayTR merchant_oid validation:', {
      merchantOid,
      length: merchantOid.length,
      isValid: /^[A-Za-z0-9]+$/.test(merchantOid) && merchantOid.length <= 32,
      containsUnderscore: merchantOid.includes('_'),
      containsHash: merchantOid.includes('#'),
      containsDash: merchantOid.includes('-'),
    })

    // Validate merchant_oid format (PayTR requirements)
    if (!/^[A-Za-z0-9]+$/.test(merchantOid) || merchantOid.length > 32) {
      console.error('INVALID merchant_oid format detected:', {
        merchantOid,
        length: merchantOid.length,
        pattern: /^[A-Za-z0-9]+$/.test(merchantOid),
      })
      return NextResponse.json(
        { 
          error: `Geçersiz merchant_oid formatı: ${merchantOid}. Sadece A-Z, a-z, 0-9 karakterleri kullanılabilir ve maksimum 32 karakter olmalıdır.`,
          merchantOid,
        },
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

    // Build user_basket (required): [["Bakiye Yükleme", "<tutar TL string>", 1]]
    const amountTlString = (deposit.grossAmount / 100).toFixed(2)
    const userBasketPayload = [['Bakiye Yükleme', amountTlString, 1]]
    const userBasketJson = JSON.stringify(userBasketPayload)
    const userBasketBase64 = Buffer.from(userBasketJson).toString('base64')

    if (!userBasketBase64) {
      return NextResponse.json(
        { error: 'user_basket oluşturulamadı' },
        { status: 400 }
      )
    }

    console.log('PayTR user_basket (base64):', userBasketBase64)

    // Call PayTR API to get token - use URLSearchParams for application/x-www-form-urlencoded
    // ALL values MUST be strings and we must NOT send JSON
    const paytrParams = new URLSearchParams()
    paytrParams.append('merchant_id', String(validatedMerchantId).trim())
    paytrParams.append('user_ip', String(userIp))
    paytrParams.append('merchant_oid', String(merchantOid))
    paytrParams.append('email', String(user.email).trim())
    paytrParams.append('payment_amount', String(deposit.grossAmount)) // In kuruş, as string
    paytrParams.append('currency', 'TL')
    paytrParams.append('test_mode', String(testMode)) // Must be '0' or '1' as string
    paytrParams.append('merchant_ok_url', String(merchantOkUrl))
    paytrParams.append('merchant_fail_url', String(merchantFailUrl))
    paytrParams.append('callback_url', String(callbackUrl)) // PayTR callback URL
    paytrParams.append('hash', String(hash)) // PayTR hash/token value
    paytrParams.append('user_basket', userBasketBase64)

    // Log request parameters for debugging (without sensitive data)
    console.log('PayTR request parameters (URLSearchParams):', {
      merchant_id: String(validatedMerchantId).substring(0, 5) + '...',
      merchant_oid: String(merchantOid),
      email: String(user.email).trim(),
      payment_amount: String(deposit.grossAmount),
      user_ip: String(userIp),
      test_mode: String(testMode),
      callback_url: String(callbackUrl),
      merchant_ok_url: String(merchantOkUrl),
      merchant_fail_url: String(merchantFailUrl),
      currency: 'TL',
    })

    // Call PayTR API with application/x-www-form-urlencoded
    let paytrResponse: Response
    let paytrResult: string
    let parsedResponse: any = null
    
    try {
      console.log('Calling PayTR API: https://www.paytr.com/odeme/api/get-token')
      console.log('Request Content-Type: application/x-www-form-urlencoded')
      console.log('Request body length:', paytrParams.toString().length)
      
      paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: paytrParams.toString(), // URLSearchParams.toString() creates the encoded string
      })

      paytrResult = await paytrResponse.text()
      
      // Log response details (raw + parsed)
      console.log('PayTR API response status:', paytrResponse.status)
      console.log('PayTR API response statusText:', paytrResponse.statusText)
      console.log('PayTR API response body (raw text):', paytrResult)
      console.log('PayTR API response body length:', paytrResult.length)
      
      // Try to parse response as JSON if possible (for status/reason/error)
      try {
        parsedResponse = JSON.parse(paytrResult)
      } catch (e) {
        parsedResponse = null
      }
      console.log('PayTR API response parsed object:', parsedResponse)
      
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

    // PayTR returns JSON with status and token on success; otherwise includes reason/error
    if (parsedResponse && parsedResponse.status === 'success' && parsedResponse.token) {
      const token = String(parsedResponse.token).trim()
      if (!token) {
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
    }

    // Fallback for legacy plain-text "token=" response
    if (paytrResult.startsWith('token=')) {
      const token = paytrResult.replace('token=', '').trim()
      if (!token || token.length === 0) {
        console.error('PayTR returned empty token')
        return NextResponse.json(
          { error: 'PayTR token boş döndü' },
          { status: 500 }
        )
      }
      console.log('PayTR token received successfully (legacy), length:', token.length)
      return NextResponse.json({
        success: true,
        token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${token}`,
      })
    }

    // PayTR returned an error - extract real error message (status !== success)
    let errorMessage = paytrResult || 'PayTR ödeme başlatılamadı'
    if (parsedResponse) {
      if (parsedResponse.reason) {
        errorMessage = parsedResponse.reason
      } else if (parsedResponse.error) {
        errorMessage = parsedResponse.error
      } else if (parsedResponse.message) {
        errorMessage = parsedResponse.message
      } else if (typeof parsedResponse === 'string') {
        errorMessage = parsedResponse
      }
    }

    // Log error details
      console.log('PayTR API raw error response:', paytrResult)
      console.error('PayTR API error response:', {
        status: paytrResponse.status,
        statusText: paytrResponse.statusText,
        body: paytrResult,
        parsedResponse,
        extractedError: errorMessage,
        merchantOid,
      })
    
    // Return PayTR's actual error message to client
    return NextResponse.json(
      { 
        error: errorMessage, // PayTR'nin gerçek hatası
        paytrError: paytrResult, // Raw error for debugging
        paytrParsedError: parsedResponse, // Parsed error if available
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('PayTR get-token error:', error)
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

