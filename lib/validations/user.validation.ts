import { z } from 'zod'

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır')
    .max(20, 'Kullanıcı adı en fazla 20 karakter olabilir')
    .regex(/^[a-zA-Z0-9_]+$/, 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .max(100, 'Şifre en fazla 100 karakter olabilir'),
  displayName: z.string().max(50, 'Görünen ad en fazla 50 karakter olabilir').optional(),
})

export const loginSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı gereklidir'),
  password: z.string().min(1, 'Şifre gereklidir'),
})

export const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url('Geçerli bir görsel URL\'si giriniz').optional().or(z.literal('')),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

