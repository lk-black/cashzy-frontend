import { z } from 'zod';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'expense' | 'income' | 'both';
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  adSpend: number;
  revenue: number;
  assetsCost: number;
  date: string;
  categoryId?: string;
  hasReceivable?: boolean;
  receivableAmount?: number;
  receivableDate?: string;
}

export interface Expense {
  id: string;
  type: 'ad' | 'asset';
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  isRecurring?: boolean;
  recurringId?: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  type: 'ad' | 'asset';
  dayOfMonth: number;
  description?: string;
  isActive: boolean;
  lastProcessed?: string;
  nextDue?: string;
  createdAt: string;
}

export interface Receivable {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'received' | 'overdue';
  campaignId?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalSpend: number;
  totalRevenue: number;
  roi: number;
  assetsCost: number;
  currentBalance: number;
  pendingReceivables: number;
  recurringExpenses: {
    total: number;
    nextDue: RecurringExpense[];
  };
}

export interface MonthlyMetrics {
  month: string;
  year: number;
  revenue: number;
  expenses: number;
  balance: number;
}

export interface BudgetLimit {
  id: string;
  categoryId: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  notifyAt: number;
  active: boolean;
  createdAt: string;
}

export type NewCampaign = Omit<Campaign, 'id'>;

// Validation schemas with improved error messages
export const recurringExpenseSchema = z.object({
  name: z.string()
    .min(1, 'O nome da despesa recorrente é obrigatório')
    .trim()
    .refine(val => val.length > 0, 'O nome não pode estar em branco'),
  amount: z.number()
    .min(0.01, 'O valor deve ser maior que zero')
    .refine(val => !isNaN(val), 'Valor inválido'),
  type: z.enum(['ad', 'asset'], {
    errorMap: () => ({ message: 'Tipo de despesa inválido' })
  }),
  dayOfMonth: z.number()
    .int('O dia deve ser um número inteiro')
    .min(1, 'O dia deve ser entre 1 e 31')
    .max(31, 'O dia deve ser entre 1 e 31')
    .refine(val => !isNaN(val), 'Dia inválido'),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export type NewRecurringExpense = z.infer<typeof recurringExpenseSchema>;

export const transactionSchema = z.object({
  type: z.enum(['expense', 'income'], {
    errorMap: () => ({ message: 'Tipo de transação inválido' })
  }),
  amount: z.number()
    .min(0.01, 'O valor deve ser maior que zero')
    .refine(val => !isNaN(val), 'Valor inválido'),
  description: z.string()
    .min(1, 'A descrição é obrigatória')
    .trim()
    .refine(val => val.length > 0, 'A descrição não pode estar em branco'),
  categoryId: z.string()
    .min(1, 'A categoria é obrigatória')
    .uuid('Categoria inválida'),
  date: z.string()
    .refine(val => !isNaN(Date.parse(val)), 'Data inválida')
});

export type NewTransaction = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'O nome da categoria é obrigatório')
    .trim()
    .refine(val => val.length > 0, 'O nome não pode estar em branco'),
  color: z.string()
    .min(1, 'A cor é obrigatória')
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida'),
  icon: z.string()
    .min(1, 'O ícone é obrigatório'),
  type: z.enum(['expense', 'income', 'both'], {
    errorMap: () => ({ message: 'Tipo de categoria inválido' })
  })
});

export type NewCategory = z.infer<typeof categorySchema>;

// Campaign validation schema
export const campaignSchema = z.object({
  name: z.string()
    .min(1, 'O nome da campanha é obrigatório')
    .trim()
    .refine(val => val.length > 0, 'O nome não pode estar em branco'),
  platform: z.string()
    .min(1, 'A plataforma é obrigatória')
    .trim()
    .refine(val => val.length > 0, 'A plataforma não pode estar em branco'),
  adSpend: z.number()
    .min(0, 'O gasto com anúncios não pode ser negativo')
    .refine(val => !isNaN(val), 'Valor inválido'),
  revenue: z.number()
    .min(0, 'A receita não pode ser negativa')
    .refine(val => !isNaN(val), 'Valor inválido'),
  assetsCost: z.number()
    .min(0, 'O custo com ativos não pode ser negativo')
    .refine(val => !isNaN(val), 'Valor inválido'),
  date: z.string()
    .refine(val => !isNaN(Date.parse(val)), 'Data inválida'),
  categoryId: z.string().uuid('Categoria inválida').optional(),
  hasReceivable: z.boolean().optional(),
  receivableAmount: z.number().optional(),
  receivableDate: z.string().optional()
});

// Expense validation schema
export const expenseSchema = z.object({
  type: z.enum(['ad', 'asset'], {
    errorMap: () => ({ message: 'Tipo de despesa inválido' })
  }),
  amount: z.number()
    .min(0.01, 'O valor deve ser maior que zero')
    .refine(val => !isNaN(val), 'Valor inválido'),
  description: z.string()
    .min(1, 'A descrição é obrigatória')
    .trim()
    .refine(val => val.length > 0, 'A descrição não pode estar em branco'),
  date: z.string()
    .refine(val => !isNaN(Date.parse(val)), 'Data inválida'),
  categoryId: z.string().uuid('Categoria inválida').optional(),
  recurringId: z.string().uuid('ID de recorrência inválido').optional()
});

// Budget limit validation schema
export const budgetLimitSchema = z.object({
  categoryId: z.string()
    .uuid('Categoria inválida'),
  amount: z.number()
    .min(0.01, 'O valor deve ser maior que zero')
    .refine(val => !isNaN(val), 'Valor inválido'),
  period: z.enum(['daily', 'weekly', 'monthly'], {
    errorMap: () => ({ message: 'Período inválido' })
  }),
  notifyAt: z.number()
    .min(1, 'A porcentagem deve ser entre 1 e 100')
    .max(100, 'A porcentagem deve ser entre 1 e 100')
    .refine(val => !isNaN(val), 'Valor inválido'),
  active: z.boolean().default(true)
});

// Receivable validation schema
export const receivableSchema = z.object({
  name: z.string()
    .min(1, 'O nome é obrigatório')
    .trim()
    .refine(val => val.length > 0, 'O nome não pode estar em branco'),
  amount: z.number()
    .min(0.01, 'O valor deve ser maior que zero')
    .refine(val => !isNaN(val), 'Valor inválido'),
  dueDate: z.string()
    .refine(val => !isNaN(Date.parse(val)), 'Data inválida'),
  status: z.enum(['pending', 'received', 'overdue'], {
    errorMap: () => ({ message: 'Status inválido' })
  }),
  campaignId: z.string().uuid('Campanha inválida').optional()
});

export type NewReceivable = Omit<Receivable, 'id' | 'createdAt'>;

// Helper function to safely parse numbers
export const safeParseNumber = (value: unknown): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : 0;
  }
  return 0;
};

// Helper function to safely format currency
export const formatCurrency = (value: unknown): string => {
  const amount = safeParseNumber(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};