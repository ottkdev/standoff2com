import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReportService } from '@/lib/services/report.service'
import { ModerationPanel } from '@/components/admin/ModerationPanel'

interface PageProps {
  searchParams: {
    status?: string
    targetType?: string
    page?: string
    report?: string
  }
}

export default async function ModerationPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/')
  }

  const status = searchParams.status as any
  const targetType = searchParams.targetType as any
  const page = parseInt(searchParams.page || '1')
  const limit = 20

  const { reports, total, totalPages } = await ReportService.getReports({
    status,
    targetType,
    page,
    limit,
  })

  // Serialize dates for client component
  const serializedReports = reports.map((report) => ({
    ...report,
    createdAt: report.createdAt instanceof Date ? report.createdAt.toISOString() : report.createdAt,
    reviewedAt: report.reviewedAt instanceof Date ? report.reviewedAt.toISOString() : report.reviewedAt,
    adminNote: report.adminNote || null,
  }))

  // Get stats
  const [openCount, reviewedCount, resolvedCount] = await Promise.all([
    ReportService.getReports({ status: 'OPEN', limit: 1 }).then((r) => r.total),
    ReportService.getReports({ status: 'REVIEWED', limit: 1 }).then((r) => r.total),
    ReportService.getReports({ status: 'RESOLVED', limit: 1 }).then((r) => r.total),
  ])

  return (
    <ModerationPanel
      initialReports={serializedReports}
      initialStats={{
        open: openCount,
        reviewed: reviewedCount,
        resolved: resolvedCount,
        total,
      }}
      initialFilters={{
        status,
        targetType,
        page,
        totalPages,
      }}
      highlightedReportId={searchParams.report}
    />
  )
}

