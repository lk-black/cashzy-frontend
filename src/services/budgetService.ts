import api from './api';
import { BudgetLimit } from '../types';

export const budgetService = {
  async getBudgetLimits(): Promise<BudgetLimit[]> {
    const { data } = await api.get('/budget-limits');
    return data;
  },

  async createBudgetLimit(limit: Omit<BudgetLimit, 'id'>): Promise<BudgetLimit> {
    const { data } = await api.post('/budget-limits', limit);
    return data;
  },

  async updateBudgetLimit(id: string, limit: Partial<BudgetLimit>): Promise<BudgetLimit> {
    const { data } = await api.put(`/budget-limits/${id}`, limit);
    return data;
  },

  async deleteBudgetLimit(id: string): Promise<void> {
    await api.delete(`/budget-limits/${id}`);
  }
};