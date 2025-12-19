import { z } from 'zod'

export const createListingSchema = z.object({
  title: z
    .string()
    .min(3, 'Başlık en az 3 karakter olmalıdır')
    .max(200, 'Başlık en fazla 200 karakter olabilir'),
  description: z
    .string()
    .min(10, 'Açıklama en az 10 karakter olmalıdır')
    .max(5000, 'Açıklama en fazla 5000 karakter olabilir'),
  price: z.number().positive('Fiyat pozitif bir sayı olmalıdır'),
  images: z.array(z.string().url('Geçerli bir görsel URL\'si giriniz')).min(1, 'En az 1 görsel eklenmelidir').max(10, 'En fazla 10 görsel eklenebilir'),
})

export const updateListingSchema = z.object({
  title: z
    .string()
    .min(3, 'Başlık en az 3 karakter olmalıdır')
    .max(200, 'Başlık en fazla 200 karakter olabilir')
    .optional(),
  description: z
    .string()
    .min(10, 'Açıklama en az 10 karakter olmalıdır')
    .max(5000, 'Açıklama en fazla 5000 karakter olabilir')
    .optional(),
  price: z.number().positive('Fiyat pozitif bir sayı olmalıdır').optional(),
  images: z.array(z.string().url('Geçerli bir görsel URL\'si giriniz')).min(1, 'En az 1 görsel eklenmelidir').max(10, 'En fazla 10 görsel eklenebilir').optional(),
})

export type CreateListingInput = z.infer<typeof createListingSchema>
export type UpdateListingInput = z.infer<typeof updateListingSchema>

