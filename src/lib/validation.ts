import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  last_sign_in_at: z.string().datetime().nullable(),
  is_active: z.boolean().default(true),
});

export const campaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório'),
  platform: z.enum(['Meta Ads', 'Google Ads', 'TikTok Ads']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  adSpend: z.number().min(0),
  revenue: z.number().min(0),
  creativesCost: z.number().min(0),
  assetsCost: z.number().min(0),
});

export const expenseSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['ad', 'creative', 'asset']),
  amount: z.number().min(0),
  description: z.string().min(1, 'Descrição é obrigatória'),
  date: z.string().datetime(),
});

export type Profile = z.infer<typeof profileSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type Expense = z.infer<typeof expenseSchema>;