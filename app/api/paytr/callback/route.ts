import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PayTRService } from '@/lib/services/paytr.service'
import { WalletService } from '@/lib/services/wallet.service'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const data: any = {}
    formData.forEach((value, key) => {
      data[key] = value.toString()
    })

    const merchantOid = data.merchant_oid
    const status = data.status
    const totalAmount = data.total_amount
    const hash = data.hash

    if (!merchantOid || !status || !hash) {
      return new NextResponse('MISSING_PARAMS', { status: 400 })
    }

    // Get PayTR credentials
    const merchantKey = process.env.PAYTR_MERCHANT_KEY
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT

    if (!merchantKey || !merchantSalt) {
      console.error('PayTR credentials missing')
      return new NextResponse('CONFIG_ERROR', { status: 500 })
    }

    // Verify hash
    const isValid = PayTRService.verifyCallback(
      {
        merchant_oid: merchantOid,
        status: status as 'success' | 'failed',
        total_amount: totalAmount,
        hash,
      },
      merchantKey,
      merchantSalt
    )

    if (!isValid) {
      console.error('PayTR callback hash verification failed', { merchantOid })
      return new NextResponse('HASH_MISMATCH', { status: 400 })
    }

    // Find deposit by merchant OID
    const deposit = await prisma.deposit.findUnique({
      where: { paytrMerchantOid: merchantOid },
    })

    if (!deposit) {
      console.error('Deposit not found', { merchantOid })
      return new NextResponse('DEPOSIT_NOT_FOUND', { status: 404 })
    }

    // Idempotency check
    if (deposit.status === 'SUCCESS' || deposit.status === 'FAILED') {
      return new NextResponse('OK', { status: 200 })
    }

    // Process based on status
    if (status === 'success') {
      // Verify amount matches
      const expectedGross = deposit.grossAmount
      const receivedGross = parseInt(totalAmount)

      if (receivedGross !== expectedGross) {
        console.error('Amount mismatch', {
          merchantOid,
          expected: expectedGross,
          received: receivedGross,
        })
        // Still mark as failed due to amount mismatch
        await prisma.$transaction(async (tx) => {
          await tx.deposit.update({
            where: { id: deposit.id },
            data: {
              status: 'FAILED',
              paytrResponse: data,
            },
          })

          // Update transactions
          await tx.walletTransaction.updateMany({
            where: {
              referenceId: deposit.id,
              status: 'PENDING',
            },
            data: {
              status: 'FAILED',
            },
          })
        })

        return new NextResponse('AMOUNT_MISMATCH', { status: 400 })
      }

      // Process successful payment
      await prisma.$transaction(async (tx) => {
        // Update deposit
        await tx.deposit.update({
          where: { id: deposit.id },
          data: {
            status: 'SUCCESS',
            paytrResponse: data,
          },
        })

        // Update transactions to SUCCESS
        await tx.walletTransaction.updateMany({
          where: {
            referenceId: deposit.id,
            status: 'PENDING',
          },
          data: {
            status: 'SUCCESS',
          },
        })

        // Credit wallet with net amount only (fee is platform revenue)
        await WalletService.credit(
          deposit.userId,
          deposit.netCreditAmount,
          'DEPOSIT',
          'PAYTR',
          deposit.id,
          { depositId: deposit.id, paytrResponse: data }
        )
      })
    } else {
      // Payment failed
      await prisma.$transaction(async (tx) => {
        await tx.deposit.update({
          where: { id: deposit.id },
          data: {
            status: 'FAILED',
            paytrResponse: data,
          },
        })

        await tx.walletTransaction.updateMany({
          where: {
            referenceId: deposit.id,
            status: 'PENDING',
          },
          data: {
            status: 'FAILED',
          },
        })
      })
    }

    // Always return OK to PayTR
    return new NextResponse('OK', { status: 200 })
  } catch (error: any) {
    console.error('PayTR callback error:', error)
    // Still return OK to PayTR to prevent retries
    return new NextResponse('OK', { status: 200 })
  }
}

