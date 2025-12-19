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
    <div className="container py-6 md:py-10 px-4 md:px-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Cüzdan</h1>
        <p className="text-muted-foreground">Bakiye yönetimi ve işlem geçmişi</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Kullanılabilir Bakiye
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {formatAmount(wallet.balanceAvailable)} ₺
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Tutulan Bakiye
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {formatAmount(wallet.balanceHeld)} ₺
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Escrow ve çekim talepleri için tutulan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link href="/wallet/deposit">
          <Button className="w-full min-h-[44px]" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Para Yükle
          </Button>
        </Link>
        <Link href="/wallet/withdraw">
          <Button variant="outline" className="w-full min-h-[44px]" size="lg">
            <Minus className="h-5 w-5 mr-2" />
            Para Çek
          </Button>
        </Link>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Son İşlemler</CardTitle>
              <CardDescription>En son 10 işlem</CardDescription>
            </div>
            <Link href="/wallet/history">
              <Button variant="ghost" size="sm" className="min-h-[44px]">
                <History className="h-4 w-4 mr-2" />
                Tümünü Gör
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Henüz işlem yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${getTransactionColor(tx.type)}`}>
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
                        className="text-xs"
                      >
                        {tx.status === 'SUCCESS' && 'Başarılı'}
                        {tx.status === 'PENDING' && 'Beklemede'}
                        {tx.status === 'FAILED' && 'Başarısız'}
                        {tx.status === 'CANCELLED' && 'İptal'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(tx.createdAt)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div
                      className={`font-semibold ${
                        tx.type.includes('DEPOSIT') && !tx.type.includes('FEE')
                          ? 'text-green-500'
                          : tx.type === 'RELEASE'
                          ? 'text-green-500'
                          : tx.type === 'REFUND'
                          ? 'text-blue-500'
                          : tx.type.includes('WITHDRAW')
                          ? 'text-orange-500'
                          : 'text-muted-foreground'
                      }`}
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

