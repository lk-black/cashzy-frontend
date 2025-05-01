import api from './api';
import { Expense } from '../types';

export const expenseService = {
  async getExpenses(): Promise<Expense[]> {
    const { data } = await api.get('/expenses');
    return data;
  },

  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const { data } = await api.post('/expenses', expense);
    return data;
  },

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    const { data } = await api.put(`/expenses/${id}`, expense);
    return data;
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  }
};