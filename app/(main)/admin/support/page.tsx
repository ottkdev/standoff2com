import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma, TicketStatus, TicketCategory, TicketPriority } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { HelpCircle, MessageSquare, Filter } from 'lucide-react'
import { SupportTicketFilters } from '@/components/admin/SupportTicketFilters'

interface PageProps {
  searchParams: {
    status?: string
    category?: string
    priority?: string
    page?: string
  }
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  WAITING_USER: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CLOSED: 'bg-green-500/20 text-green-400 border-green-500/30',
}

const statusLabels: Record<string, string> = {
  OPEN: 'Açık',
  IN_PROGRESS: 'İşlemde',
  WAITING_USER: 'Yanıt Bekleniyor',
  CLOSED: 'Kapalı',
}

const categoryLabels: Record<string, string> = {
  PAYMENT: 'Ödeme',
  MARKETPLACE: 'Marketplace',
  ACCOUNT: 'Hesap',
  TECHNICAL: 'Teknik',
  OTHER: 'Diğer',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
}

export default async function AdminSupportPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const status = searchParams.status
  const category = searchParams.category
  const priority = searchParams.priority
  const page = parseInt(searchParams.page || '1')
  const perPage = 20
  const skip = (page - 1) * perPage

  const where: Prisma.SupportTicketWhereInput = {}
  if (status) where.status = status as TicketStatus
  if (category) where.category = category as TicketCategory
  if (priority) where.priority = priority as TicketPriority

  const [tickets, total, stats] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  const totalPages = Math.ceil(total / perPage)

  const statusCounts = stats.reduce((acc, stat) => {
    acc[stat.status] = stat._count
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Destek Talepleri</h1>
        </div>
        <p className="text-sm text-muted-foreground">Tüm destek taleplerini yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Card className="glass-effect">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Toplam</div>
            <div className="text-xl font-semibold">{total}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Açık</div>
            <div className="text-xl font-semibold text-blue-400">{statusCounts.OPEN || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">İşlemde</div>
            <div className="text-xl font-semibold text-orange-400">{statusCounts.IN_PROGRESS || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Bekliyor</div>
            <div className="text-xl font-semibold text-yellow-400">{statusCounts.WAITING_USER || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <SupportTicketFilters searchParams={searchParams} />

      {/* Tickets List */}
      <Card className="glass-effect">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Talepler ({total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Henüz destek talebi yok</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/support/${ticket.id}`}
                  className="block p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 sm:gap-3 mb-2">
                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold mb-1 break-words line-clamp-2">
                            {ticket.subject}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{ticket.user.username}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                              {categoryLabels[ticket.category] || ticket.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                              {priorityLabels[ticket.priority] || ticket.priority}
                            </Badge>
                            <span>•</span>
                            <span>{ticket._count.messages} mesaj</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <Badge className={`${statusColors[ticket.status] || 'bg-muted'} text-[10px] sm:text-xs px-2 py-1`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </Badge>
                      <div className="text-right text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(ticket.lastMessageAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/support?page=${page - 1}${status ? `&status=${status}` : ''}${category ? `&category=${category}` : ''}${priority ? `&priority=${priority}` : ''}`}>
              <Button variant="outline" size="sm">Önceki</Button>
            </Link>
          )}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = page <= 3 ? i + 1 : page - 2 + i
            if (pageNum > totalPages) return null
            return (
              <Link
                key={pageNum}
                href={`/admin/support?page=${pageNum}${status ? `&status=${status}` : ''}${category ? `&category=${category}` : ''}${priority ? `&priority=${priority}` : ''}`}
              >
                <Button variant={pageNum === page ? 'default' : 'outline'} size="sm">
                  {pageNum}
                </Button>
              </Link>
            )
          })}
          {page < totalPages && (
            <Link href={`/admin/support?page=${page + 1}${status ? `&status=${status}` : ''}${category ? `&category=${category}` : ''}${priority ? `&priority=${priority}` : ''}`}>
              <Button variant="outline" size="sm">Sonraki</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

