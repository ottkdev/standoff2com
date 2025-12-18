import { Prisma } from '@prisma/client'

type PostWithDetailsBase = Prisma.PostGetPayload<{
  include: {
    author: {
      select: {
        id: true
        username: true
        avatarUrl: true
        isVerified: true
        displayName: true
        role: true
        postCount: true
        commentCount: true
        createdAt: true
      }
    }
    category: true
    images: {
      orderBy: { order: 'asc' }
    }
    comments: {
      include: {
        author: {
          select: {
            id: true
            username: true
            avatarUrl: true
            isVerified: true
            displayName: true
            role: true
            postCount: true
            commentCount: true
            createdAt: true
          }
        }
        replies: {
          include: {
            author: {
              select: {
                id: true
                username: true
                avatarUrl: true
                isVerified: true
                displayName: true
                role: true
                postCount: true
                commentCount: true
                createdAt: true
              }
            }
          }
        }
        _count: {
          select: {
            likes: true
          }
        }
      }
    }
    _count: {
      select: {
        comments: true
        likes: true
      }
    }
  }
}>

export type PostWithDetails = PostWithDetailsBase & {
  isLiked?: boolean
  comments?: Array<PostWithDetailsBase['comments'][number] & {
    isLiked?: boolean
    likeCount?: number
  }>
}
