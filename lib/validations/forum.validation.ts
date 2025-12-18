import { z } from 'zod'

export const createPostSchema = z.object({
  title: z
    .string()
    .min(3, 'Başlık en az 3 karakter olmalıdır')
    .max(200, 'Başlık en fazla 200 karakter olabilir'),
  content: z
    .string()
    .min(10, 'İçerik en az 10 karakter olmalıdır')
    .max(10000, 'İçerik en fazla 10000 karakter olabilir'),
  categoryId: z.string().min(1, 'Kategori seçilmelidir'),
  images: z.array(z.string().url()).max(5, 'En fazla 5 görsel eklenebilir').optional(),
})

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Yorum boş olamaz')
    .max(2000, 'Yorum en fazla 2000 karakter olabilir'),
  postId: z.string().min(1),
  parentId: z.string().optional(),
})

export const updatePostSchema = createPostSchema.partial()

export type CreatePostInput = z.infer<typeof createPostSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>

