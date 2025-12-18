import { z } from 'zod'

export const createBlogPostSchema = z.object({
  title: z
    .string()
    .min(3, 'Başlık en az 3 karakter olmalıdır')
    .max(200, 'Başlık en fazla 200 karakter olabilir'),
  content: z
    .string()
    .min(100, 'İçerik en az 100 karakter olmalıdır')
    .max(50000, 'İçerik en fazla 50000 karakter olabilir'),
  excerpt: z.string().max(500).optional(),
  categoryId: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
})

export const createBlogCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Yorum boş olamaz')
    .max(2000, 'Yorum en fazla 2000 karakter olabilir'),
  blogPostId: z.string().min(1),
  parentId: z.string().optional(),
})

export const updateBlogPostSchema = createBlogPostSchema.partial()

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>
export type CreateBlogCommentInput = z.infer<typeof createBlogCommentSchema>
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>

