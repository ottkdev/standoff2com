import { z } from 'zod'

export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(5, 'Konu en az 5 karakter olmalıdır')
    .max(200, 'Konu en fazla 200 karakter olabilir'),
  category: z.enum(['PAYMENT', 'MARKETPLACE', 'ACCOUNT', 'TECHNICAL', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  message: z
    .string()
    .min(10, 'Mesaj en az 10 karakter olmalıdır')
    .max(5000, 'Mesaj en fazla 5000 karakter olabilir'),
})

export const updateTicketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'CLOSED']),
})

export const createMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Mesaj boş olamaz')
    .max(5000, 'Mesaj en fazla 5000 karakter olabilir'),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>
export type CreateMessageInput = z.infer<typeof createMessageSchema>

