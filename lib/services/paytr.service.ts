import crypto from 'crypto'

interface PayTRInitParams {
  merchantId: string
  merchantKey: string
  merchantSalt: string
  email: string
  paymentAmount: number // in kuruş
  merchantOid: string
  userIp: string
  userAddress?: string
  userPhone?: string
  merchantOkUrl?: string
  merchantFailUrl?: string
  timeoutLimit?: number
  testMode?: number
  currency?: string
  installment?: number
  language?: string
}

interface PayTRCallbackData {
  merchant_oid: string
  status: 'success' | 'failed'
  total_amount: string
  hash: string
  failed_reason_code?: string
  failed_reason_msg?: string
  test_mode?: string
  payment_type?: string
  currency?: string
}

export class PayTRService {
  /**
   * Generate PayTR token/hash for payment initialization
   */
  static generateToken(params: PayTRInitParams): string {
    const {
      merchantId,
      merchantKey,
      merchantSalt,
      email,
      paymentAmount,
      merchantOid,
      userIp,
      userAddress = '',
      userPhone = '',
      merchantOkUrl = '',
      merchantFailUrl = '',
      timeoutLimit = 30,
      testMode = 0,
      currency = 'TL',
      installment = 0,
      language = 'tr',
    } = params

    // PayTR hash calculation
    const hashStr = `${merchantId}${merchantSalt}${merchantOid}${userIp}${email}${paymentAmount}${testMode}${timeoutLimit}${currency}${installment}${language}`
    const hash = crypto
      .createHmac('sha256', merchantKey)
      .update(hashStr)
      .digest('base64')

    return hash
  }

  /**
   * Verify PayTR callback hash
   */
  static verifyCallback(
    data: PayTRCallbackData,
    merchantKey: string,
    merchantSalt: string
  ): boolean {
    const hashStr = `${merchantSalt}${data.merchant_oid}${data.status}${data.total_amount}`
    const calculatedHash = crypto
      .createHmac('sha256', merchantKey)
      .update(hashStr)
      .digest('base64')

    return calculatedHash === data.hash
  }

  /**
   * Calculate deposit amounts with 10% fee
   * User pays gross, receives net
   * Fee = 10% of net
   * Gross = net + fee
   */
  static calculateDepositAmounts(netCreditAmount: number): {
    netCreditAmount: number // in kuruş
    feeAmount: number // in kuruş
    grossAmount: number // in kuruş
  } {
    // Fee is 10% of net credit
    const feeAmount = Math.ceil(netCreditAmount * 0.1)
    const grossAmount = netCreditAmount + feeAmount

    return {
      netCreditAmount,
      feeAmount,
      grossAmount,
    }
  }

  /**
   * Validate deposit amount
   */
  static validateDepositAmount(netCreditAmount: number): {
    valid: boolean
    error?: string
  } {
    const minAmount = 1000 // 10 TL in kuruş
    const maxAmount = 5000000 // 50,000 TL in kuruş

    if (netCreditAmount < minAmount) {
      return {
        valid: false,
        error: `Minimum yükleme tutarı ${minAmount / 100} TL'dir`,
      }
    }

    if (netCreditAmount > maxAmount) {
      return {
        valid: false,
        error: `Maksimum yükleme tutarı ${maxAmount / 100} TL'dir`,
      }
    }

    return { valid: true }
  }
}

