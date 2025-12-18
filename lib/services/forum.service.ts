import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'

export class ForumService {
  static async getCategories() {
    return prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })
  }

  static async getPostsByCategory(categoryId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { categoryId },
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      prisma.post.count({
        where: { categoryId },
      }),
    ])

    return {
      posts,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  static async getPostById(id: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
            displayName: true,
            role: true,
            postCount: true,
            commentCount: true,
            createdAt: true,
          },
        },
        category: true,
        images: {
          orderBy: { order: 'asc' },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                isVerified: true,
                displayName: true,
                role: true,
                postCount: true,
                commentCount: true,
                createdAt: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    isVerified: true,
                    displayName: true,
                    role: true,
                    postCount: true,
                    commentCount: true,
                    createdAt: true,
                  },
                },
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          where: {
            parentId: null,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    if (!post) return null

    // Increment view count
    await prisma.post.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    // Check if user liked the post
    let isLiked = false
    if (userId) {
      const like = await prisma.postLike.findUnique({
        where: {
          userId_postId: {
            userId,
            postId: id,
          },
        },
      })
      isLiked = !!like

      // Check if user liked comments
      if (post.comments && post.comments.length > 0) {
        const commentIds = post.comments.map((c: any) => c.id)
        const commentLikes = await prisma.commentLike.findMany({
          where: {
            userId,
            commentId: { in: commentIds },
          },
        })
        const likedCommentIds = new Set(commentLikes.map((cl) => cl.commentId))
        post.comments = post.comments.map((c: any) => ({
          ...c,
          isLiked: likedCommentIds.has(c.id),
        }))
      }
    }

    return {
      ...post,
      isLiked,
    }
  }

  static async createPost(data: {
    title: string
    content: string
    categoryId: string
    authorId: string
    images?: string[]
  }) {
    const slug = slugify(data.title) + '-' + Date.now()

    const post = await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        slug,
        categoryId: data.categoryId,
        authorId: data.authorId,
        images: data.images
          ? {
              create: data.images.map((url, index) => ({
                url,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        author: true,
        category: true,
      },
    })

    // Update user post count
    await prisma.user.update({
      where: { id: data.authorId },
      data: {
        postCount: {
          increment: 1,
        },
      },
    })

    return post
  }

  static async updatePost(id: string, data: {
    title?: string
    content?: string
    categoryId?: string
  }, authorId: string) {
    // Check ownership
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!post) {
      throw new Error('Post bulunamadı')
    }

    if (post.authorId !== authorId) {
      throw new Error('Bu postu düzenleme yetkiniz yok')
    }

    return prisma.post.update({
      where: { id },
      data,
    })
  }

  static async deletePost(id: string, userId: string, userRole: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!post) {
      throw new Error('Post bulunamadı')
    }

    // Only author or admin/mod can delete
    if (post.authorId !== userId && userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
      throw new Error('Bu postu silme yetkiniz yok')
    }

    // Update user post count
    await prisma.user.update({
      where: { id: post.authorId },
      data: {
        postCount: {
          decrement: 1,
        },
      },
    })

    return prisma.post.delete({
      where: { id },
    })
  }

  static async toggleLike(postId: string, userId: string) {
    const existing = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    if (existing) {
      // Unlike
      await prisma.postLike.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      })
      await prisma.post.update({
        where: { id: postId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      })
      return { liked: false }
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          userId,
          postId,
        },
      })
      await prisma.post.update({
        where: { id: postId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      })
      return { liked: true }
    }
  }

  static async createComment(data: {
    content: string
    postId: string
    authorId: string
    parentId?: string
  }) {
    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        postId: data.postId,
        authorId: data.authorId,
        parentId: data.parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    })

    // Update post comment count
    await prisma.post.update({
      where: { id: data.postId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    })

    // Update user comment count
    await prisma.user.update({
      where: { id: data.authorId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    })

    return comment
  }

  static async toggleCommentLike(commentId: string, userId: string) {
    const existing = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    })

    if (existing) {
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      })
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      })
      return { liked: false }
    } else {
      await prisma.commentLike.create({
        data: {
          userId,
          commentId,
        },
      })
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      })
      return { liked: true }
    }
  }

  static async pinPost(id: string) {
    return prisma.post.update({
      where: { id },
      data: { isPinned: true },
    })
  }

  static async unpinPost(id: string) {
    return prisma.post.update({
      where: { id },
      data: { isPinned: false },
    })
  }

  static async lockPost(id: string) {
    return prisma.post.update({
      where: { id },
      data: { isLocked: true },
    })
  }

  static async unlockPost(id: string) {
    return prisma.post.update({
      where: { id },
      data: { isLocked: false },
    })
  }
}

