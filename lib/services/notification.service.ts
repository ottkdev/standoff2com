import { prisma } from '@/lib/db'

export type NotificationType =
  | 'follow'
  | 'forum_reply'
  | 'comment_reply'
  | 'marketplace_approval'
  | 'marketplace_rejection'
  | 'marketplace_sold'
  | 'admin_warning'
  | 'admin_ban'
  | 'system_announcement'

export type NotificationTargetType = 'post' | 'comment' | 'listing' | 'user' | 'system'

interface CreateNotificationParams {
  type: NotificationType
  userId: string
  actorId?: string | null
  targetType?: NotificationTargetType
  targetId?: string | null
  url?: string | null
  title: string
  content: string
}

interface NotificationContext {
  actorUsername?: string
  postTitle?: string
  commentPreview?: string
  listingTitle?: string
  reason?: string
}

/**
 * Centralized notification creation service
 * Handles all notification types with smart content generation
 */
export class NotificationService {
  /**
   * Check if user is blocked by recipient
   */
  private static async isBlocked(actorId: string, recipientId: string): Promise<boolean> {
    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: recipientId,
          blockedId: actorId,
        },
      },
    })
    return !!block
  }

  /**
   * Create a notification with security checks
   */
  static async createNotification(params: CreateNotificationParams): Promise<void> {
    try {
      // Security: Don't create notification if actor is blocked by recipient
      if (params.actorId) {
        const isBlocked = await this.isBlocked(params.actorId, params.userId)
        if (isBlocked) {
          return // Silently skip if blocked
        }
      }

      // Don't notify self
      if (params.actorId === params.userId) {
        return
      }

      await prisma.notification.create({
        data: {
          type: params.type,
          userId: params.userId,
          actorId: params.actorId || null,
          targetType: params.targetType || null,
          targetId: params.targetId || null,
          url: params.url || null,
          title: params.title,
          content: params.content,
        },
      })
    } catch (error) {
      // Log error but don't throw - notifications are non-critical
      console.error('Error creating notification:', error)
    }
  }

  /**
   * Create follow notification
   */
  static async notifyFollow(followerId: string, followingId: string): Promise<void> {
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true },
    })

    if (!follower) return

    await this.createNotification({
      type: 'follow',
      userId: followingId,
      actorId: followerId,
      targetType: 'user',
      targetId: followerId,
      url: `/profile/${follower.username}`,
      title: 'Yeni Takipçi',
      content: `👤 ${follower.username} seni takip etmeye başladı`,
    })
  }

  /**
   * Create forum reply notification
   */
  static async notifyForumReply(
    postId: string,
    postAuthorId: string,
    commentAuthorId: string,
    commentId: string
  ): Promise<void> {
    const [post, commentAuthor] = await Promise.all([
      prisma.post.findUnique({
        where: { id: postId },
        select: { title: true },
      }),
      prisma.user.findUnique({
        where: { id: commentAuthorId },
        select: { username: true },
      }),
    ])

    if (!post || !commentAuthor) return

    const title = post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title

    await this.createNotification({
      type: 'forum_reply',
      userId: postAuthorId,
      actorId: commentAuthorId,
      targetType: 'post',
      targetId: postId,
      url: `/forum/topic/${postId}#comment-${commentId}`,
      title: 'Forum Konusuna Cevap',
      content: `💬 ${commentAuthor.username} "${title}" konusuna cevap yazdı`,
    })
  }

  /**
   * Create comment reply notification
   */
  static async notifyCommentReply(
    parentCommentId: string,
    parentCommentAuthorId: string,
    replyAuthorId: string,
    replyId: string,
    postId: string
  ): Promise<void> {
    const [parentComment, replyAuthor, post] = await Promise.all([
      prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: { content: true },
      }),
      prisma.user.findUnique({
        where: { id: replyAuthorId },
        select: { username: true },
      }),
      prisma.post.findUnique({
        where: { id: postId },
        select: { id: true },
      }),
    ])

    if (!parentComment || !replyAuthor || !post) return

    const commentPreview =
      parentComment.content.length > 30
        ? parentComment.content.substring(0, 30) + '...'
        : parentComment.content

    await this.createNotification({
      type: 'comment_reply',
      userId: parentCommentAuthorId,
      actorId: replyAuthorId,
      targetType: 'comment',
      targetId: replyId,
      url: `/forum/topic/${postId}#comment-${replyId}`,
      title: 'Yoruma Cevap',
      content: `💬 ${replyAuthor.username} "${commentPreview}" yorumuna cevap verdi`,
    })
  }

  /**
   * Create marketplace approval notification
   */
  static async notifyMarketplaceApproval(
    listingId: string,
    sellerId: string,
    listingTitle: string
  ): Promise<void> {
    const title = listingTitle.length > 40 ? listingTitle.substring(0, 40) + '...' : listingTitle

    await this.createNotification({
      type: 'marketplace_approval',
      userId: sellerId,
      actorId: null, // System action
      targetType: 'listing',
      targetId: listingId,
      url: `/marketplace/${listingId}`,
      title: 'İlan Onaylandı',
      content: `✅ "${title}" ilanın onaylandı ve yayında!`,
    })
  }

  /**
   * Create marketplace rejection notification
   */
  static async notifyMarketplaceRejection(
    listingId: string,
    sellerId: string,
    listingTitle: string,
    reason: string
  ): Promise<void> {
    const title = listingTitle.length > 40 ? listingTitle.substring(0, 40) + '...' : listingTitle

    await this.createNotification({
      type: 'marketplace_rejection',
      userId: sellerId,
      actorId: null, // System action
      targetType: 'listing',
      targetId: listingId,
      url: `/marketplace/${listingId}`,
      title: 'İlan Reddedildi',
      content: `❌ "${title}" ilanın reddedildi. Sebep: ${reason}`,
    })
  }

  /**
   * Create marketplace sold notification
   */
  static async notifyMarketplaceSold(
    listingId: string,
    sellerId: string,
    buyerId: string,
    listingTitle: string
  ): Promise<void> {
    const [buyer, title] = await Promise.all([
      prisma.user.findUnique({
        where: { id: buyerId },
        select: { username: true },
      }),
      Promise.resolve(
        listingTitle.length > 40 ? listingTitle.substring(0, 40) + '...' : listingTitle
      ),
    ])

    if (!buyer) return

    // Notify seller
    await this.createNotification({
      type: 'marketplace_sold',
      userId: sellerId,
      actorId: buyerId,
      targetType: 'listing',
      targetId: listingId,
      url: `/marketplace/${listingId}`,
      title: 'İlan Satıldı',
      content: `💰 "${title}" ilanın ${buyer.username} tarafından satın alındı`,
    })
  }

  /**
   * Create admin warning notification
   */
  static async notifyAdminWarning(
    userId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { username: true },
    })

    if (!admin) return

    await this.createNotification({
      type: 'admin_warning',
      userId,
      actorId: adminId,
      targetType: 'user',
      targetId: userId,
      url: `/profile/${userId}`,
      title: 'Uyarı',
      content: `⚠️ ${admin.username} tarafından uyarıldınız. Sebep: ${reason}`,
    })
  }

  /**
   * Create admin ban notification
   */
  static async notifyAdminBan(
    userId: string,
    adminId: string,
    reason: string,
    bannedUntil?: Date | null
  ): Promise<void> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { username: true },
    })

    if (!admin) return

    const untilText = bannedUntil
      ? ` ${new Date(bannedUntil).toLocaleDateString('tr-TR')} tarihine kadar`
      : ''

    await this.createNotification({
      type: 'admin_ban',
      userId,
      actorId: adminId,
      targetType: 'user',
      targetId: userId,
      url: `/profile/${userId}`,
      title: 'Hesap Yasaklandı',
      content: `🚫 ${admin.username} tarafından yasaklandınız${untilText}. Sebep: ${reason}`,
    })
  }

  /**
   * Create system announcement notification
   */
  static async notifySystemAnnouncement(
    userId: string | null,
    title: string,
    content: string,
    url?: string
  ): Promise<void> {
    await this.createNotification({
      type: 'system_announcement',
      userId: userId || '', // Will be handled specially for broadcast
      actorId: null,
      targetType: 'system',
      targetId: null,
      url: url || null,
      title,
      content,
    })
  }

  /**
   * Broadcast system announcement to all users
   */
  static async broadcastSystemAnnouncement(
    title: string,
    content: string,
    url?: string
  ): Promise<void> {
    const users = await prisma.user.findMany({
      select: { id: true },
    })

    // Create notifications for all users
    await Promise.all(
      users.map((user) =>
        this.createNotification({
          type: 'system_announcement',
          userId: user.id,
          actorId: null,
          targetType: 'system',
          targetId: null,
          url: url || null,
          title,
          content,
        })
      )
    )
  }
}

