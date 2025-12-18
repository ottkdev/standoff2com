import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export class UserService {
  static async getUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        badges: {
          include: {
            badge: true,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            comments: true,
            listings: true,
          },
        },
      },
    })
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        badges: {
          include: {
            badge: true,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            comments: true,
            listings: true,
          },
        },
      },
    })
  }

  static async updateUser(id: string, data: {
    displayName?: string
    bio?: string
    avatarUrl?: string
  }) {
    return prisma.user.update({
      where: { id },
      data,
    })
  }

  static async followUser(followerId: string, followingId: string) {
    // Verify both users exist
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { id: followerId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: followingId }, select: { id: true } }),
    ])

    if (!follower) {
      throw new Error('Takip eden kullanıcı bulunamadı')
    }

    if (!following) {
      throw new Error('Takip edilecek kullanıcı bulunamadı')
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })

    if (existing) {
      throw new Error('Zaten takip ediyorsunuz')
    }

    if (followerId === followingId) {
      throw new Error('Kendinizi takip edemezsiniz')
    }

    return prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    })
  }

  static async unfollowUser(followerId: string, followingId: string) {
    return prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })
  }

  static async isFollowing(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })
    return !!follow
  }

  static async addBadge(userId: string, badgeId: string) {
    return prisma.userBadge.create({
      data: {
        userId,
        badgeId,
      },
      include: {
        badge: true,
      },
    })
  }

  static async removeBadge(userId: string, badgeId: string) {
    return prisma.userBadge.delete({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
    })
  }

  static async banUser(userId: string, bannedUntil?: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        bannedUntil: bannedUntil || null,
      },
    })
  }

  static async unbanUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        bannedUntil: null,
      },
    })
  }

  static async updateRole(userId: string, role: UserRole) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    })
  }

  static async verifyUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    })
  }

  static async unverifyUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isVerified: false },
    })
  }
}

