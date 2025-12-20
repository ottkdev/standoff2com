'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, Plus, Minus, History, ArrowRight } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface WalletData {
  id: string
  userId: string
  balanceAvailable: number
  balanceHeld: number
  createdAt: string
  updatedAt: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  provider: string
  createdAt: string
}

interface WalletOverviewProps {
  wallet: WalletData
  recentTransactions: Transaction[]
}

export function WalletOverview({ wallet, recentTransactions }: WalletOverviewProps) {
  const formatAmount = (kurus: number) => {
    return (kurus / 100).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      DEPOSIT: 'Yükleme',
      DEPOSIT_FEE: 'Yükleme Ücreti',
      HOLD: 'Tutulan',
      RELEASE: 'Serbest Bırakıldı',
      REFUND: 'İade',
      WITHDRAW_REQUEST: 'Çekim Talebi',
      WITHDRAW_APPROVED: 'Çekim Onaylandı',
      WITHDRAW_REJECTED: 'Çekim Reddedildi',
      WITHDRAW_PAID: 'Çekim Ödendi',
    }
    return labels[type] || type
  }

  const getTransactionColor = (type: string) => {
    if (type.includes('DEPOSIT') && !type.includes('FEE')) return 'text-green-500'
    if (type === 'RELEASE') return 'text-green-500'
    if (type === 'REFUND') return 'text-blue-500'
    if (type.includes('WITHDRAW')) return 'text-orange-500'
    if (type === 'HOLD') return 'text-yellow-500'
    return 'text-muted-foreground'
  }

  return (
    <div className="page-container-narrow py-6 md:py-10 overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 break-words">Cüzdan</h1>
        <p className="text-sm sm:text-base text-muted-foreground break-words">Bakiye yönetimi ve işlem geçmişi</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="break-words">Kullanılabilir Bakiye</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-green-500 break-words">
              {formatAmount(wallet.balanceAvailable)} ₺
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="break-words">Tutulan Bakiye</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-yellow-500 break-words">
              {formatAmount(wallet.balanceHeld)} ₺
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 break-words">
              Escrow ve çekim talepleri için tutulan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Link href="/wallet/deposit" className="w-full">
          <Button className="w-full min-h-[44px]" size="lg">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Para Yükle
          </Button>
        </Link>
        <Link href="/wallet/withdraw" className="w-full">
          <Button variant="outline" className="w-full min-h-[44px]" size="lg">
            <Minus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Para Çek
          </Button>
        </Link>
      </div>

      {/* Recent Transactions */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg break-words">Son İşlemler</CardTitle>
              <CardDescription className="text-xs sm:text-sm break-words">En son 10 işlem</CardDescription>
            </div>
            <Link href="/wallet/history" className="flex-shrink-0">
              <Button variant="ghost" size="sm" className="min-h-[44px] text-xs sm:text-sm">
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tümünü Gör</span>
                <span className="sm:hidden">Tümü</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground px-4">
              <Wallet className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm sm:text-base break-words">Henüz işlem yok</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors gap-2 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                      <span className={`font-medium text-xs sm:text-sm ${getTransactionColor(tx.type)} break-words`}>
                        {getTransactionLabel(tx.type)}
                      </span>
                      <Badge
                        variant={
                          tx.status === 'SUCCESS'
                            ? 'default'
                            : tx.status === 'PENDING'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-[10px] sm:text-xs"
                      >
                        {tx.status === 'SUCCESS' && 'Başarılı'}
                        {tx.status === 'PENDING' && 'Beklemede'}
                        {tx.status === 'FAILED' && 'Başarısız'}
                        {tx.status === 'CANCELLED' && 'İptal'}
                      </Badge>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground break-words">
                      {formatRelativeTime(tx.createdAt)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`font-semibold text-sm sm:text-base ${
                        tx.type.includes('DEPOSIT') && !tx.type.includes('FEE')
                          ? 'text-green-500'
                          : tx.type === 'RELEASE'
                          ? 'text-green-500'
                          : tx.type === 'REFUND'
                          ? 'text-blue-500'
                          : tx.type.includes('WITHDRAW')
                          ? 'text-orange-500'
                          : 'text-muted-foreground'
                      } break-words`}
                    >
                      {tx.type.includes('WITHDRAW') || tx.type === 'HOLD' ? '-' : '+'}
                      {formatAmount(tx.amount)} ₺
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

