import { prisma } from '@/lib/db'
import { WalletService } from './wallet.service'
import { DisputeStatus, DisputeResolution } from '@prisma/client'

export class DisputeService {
  /**
   * Open dispute
   */
  static async openDispute(
    orderId: string,
    openedById: string,
    reason: string,
    note?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Verify order
      const order = await tx.marketplaceOrder.findUnique({
        where: { id: orderId },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })

      if (!order) {
        throw new Error('Sipariş bulunamadı')
      }

      if (order.buyerId !== openedById) {
        throw new Error('Sadece alıcı itiraz açabilir')
      }

      if (order.status !== 'PENDING_DELIVERY') {
        throw new Error('Bu sipariş için itiraz açılamaz')
      }

      // Check if dispute already exists
      const existing = await tx.dispute.findUnique({
        where: { orderId },
      })

      if (existing) {
        throw new Error('Bu sipariş için zaten bir itiraz var')
      }

      // Create dispute
      const dispute = await tx.dispute.create({
        data: {
          orderId,
          openedById,
          reason,
          note: note || null,
          status: 'OPEN',
        },
      })

      // Update order status
      await tx.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: 'DISPUTED',
          disputedAt: new Date(),
        },
      })

      // Notify admins
      const { NotificationService } = await import('./notification.service')
      const admins = await tx.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'MODERATOR'],
          },
        },
        select: { id: true },
      })

      await Promise.all(
        admins.map((admin) =>
          NotificationService.createNotification({
            type: 'system_announcement',
            userId: admin.id,
            actorId: openedById,
            targetType: undefined,
            targetId: dispute.id,
            url: `/admin/disputes/${dispute.id}`,
            title: 'Yeni İtiraz',
            content: `"${order.listing.title}" siparişi için itiraz açıldı.`,
          })
        )
      )

      return dispute
    })
  }

  /**
   * Resolve dispute
   */
  static async resolveDispute(
    disputeId: string,
    resolvedById: string,
    resolution: DisputeResolution,
    meta?: any
  ) {
    return prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: {
          order: {
            include: {
              listing: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      })

      if (!dispute) {
        throw new Error('İtiraz bulunamadı')
      }

      if (dispute.status !== 'OPEN') {
        throw new Error('Bu itiraz zaten çözülmüş')
      }

      const order = dispute.order

      // Process resolution
      if (resolution === 'REFUND_BUYER') {
        // Refund buyer
        await WalletService.refund(
          order.buyerId,
          order.amount,
          order.id,
          { disputeId, resolution }
        )

        // Update order
        await tx.marketplaceOrder.update({
          where: { id: order.id },
          data: {
            status: 'REFUNDED',
          },
        })
      } else if (resolution === 'RELEASE_SELLER') {
        // Release to seller
        await WalletService.release(
          order.buyerId,
          order.sellerId,
          order.amount,
          order.id,
          { disputeId, resolution }
        )

        // Update order
        await tx.marketplaceOrder.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        })
      } else if (resolution === 'PARTIAL') {
        // Partial resolution - split amounts
        const buyerAmount = meta?.buyerAmount || Math.floor(order.amount / 2)
        const sellerAmount = order.amount - buyerAmount

        if (buyerAmount > 0) {
          await WalletService.refund(
            order.buyerId,
            buyerAmount,
            order.id,
            { disputeId, resolution, partial: true }
          )
        }

        if (sellerAmount > 0) {
          await WalletService.release(
            order.buyerId,
            order.sellerId,
            sellerAmount,
            order.id,
            { disputeId, resolution, partial: true }
          )
        }

        // Update order
        await tx.marketplaceOrder.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        })
      }

      // Update dispute
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolvedById,
          resolution,
          resolvedAt: new Date(),
          meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
        },
      })

      // Lock conversation
      await tx.tradeConversation.update({
        where: { orderId: order.id },
        data: {
          isLocked: true,
          lockedAt: new Date(),
        },
      })

      // Notify both parties
      const { NotificationService } = await import('./notification.service')
      await Promise.all([
        NotificationService.createNotification({
          type: 'admin_warning',
          userId: order.buyerId,
          actorId: resolvedById,
          targetType: undefined,
          targetId: disputeId,
          url: `/marketplace/orders/${order.id}`,
          title: 'İtiraz Çözüldü',
          content: `"${order.listing.title}" siparişi için itirazınız çözüldü.`,
        }),
        NotificationService.createNotification({
          type: 'admin_warning',
          userId: order.sellerId,
          actorId: resolvedById,
          targetType: undefined,
          targetId: disputeId,
          url: `/marketplace/orders/${order.id}`,
          title: 'İtiraz Çözüldü',
          content: `"${order.listing.title}" siparişi için itiraz çözüldü.`,
        }),
      ])

      return updated
    })
  }

  /**
   * Get dispute by ID
   */
  static async getDisputeById(disputeId: string) {
    return prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
            buyer: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            seller: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        opener: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })
  }

  /**
   * Get all disputes
   */
  static async getDisputes(filters?: {
    status?: DisputeStatus
    page?: number
    limit?: number
  }) {
    const page = filters?.page || 1
    const limit = Math.min(50, filters?.limit || 20)
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters?.status) where.status = filters.status

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              listing: {
                select: {
                  id: true,
                  title: true,
                },
              },
              buyer: {
                select: {
                  id: true,
                  username: true,
                },
              },
              seller: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          opener: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.dispute.count({ where }),
    ])

    return {
      disputes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}

