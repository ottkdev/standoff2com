'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SupportTicketFiltersProps {
  searchParams: {
    status?: string
    category?: string
    priority?: string
  }
}

export function SupportTicketFilters({ searchParams }: SupportTicketFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()

  const buildUrl = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(params.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    newParams.set('page', '1')
    return `/admin/support?${newParams.toString()}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtreler</span>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: null, label: 'Tümü' },
          { key: 'OPEN', label: 'Açık' },
          { key: 'IN_PROGRESS', label: 'İşlemde' },
          { key: 'WAITING_USER', label: 'Bekliyor' },
          { key: 'CLOSED', label: 'Kapalı' },
        ].map((status) => {
          const isActive = searchParams.status === status.key || (!searchParams.status && status.key === null)
          return (
            <Link key={status.key || 'all'} href={buildUrl({ status: status.key || null })}>
              <Badge
                variant={isActive ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer text-xs px-2 py-1',
                  isActive && 'bg-primary text-primary-foreground'
                )}
              >
                {status.label}
              </Badge>
            </Link>
          )
        })}
      </div>

      {/* Category & Priority Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'PAYMENT', label: 'Ödeme' },
          { key: 'MARKETPLACE', label: 'Marketplace' },
          { key: 'ACCOUNT', label: 'Hesap' },
          { key: 'TECHNICAL', label: 'Teknik' },
          { key: 'OTHER', label: 'Diğer' },
        ].map((category) => {
          const isActive = searchParams.category === category.key
          return (
            <Link key={category.key} href={buildUrl({ category: isActive ? null : category.key })}>
              <Badge
                variant={isActive ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer text-xs px-2 py-1',
                  isActive && 'bg-primary text-primary-foreground'
                )}
              >
                {category.label}
              </Badge>
            </Link>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'LOW', label: 'Düşük' },
          { key: 'MEDIUM', label: 'Orta' },
          { key: 'HIGH', label: 'Yüksek' },
        ].map((priority) => {
          const isActive = searchParams.priority === priority.key
          return (
            <Link key={priority.key} href={buildUrl({ priority: isActive ? null : priority.key })}>
              <Badge
                variant={isActive ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer text-xs px-2 py-1',
                  isActive && 'bg-primary text-primary-foreground'
                )}
              >
                {priority.label}
              </Badge>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default SupportTicketFilters

