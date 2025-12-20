import { prisma } from '@/lib/db'
import { WalletService } from './wallet.service'
import { OrderStatus } from '@prisma/client'

export class OrderService {
  /**
   * Create escrow order
   */
  static async createOrder(
    listingId: string,
    buyerId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Get listing with seller
      const listing = await tx.marketplaceListing.findFirst({
        where: {
          id: listingId,
          deletedAt: null,
          status: 'ACTIVE',
        },
        include: {
          seller: {
            select: {
              id: true,
            },
          },
        },
      })

      if (!listing) {
        throw new Error('İlan bulunamadı veya satışa kapalı')
      }

      if (listing.sellerId === buyerId) {
        throw new Error('Kendi ilanınızı satın alamazsınız')
      }

      // Check if already has active order
      const existingOrder = await tx.marketplaceOrder.findUnique({
        where: { listingId },
      })

      if (existingOrder && existingOrder.status === 'PENDING_DELIVERY') {
        throw new Error('Bu ilan için zaten aktif bir sipariş var')
      }

      // Check buyer wallet
      const buyerWallet = await WalletService.getWallet(buyerId)
      const amountKurus = Math.round(listing.price * 100)

      if (buyerWallet.balanceAvailable < amountKurus) {
        throw new Error('Yetersiz bakiye')
      }

      // Hold funds
      await WalletService.hold(
        buyerId,
        amountKurus,
        'HOLD',
        listingId,
        { listingId, listingTitle: listing.title }
      )

      // Create order
      const autoReleaseAt = new Date()
      autoReleaseAt.setHours(autoReleaseAt.getHours() + 72) // 72 hours

      const order = await tx.marketplaceOrder.create({
        data: {
          listingId,
          buyerId,
          sellerId: listing.sellerId,
          amount: amountKurus,
          status: 'PENDING_DELIVERY',
          autoReleaseAt,
        },
      })

      // Mark listing as SOLD
      await tx.marketplaceListing.update({
        where: { id: listingId },
        data: {
          status: 'SOLD',
        },
      })

      // Create trade conversation
      await tx.tradeConversation.create({
        data: {
          orderId: order.id,
          buyerId,
          sellerId: listing.sellerId,
          isLocked: false,
        },
      })

      // Notify seller
      const { NotificationService } = await import('./notification.service')
      await NotificationService.createNotification({
        type: 'marketplace_sold',
        userId: listing.sellerId,
        actorId: buyerId,
        targetType: 'listing',
        targetId: listingId,
        url: `/marketplace/orders/${order.id}`,
        title: 'İlanınız Satıldı',
        content: `"${listing.title}" ilanınız satıldı. Sipariş detaylarını görüntüleyin.`,
      })

      return order
    })
  }

  /**
   * Confirm delivery (buyer confirms receipt)
   */
  static async confirmDelivery(orderId: string, buyerId: string) {
    return prisma.$transaction(async (tx) => {
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

      if (order.buyerId !== buyerId) {
        throw new Error('Bu siparişi onaylama yetkiniz yok')
      }

      if (order.status !== 'PENDING_DELIVERY') {
        throw new Error('Bu sipariş teslimat onayı beklenmiyor')
      }

      // Release funds to seller
      await WalletService.release(
        order.buyerId,
        order.sellerId,
        order.amount,
        orderId,
        { orderId, listingTitle: order.listing.title }
      )

      // Update order
      const updated = await tx.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      // Lock conversation
      await tx.tradeConversation.update({
        where: { orderId },
        data: {
          isLocked: true,
          lockedAt: new Date(),
        },
      })

      // Notify seller
      const { NotificationService } = await import('./notification.service')
      await NotificationService.createNotification({
        type: 'marketplace_sold',
        userId: order.sellerId,
        actorId: buyerId,
        targetType: undefined,
        targetId: orderId,
        url: `/marketplace/orders/${orderId}`,
        title: 'Teslimat Onaylandı',
        content: `"${order.listing.title}" siparişi için teslimat onaylandı. Ödeme hesabınıza aktarıldı.`,
      })

      return updated
    })
  }

  /**
   * Auto-release order (called by cron or on page load)
   */
  static async autoReleaseOrder(orderId: string) {
    return prisma.$transaction(async (tx) => {
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

      if (order.status !== 'PENDING_DELIVERY') {
        return null // Already processed
      }

      if (!order.autoReleaseAt || order.autoReleaseAt > new Date()) {
        return null // Not yet time for auto-release
      }

      // Check if dispute exists
      const dispute = await tx.dispute.findUnique({
        where: { orderId },
      })

      if (dispute && dispute.status === 'OPEN') {
        return null // Dispute exists, don't auto-release
      }

      // Release funds to seller
      await WalletService.release(
        order.buyerId,
        order.sellerId,
        order.amount,
        orderId,
        { orderId, listingTitle: order.listing.title, autoRelease: true }
      )

      // Update order
      const updated = await tx.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      // Lock conversation
      await tx.tradeConversation.update({
        where: { orderId },
        data: {
          isLocked: true,
          lockedAt: new Date(),
        },
      })

      // Notify both parties
      const { NotificationService } = await import('./notification.service')
      await Promise.all([
        NotificationService.createNotification({
          type: 'marketplace_sold',
          userId: order.sellerId,
          actorId: null,
          targetType: undefined,
          targetId: orderId,
          url: `/marketplace/orders/${orderId}`,
          title: 'Otomatik Ödeme',
          content: `"${order.listing.title}" siparişi için 72 saat geçti ve ödeme otomatik olarak hesabınıza aktarıldı.`,
        }),
        NotificationService.createNotification({
          type: 'system_announcement',
          userId: order.buyerId,
          actorId: null,
          targetType: undefined,
          targetId: orderId,
          url: `/marketplace/orders/${orderId}`,
          title: 'Otomatik Ödeme',
          content: `"${order.listing.title}" siparişi için 72 saat geçti ve ödeme satıcıya otomatik olarak aktarıldı.`,
        }),
      ])

      return updated
    })
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string, userId?: string): Promise<any> {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id: orderId },
      include: {
        listing: {
          include: {
            images: {
              orderBy: { order: 'asc' },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        dispute: true,
        rating: true,
        conversation: {
          include: {
            messages: {
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!order) {
      return null
    }

    // Check access
    if (userId && order.buyerId !== userId && order.sellerId !== userId) {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })
      if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
        return null
      }
    }

    // Auto-release check
    if (order.status === 'PENDING_DELIVERY' && order.autoReleaseAt && order.autoReleaseAt <= new Date()) {
      await this.autoReleaseOrder(orderId)
      // Refetch order
      return this.getOrderById(orderId, userId)
    }

    return order
  }

  /**
   * Get user orders
   */
  static async getUserOrders(
    userId: string,
    filters?: {
      role?: 'buyer' | 'seller' | 'all'
      status?: OrderStatus
      page?: number
      limit?: number
    }
  ) {
    const page = filters?.page || 1
    const limit = Math.min(50, filters?.limit || 20)
    const skip = (page - 1) * limit

    const where: any = {}
    if (filters?.role === 'buyer') {
      where.buyerId = userId
    } else if (filters?.role === 'seller') {
      where.sellerId = userId
    } else {
      where.OR = [{ buyerId: userId }, { sellerId: userId }]
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const [orders, total] = await Promise.all([
      prisma.marketplaceOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: {
              images: {
                orderBy: { order: 'asc' },
                take: 1,
              },
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
      }),
      prisma.marketplaceOrder.count({ where }),
    ])

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}

