'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle,
  Flag,
  Trash2,
  RotateCcw,
  Ban,
  Shield,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShoppingBag,
  User,
  FileText,
  Loader2,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'

interface Report {
  id: string
  reporterId: string
  targetType: string
  targetId: string
  reason: string
  note: string | null
  status: string
  reviewedById: string | null
  reviewedAt: Date | string | null
  adminNote?: string | null
  createdAt: string | Date
  reporter: {
    id: string
    username: string
    avatarUrl: string | null
  }
  reviewer: {
    id: string
    username: string
  } | null
  targetContent: any
}

interface ModerationPanelProps {
  initialReports: Report[]
  initialStats: {
    open: number
    reviewed: number
    resolved: number
    total: number
  }
  initialFilters: {
    status?: string
    targetType?: string
    page: number
    totalPages: number
  }
  highlightedReportId?: string
}

export function ModerationPanel({
  initialReports,
  initialStats,
  initialFilters,
  highlightedReportId,
}: ModerationPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [reports, setReports] = useState(initialReports)
  const [stats, setStats] = useState(initialStats)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string | null>(highlightedReportId || null)
  const [actionReason, setActionReason] = useState('')
  const [banUntil, setBanUntil] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolveAction, setResolveAction] = useState<'APPROVED' | 'REJECTED' | null>(null)

  const status = searchParams.get('status') || initialFilters.status || 'OPEN'
  const targetType = searchParams.get('targetType') || initialFilters.targetType || ''

  const handleFilterChange = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    router.push(`/admin/moderation?${params.toString()}`)
  }

  const handleModerationAction = async (
    action: string,
    targetType: string,
    targetId: string,
    reason?: string
  ) => {
    setIsLoading(true)
    try {
      const payload: any = {
        action,
        targetType,
        targetId,
      }

      if (reason) {
        payload.reason = reason
      }

      if (action === 'ban_user' && banUntil) {
        payload.bannedUntil = banUntil
      }

      const response = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'İşlem başarısız')
      }

      toast({
        title: 'Başarılı',
        description: 'İşlem tamamlandı',
      })

      // Refresh reports
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setActionReason('')
      setBanUntil('')
      setSelectedReport(null)
    }
  }

  const handleResolveReport = async () => {
    if (!selectedReport || !resolveAction) return

    if (adminNote.trim().length > 500) {
      toast({
        title: 'Hata',
        description: 'Admin notu en fazla 500 karakter olabilir',
        variant: 'destructive',
      })
      return
    }

    setIsResolving(true)
    try {
      const response = await fetch(`/api/admin/reports/${selectedReport}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolveAction,
          adminNote: adminNote.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'İşlem başarısız')
      }

      toast({
        title: 'Başarılı',
        description: resolveAction === 'APPROVED' ? 'Rapor onaylandı' : 'Rapor reddedildi',
      })

      setResolveDialogOpen(false)
      setAdminNote('')
      setResolveAction(null)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsResolving(false)
    }
  }

  const openResolveDialog = (action: 'APPROVED' | 'REJECTED') => {
    setResolveAction(action)
    setResolveDialogOpen(true)
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      SPAM: 'Spam',
      HARASSMENT: 'Taciz',
      INAPPROPRIATE_CONTENT: 'Uygunsuz İçerik',
      COPYRIGHT_VIOLATION: 'Telif Hakkı İhlali',
      SCAM: 'Dolandırıcılık',
      OTHER: 'Diğer',
    }
    return labels[reason] || reason
  }

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'POST':
        return <FileText className="h-4 w-4" />
      case 'COMMENT':
        return <MessageSquare className="h-4 w-4" />
      case 'LISTING':
        return <ShoppingBag className="h-4 w-4" />
      case 'PROFILE':
        return <User className="h-4 w-4" />
      default:
        return <Flag className="h-4 w-4" />
    }
  }

  const selectedReportData = reports.find((r) => r.id === selectedReport)

  // Clear admin note when report selection changes
  useEffect(() => {
    setAdminNote('')
    setResolveDialogOpen(false)
    setResolveAction(null)
  }, [selectedReport])

  return (
    <div className="container py-6 md:py-10 px-4 md:px-6 w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Moderasyon Paneli</h1>
        <p className="text-muted-foreground">Raporları inceleyin ve moderasyon işlemleri yapın</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Açık Raporlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">İncelenen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.reviewed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Çözülen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Durum</Label>
              <Select value={status || 'all'} onValueChange={(v) => handleFilterChange('status', v === 'all' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="OPEN">Açık</SelectItem>
                  <SelectItem value="REVIEWED">İncelenen</SelectItem>
                  <SelectItem value="RESOLVED">Çözülen</SelectItem>
                  <SelectItem value="DISMISSED">Reddedilen</SelectItem>
                  <SelectItem value="APPROVED">Onaylanan</SelectItem>
                  <SelectItem value="REJECTED">Reddedilen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>İçerik Tipi</Label>
              <Select value={targetType || 'all'} onValueChange={(v) => handleFilterChange('targetType', v === 'all' ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="POST">Konu</SelectItem>
                  <SelectItem value="COMMENT">Yorum</SelectItem>
                  <SelectItem value="LISTING">İlan</SelectItem>
                  <SelectItem value="PROFILE">Profil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-1 space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Rapor bulunamadı
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card
                key={report.id}
                className={`cursor-pointer transition-colors ${
                  selectedReport === report.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                } ${highlightedReportId === report.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTargetIcon(report.targetType)}
                      <Badge variant="outline" className="text-xs">
                        {report.targetType}
                      </Badge>
                      <Badge
                        variant={
                          report.status === 'OPEN'
                            ? 'default'
                            : report.status === 'RESOLVED' || report.status === 'APPROVED'
                            ? 'secondary'
                            : report.status === 'REJECTED' || report.status === 'DISMISSED'
                            ? 'destructive'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {report.status === 'OPEN' && 'Açık'}
                        {report.status === 'REVIEWED' && 'İncelenen'}
                        {report.status === 'RESOLVED' && 'Çözülen'}
                        {report.status === 'DISMISSED' && 'Reddedilen'}
                        {report.status === 'APPROVED' && 'Onaylanan'}
                        {report.status === 'REJECTED' && 'Reddedilen'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm font-medium mb-1 line-clamp-1">
                    {report.targetContent?.title ||
                      report.targetContent?.content?.substring(0, 50) ||
                      report.targetContent?.username ||
                      'İçerik'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {getReasonLabel(report.reason)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>@{report.reporter.username}</span>
                    <span>{formatRelativeTime(report.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Pagination */}
          {initialFilters.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: initialFilters.totalPages }, (_, i) => i + 1).map((pageNum) => {
                const params = new URLSearchParams(searchParams.toString())
                params.set('page', String(pageNum))
                return (
                  <Link key={pageNum} href={`/admin/moderation?${params.toString()}`}>
                    <Button
                      variant={pageNum === initialFilters.page ? 'default' : 'outline'}
                      size="sm"
                    >
                      {pageNum}
                    </Button>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Report Detail & Actions */}
        <div className="lg:col-span-2">
          {selectedReportData ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getTargetIcon(selectedReportData.targetType)}
                      Rapor Detayı
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {formatRelativeTime(selectedReportData.createdAt)} • @
                      {selectedReportData.reporter.username} tarafından bildirildi
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{getReasonLabel(selectedReportData.reason)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Target Content Preview */}
                <div>
                  <h3 className="font-semibold mb-3">Raporlanan İçerik</h3>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      {selectedReportData.targetType === 'POST' && selectedReportData.targetContent && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              href={`/profile/${selectedReportData.targetContent.author.username}`}
                              className="font-medium hover:text-primary"
                            >
                              @{selectedReportData.targetContent.author.username}
                            </Link>
                            {selectedReportData.targetContent.deletedAt && (
                              <Badge variant="destructive" className="text-xs">
                                Silinmiş
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold mb-2">{selectedReportData.targetContent.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-4">
                            {selectedReportData.targetContent.content}
                          </p>
                          <Link
                            href={`/forum/topic/${selectedReportData.targetId}`}
                            className="text-xs text-primary hover:underline mt-2 inline-block"
                          >
                            Konuya git →
                          </Link>
                        </div>
                      )}

                      {selectedReportData.targetType === 'COMMENT' &&
                        selectedReportData.targetContent && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Link
                                href={`/profile/${selectedReportData.targetContent.author.username}`}
                                className="font-medium hover:text-primary"
                              >
                                @{selectedReportData.targetContent.author.username}
                              </Link>
                              {selectedReportData.targetContent.deletedAt && (
                                <Badge variant="destructive" className="text-xs">
                                  Silinmiş
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm mb-2">{selectedReportData.targetContent.content}</p>
                            {selectedReportData.targetContent.post && (
                              <p className="text-xs text-muted-foreground mb-2">
                                Konu: {selectedReportData.targetContent.post.title}
                              </p>
                            )}
                            <Link
                              href={`/forum/topic/${selectedReportData.targetContent.post?.id}#comment-${selectedReportData.targetId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              Yoruma git →
                            </Link>
                          </div>
                        )}

                      {selectedReportData.targetType === 'LISTING' &&
                        selectedReportData.targetContent && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Link
                                href={`/profile/${selectedReportData.targetContent.seller.username}`}
                                className="font-medium hover:text-primary"
                              >
                                @{selectedReportData.targetContent.seller.username}
                              </Link>
                              {selectedReportData.targetContent.deletedAt && (
                                <Badge variant="destructive" className="text-xs">
                                  Silinmiş
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold mb-2">{selectedReportData.targetContent.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                              {selectedReportData.targetContent.description}
                            </p>
                            <p className="text-sm font-semibold mb-2">
                              {selectedReportData.targetContent.price.toLocaleString('tr-TR')} ₺
                            </p>
                            <Link
                              href={`/marketplace/${selectedReportData.targetId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              İlana git →
                            </Link>
                          </div>
                        )}

                      {selectedReportData.targetType === 'PROFILE' &&
                        selectedReportData.targetContent && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">
                                @{selectedReportData.targetContent.username}
                              </span>
                              {selectedReportData.targetContent.isBanned && (
                                <Badge variant="destructive" className="text-xs">
                                  Yasaklı
                                </Badge>
                              )}
                            </div>
                            {selectedReportData.targetContent.bio && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {selectedReportData.targetContent.bio}
                              </p>
                            )}
                            <Link
                              href={`/profile/${selectedReportData.targetContent.username}`}
                              className="text-xs text-primary hover:underline"
                            >
                              Profile git →
                            </Link>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </div>

                {/* Report Note */}
                {selectedReportData.note && (
                  <div>
                    <h3 className="font-semibold mb-2">Rapor Notu</h3>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {selectedReportData.note}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Moderasyon İşlemleri</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Delete/Restore Content */}
                    {selectedReportData.targetType !== 'PROFILE' && (
                      <>
                        {!selectedReportData.targetContent?.deletedAt ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="w-full" disabled={isLoading}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                İçeriği Sil
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>İçeriği Sil</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu içeriği silmek istediğinize emin misiniz? Bu işlem geri alınabilir.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="space-y-3 py-4">
                                <Label>Sebep (Opsiyonel)</Label>
                                <Textarea
                                  value={actionReason}
                                  onChange={(e) => setActionReason(e.target.value)}
                                  placeholder="Silme sebebi..."
                                  rows={3}
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    const action =
                                      selectedReportData.targetType === 'POST'
                                        ? 'delete_post'
                                        : selectedReportData.targetType === 'COMMENT'
                                        ? 'delete_comment'
                                        : 'delete_listing'
                                    handleModerationAction(
                                      action,
                                      selectedReportData.targetType.toLowerCase(),
                                      selectedReportData.targetId,
                                      actionReason || undefined
                                    )
                                  }}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const action =
                                selectedReportData.targetType === 'POST'
                                  ? 'restore_post'
                                  : selectedReportData.targetType === 'COMMENT'
                                  ? 'restore_comment'
                                  : 'restore_listing'
                              handleModerationAction(
                                action,
                                selectedReportData.targetType.toLowerCase(),
                                selectedReportData.targetId
                              )
                            }}
                            disabled={isLoading}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            İçeriği Geri Yükle
                          </Button>
                        )}
                      </>
                    )}

                    {/* User Actions */}
                    {selectedReportData.targetType === 'PROFILE' && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full" disabled={isLoading}>
                              <Shield className="h-4 w-4 mr-2" />
                              Uyarı Ver
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kullanıcıyı Uyar</AlertDialogTitle>
                              <AlertDialogDescription>
                                Kullanıcıya uyarı mesajı gönderilecek.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-3 py-4">
                              <Label>Uyarı Sebebi *</Label>
                              <Textarea
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                                placeholder="Uyarı sebebi..."
                                rows={3}
                                required
                              />
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  handleModerationAction(
                                    'warn_user',
                                    'user',
                                    selectedReportData.targetId,
                                    actionReason
                                  )
                                }}
                                disabled={!actionReason.trim()}
                              >
                                Uyarı Ver
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {!selectedReportData.targetContent?.isBanned ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="w-full" disabled={isLoading}>
                                <Ban className="h-4 w-4 mr-2" />
                                Yasakla
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Kullanıcıyı Yasakla</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Kullanıcıyı geçici veya kalıcı olarak yasaklayabilirsiniz.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="space-y-3 py-4">
                                <Label>Yasaklama Sebebi *</Label>
                                <Textarea
                                  value={actionReason}
                                  onChange={(e) => setActionReason(e.target.value)}
                                  placeholder="Yasaklama sebebi..."
                                  rows={3}
                                  required
                                />
                                <Label>Yasaklama Bitiş Tarihi (Opsiyonel - Boş bırakılırsa kalıcı)</Label>
                                <Input
                                  type="datetime-local"
                                  value={banUntil}
                                  onChange={(e) => setBanUntil(e.target.value)}
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    handleModerationAction(
                                      'ban_user',
                                      'user',
                                      selectedReportData.targetId,
                                      actionReason
                                    )
                                  }}
                                  disabled={!actionReason.trim()}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Yasakla
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              handleModerationAction('unban_user', 'user', selectedReportData.targetId)
                            }}
                            disabled={isLoading}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Yasağı Kaldır
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Report Actions */}
                  {selectedReportData.status !== 'APPROVED' && selectedReportData.status !== 'REJECTED' && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label htmlFor="adminNote">Admin Geri Bildirimi (Opsiyonel)</Label>
                        <Textarea
                          id="adminNote"
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Raporu onayladığınızda veya reddettiğinizde kullanıcıya gösterilecek geri bildirim mesajı..."
                          rows={4}
                          maxLength={500}
                          disabled={isResolving}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {adminNote.length}/500 karakter
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="default"
                          className="flex-1"
                          onClick={() => openResolveDialog('APPROVED')}
                          disabled={isResolving}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Raporu Onayla
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => openResolveDialog('REJECTED')}
                          disabled={isResolving}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Raporu Reddet
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show admin note if report is already resolved */}
                  {selectedReportData.status === 'APPROVED' || selectedReportData.status === 'REJECTED' ? (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedReportData.status === 'APPROVED' ? 'default' : 'destructive'}>
                          {selectedReportData.status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}
                        </Badge>
                        {selectedReportData.reviewer && (
                          <span className="text-xs text-muted-foreground">
                            @{selectedReportData.reviewer.username} tarafından
                          </span>
                        )}
                        {selectedReportData.reviewedAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(selectedReportData.reviewedAt)}
                          </span>
                        )}
                      </div>
                      {selectedReportData.adminNote && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm font-medium mb-1">Admin Geri Bildirimi:</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedReportData.adminNote}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Bir rapor seçin</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Resolve Report Confirmation Dialog */}
      <AlertDialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resolveAction === 'APPROVED' ? 'Raporu Onayla' : 'Raporu Reddet'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resolveAction === 'APPROVED'
                ? 'Bu raporu onaylamak istediğinize emin misiniz? Kullanıcıya bildirim gönderilecektir.'
                : 'Bu raporu reddetmek istediğinize emin misiniz? Kullanıcıya bildirim gönderilecektir.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {adminNote && (
            <div className="py-4">
              <p className="text-sm font-medium mb-2">Geri Bildirim Mesajı:</p>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                {adminNote}
              </p>
            </div>
          )}
          {!adminNote && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Ek bir geri bildirim belirtilmedi.
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResolving}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolveReport}
              disabled={isResolving}
              className={resolveAction === 'REJECTED' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {isResolving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                resolveAction === 'APPROVED' ? 'Onayla' : 'Reddet'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ModerationPanel
export { ModerationPanel }

