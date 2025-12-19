import { prisma } from '@/lib/db'
import { AuditAction } from '@prisma/client'

export class ModerationService {
  /**
   * Log audit action
   */
  private static async logAudit(
    actorId: string,
    action: AuditAction,
    targetType: string | null,
    targetId: string | null,
    details?: string,
    request?: Request
  ) {
    let ipAddress: string | null = null
    let userAgent: string | null = null

    if (request) {
      ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        null
      userAgent = request.headers.get('user-agent') || null
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        details: details || null,
        ipAddress,
        userAgent,
      },
    })
  }

  /**
   * Soft delete post
   */
  static async deletePost(
    postId: string,
    adminId: string,
    reason?: string,
    request?: Request
  ) {
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: new Date(),
        deletedById: adminId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    await this.logAudit(
      adminId,
      AuditAction.DELETE_POST,
      'post',
      postId,
      JSON.stringify({ reason, postTitle: post.title }),
      request
    )

    // Notify user
    const { NotificationService } = await import('./notification.service')
    await NotificationService.createNotification({
      type: 'admin_warning',
      userId: post.authorId,
      actorId: adminId,
      targetType: 'post',
      targetId: postId,
      url: `/forum/topic/${postId}`,
      title: 'Konu Silindi',
      content: `🚫 "${post.title}" konunuz moderatör tarafından silindi.${reason ? ` Sebep: ${reason}` : ''}`,
    })

    return post
  }

  /**
   * Restore post
   */
  static async restorePost(postId: string, adminId: string, request?: Request) {
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        deletedAt: null,
        deletedById: null,
      },
      include: {
        author: {
          select: {
            id: true,
          },
        },
      },
    })

    await this.logAudit(
      adminId,
      AuditAction.RESTORE_POST,
      'post',
      postId,
      undefined,
      request
    )

    return post
  }

  /**
   * Soft delete comment
   */
  static async deleteComment(
    commentId: string,
    adminId: string,
    reason?: string,
    request?: Request
  ) {
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
        deletedById: adminId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    await this.logAudit(
      adminId,
      AuditAction.DELETE_COMMENT,
      'comment',
      commentId,
      JSON.stringify({ reason }),
      request
    )

    // Notify user
    const { NotificationService } = await import('./notification.service')
    await NotificationService.createNotification({
      type: 'admin_warning',
      userId: comment.authorId,
      actorId: adminId,
      targetType: 'comment',
      targetId: commentId,
      url: `/forum/topic/${comment.postId}#comment-${commentId}`,
      title: 'Yorum Silindi',
      content: `🚫 Yorumunuz moderatör tarafından silindi.${reason ? ` Sebep: ${reason}` : ''}`,
    })

    return comment
  }

  /**
   * Restore comment
   */
  static async restoreComment(
    commentId: string,
    adminId: string,
    request?: Request
  ) {
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        deletedAt: null,
        deletedById: null,
      },
    })

    await this.logAudit(
      adminId,
      AuditAction.RESTORE_COMMENT,
      'comment',
      commentId,
      undefined,
      request
    )

    return comment
  }

  /**
   * Soft delete listing
   */
  static async deleteListing(
    listingId: string,
    adminId: string,
    reason?: string,
    request?: Request
  ) {
    const listing = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        deletedAt: new Date(),
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    await this.logAudit(
      adminId,
      AuditAction.DELETE_LISTING,
      'listing',
      listingId,
      JSON.stringify({ reason, listingTitle: listing.title }),
      request
    )

    // Notify user
    const { NotificationService } = await import('./notification.service')
    await NotificationService.createNotification({
      type: 'admin_warning',
      userId: listing.sellerId,
      actorId: adminId,
      targetType: 'listing',
      targetId: listingId,
      url: `/marketplace/${listingId}`,
      title: 'İlan Silindi',
      content: `🚫 "${listing.title}" ilanınız moderatör tarafından silindi.${reason ? ` Sebep: ${reason}` : ''}`,
    })

    return listing
  }

  /**
   * Restore listing
   */
  static async restoreListing(
    listingId: string,
    adminId: string,
    request?: Request
  ) {
    const listing = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        deletedAt: null,
      },
    })

    await this.logAudit(
      adminId,
      AuditAction.RESTORE_LISTING,
      'listing',
      listingId,
      undefined,
      request
    )

    return listing
  }

  /**
   * Warn user
   */
  static async warnUser(
    userId: string,
    adminId: string,
    reason: string,
    request?: Request
  ) {
    await this.logAudit(
      adminId,
      AuditAction.WARN_USER,
      'user',
      userId,
      JSON.stringify({ reason }),
      request
    )

    // Notify user
    const { NotificationService } = await import('./notification.service')
    await NotificationService.notifyAdminWarning(userId, adminId, reason)

    return { success: true }
  }

  /**
   * Ban user (temporary or permanent)
   */
  static async banUser(
    userId: string,
    adminId: string,
    reason: string,
    bannedUntil?: Date | null,
    request?: Request
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedUntil: bannedUntil || null,
      },
    })

    const action = bannedUntil ? AuditAction.TEMP_BAN_USER : AuditAction.PERM_BAN_USER

    await this.logAudit(
      adminId,
      action,
      'user',
      userId,
      JSON.stringify({ reason, bannedUntil }),
      request
    )

    // Notify user
    const { NotificationService } = await import('./notification.service')
    await NotificationService.notifyAdminBan(userId, adminId, reason, bannedUntil)

    return user
  }

  /**
   * Unban user
   */
  static async unbanUser(userId: string, adminId: string, request?: Request) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedUntil: null,
      },
    })

    await this.logAudit(
      adminId,
      AuditAction.UNBAN_USER,
      'user',
      userId,
      undefined,
      request
    )

    return user
  }

  /**
   * Check if user is banned
   */
  static async isUserBanned(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isBanned: true,
        bannedUntil: true,
      },
    })

    if (!user) return false
    if (!user.isBanned) return false

    // Check if temporary ban expired
    if (user.bannedUntil && user.bannedUntil < new Date()) {
      // Auto-unban
      await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: false,
          bannedUntil: null,
        },
      })
      return false
    }

    return true
  }
}

