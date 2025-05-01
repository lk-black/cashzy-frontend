import { useState, useEffect, useCallback } from 'react';
import { Category, categorySchema, NewCategory } from '../../types';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCategories();
    } else {
      resetCategories();
    }
  }, [user]);

  const resetCategories = useCallback(() => {
    setCategories([]);
    setLoading(false);
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories', {
        params: { userId: user?.id }
      });
      const data = response.data;

      const processedData = (data || []).map(category => ({
        id: category.id,
        name: category.name.trim(),
        color: category.color,
        icon: category.icon,
        type: category.type,
        createdAt: category.createdAt
      }));

      setCategories(processedData);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const modifyCategories = useCallback(async (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
  }, []);

  const addCategory = useCallback(async (newCategory: NewCategory) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const validatedData = categorySchema.parse({
        ...newCategory,
        name: newCategory.name.trim()
      });

      const response = await api.post('/categories', {
        userId: user.id,
        name: validatedData.name,
        color: validatedData.color,
        icon: validatedData.icon,
        type: validatedData.type,
        createdAt: new Date().toISOString()
      });
      const data = response.data;

      const processedCategory: Category = {
        id: data.id,
        name: data.name,
        color: data.color,
        icon: data.icon,
        type: data.type,
        createdAt: data.createdAt
      };

      modifyCategories([processedCategory, ...categories]);
      toast.success('Categoria adicionada com sucesso');
      return { success: true, category: processedCategory };
    } catch (error: any) {
      console.error('Error adding category:', error);
      if (error.response?.data?.errors) {
        const messages = error.response.data.errors.map((err: any) => err.message);
        throw new Error(messages.join('\n'));
      }
      throw new Error(error.message || 'Erro ao adicionar categoria');
    }
  }, [user, categories, modifyCategories]);

  const updateCategory = useCallback(async (categoryId: string, updates: Partial<NewCategory>) => {
    if (!user) return;

    try {
      const currentCategory = categories.find(c => c.id === categoryId);
      if (!currentCategory) {
        throw new Error('Categoria não encontrada');
      }

      const validatedData = categorySchema.parse({
        name: updates.name?.trim() || currentCategory.name,
        color: updates.color || currentCategory.color,
        icon: updates.icon || currentCategory.icon,
        type: updates.type || currentCategory.type
      });

      const response = await api.put(`/categories/${categoryId}`, {
        name: validatedData.name,
        color: validatedData.color,
        icon: validatedData.icon,
        type: validatedData.type,
        userId: user.id
      });
      const data = response.data;

      const updatedCategory: Category = {
        id: data.id,
        name: data.name,
        color: data.color,
        icon: data.icon,
        type: data.type,
        createdAt: data.createdAt
      };

      modifyCategories(categories.map(cat => 
        cat.id === categoryId ? updatedCategory : cat
      ));

      toast.success('Categoria atualizada com sucesso');
      return { success: true, category: updatedCategory };
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast.error(error.message || 'Erro ao atualizar categoria');
      throw error;
    }
  }, [user, categories, modifyCategories]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!user) return;

    try {
      await api.delete(`/categories/${categoryId}`, {
        params: { userId: user.id }
      });

      modifyCategories(categories.filter(cat => cat.id !== categoryId));
      toast.success('Categoria removida com sucesso');
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Erro ao remover categoria');
      throw error;
    }
  }, [user, categories, modifyCategories]);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory
  };
}