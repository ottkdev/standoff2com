import { prisma } from '@/lib/db'
import { ReportTargetType, ReportReason, ReportStatus } from '@prisma/client'

export class ReportService {
  /**
   * Create a report
   */
  static async createReport(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    note?: string
  ) {
    // Check if user already reported this
    const existing = await prisma.report.findFirst({
      where: {
        reporterId,
        targetType,
        targetId,
        status: {
          in: ['OPEN', 'REVIEWED'],
        },
      },
    })

    if (existing) {
      throw new Error('Bu içeriği zaten bildirdiniz')
    }

    // Verify target exists
    await this.verifyTargetExists(targetType, targetId)

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType,
        targetId,
        reason,
        note: note || null,
        status: 'OPEN',
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    // Check if multiple reports exist - auto-flag if >= 3
    const reportCount = await prisma.report.count({
      where: {
        targetType,
        targetId,
        status: 'OPEN',
      },
    })

    if (reportCount >= 3) {
      // Auto-flag: Notify admins
      const { NotificationService } = await import('./notification.service')
      const admins = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'MODERATOR'],
          },
        },
        select: { id: true },
      })

      const targetName = await this.getTargetName(targetType, targetId)

      await Promise.all(
        admins.map((admin) =>
          NotificationService.createNotification({
            type: 'system_announcement',
            userId: admin.id,
            actorId: null,
            targetType: 'system',
            targetId: null,
            url: `/admin/moderation?report=${report.id}`,
            title: 'Çoklu Rapor',
            content: `⚠️ "${targetName}" içeriği ${reportCount} kez rapor edildi ve inceleme gerektiriyor`,
          })
        )
      )
    }

    return report
  }

  /**
   * Verify target exists
   */
  private static async verifyTargetExists(
    targetType: ReportTargetType,
    targetId: string
  ): Promise<void> {
    switch (targetType) {
      case 'POST':
        const post = await prisma.post.findUnique({
          where: { id: targetId },
          select: { id: true, deletedAt: true },
        })
        if (!post || post.deletedAt) {
          throw new Error('Konu bulunamadı veya silinmiş')
        }
        break
      case 'COMMENT':
        const comment = await prisma.comment.findUnique({
          where: { id: targetId },
          select: { id: true, deletedAt: true },
        })
        if (!comment || comment.deletedAt) {
          throw new Error('Yorum bulunamadı veya silinmiş')
        }
        break
      case 'LISTING':
        const listing = await prisma.marketplaceListing.findFirst({
          where: {
            id: targetId,
            deletedAt: null,
          },
          select: { id: true },
        })
        if (!listing) {
          throw new Error('İlan bulunamadı veya silinmiş')
        }
        break
      case 'PROFILE':
        const user = await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true },
        })
        if (!user) {
          throw new Error('Kullanıcı bulunamadı')
        }
        break
    }
  }

  /**
   * Get target name for notifications
   */
  private static async getTargetName(
    targetType: ReportTargetType,
    targetId: string
  ): Promise<string> {
    switch (targetType) {
      case 'POST':
        const post = await prisma.post.findUnique({
          where: { id: targetId },
          select: { title: true },
        })
        return post?.title || 'Konu'
      case 'COMMENT':
        const comment = await prisma.comment.findUnique({
          where: { id: targetId },
          select: { content: true },
        })
        return comment?.content.substring(0, 50) || 'Yorum'
      case 'LISTING':
        const listing = await prisma.marketplaceListing.findFirst({
          where: { id: targetId },
          select: { title: true },
        })
        return listing?.title || 'İlan'
      case 'PROFILE':
        const user = await prisma.user.findUnique({
          where: { id: targetId },
          select: { username: true },
        })
        return user?.username || 'Kullanıcı'
    }
  }

  /**
   * Get reports with filters
   */
  static async getReports(filters: {
    status?: ReportStatus
    targetType?: ReportTargetType
    page?: number
    limit?: number
  }) {
    const page = filters.page || 1
    const limit = Math.min(50, filters.limit || 20)
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters.status) where.status = filters.status
    if (filters.targetType) where.targetType = filters.targetType

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ])

    // Fetch target content for each report
    const reportsWithContent = await Promise.all(
      reports.map(async (report) => {
        const content = await this.getTargetContent(report.targetType, report.targetId)
        return {
          ...report,
          targetContent: content,
        }
      })
    )

    return {
      reports: reportsWithContent,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get target content for display
   */
  private static async getTargetContent(
    targetType: ReportTargetType,
    targetId: string
  ): Promise<any> {
    switch (targetType) {
      case 'POST':
        return prisma.post.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            title: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            createdAt: true,
            deletedAt: true,
          },
        })
      case 'COMMENT':
        return prisma.comment.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            post: {
              select: {
                id: true,
                title: true,
              },
            },
            createdAt: true,
            deletedAt: true,
          },
        })
      case 'LISTING':
        return prisma.marketplaceListing.findFirst({
          where: { id: targetId },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            seller: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            status: true,
            createdAt: true,
            deletedAt: true,
          },
        })
      case 'PROFILE':
        return prisma.user.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            createdAt: true,
            isBanned: true,
          },
        })
    }
  }

  /**
   * Update report status
   */
  static async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    reviewerId: string
  ) {
    return prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    })
  }
}

