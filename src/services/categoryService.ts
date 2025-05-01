import api from './api';
import { Category } from '../types';

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const { data } = await api.get('/categories');
    return data;
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const { data } = await api.post('/categories', category);
    return data;
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const { data } = await api.put(`/categories/${id}`, category);
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
};