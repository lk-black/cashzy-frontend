import { useState, useEffect, useCallback } from 'react';
import { Expense, expenseSchema } from '../../types';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadExpenses();
    } else {
      setExpenses([]);
      setLoading(false);
    }
  }, [user]);

  const loadExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      const data = response.data;

      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Erro ao carregar despesas');
    } finally {
      setLoading(false);
    }
  };

  const updateExpenses = useCallback(async (newExpense: Omit<Expense, 'id'>) => {
    if (!user) return;

    try {
      // Validate data
      const validatedData = expenseSchema.parse(newExpense);

      const response = await api.post('/expenses', {
        user_id: user.id,
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description,
        date: validatedData.date,
        category_id: validatedData.categoryId,
        recurring_id: validatedData.recurringId
      });

      const data = response.data;

      setExpenses(prev => [data, ...prev]);
      toast.success('Despesa adicionada com sucesso');
      return { success: true };
    } catch (error: any) {
      console.error('Error updating expenses:', error);
      toast.error(error.message || 'Erro ao adicionar despesa');
      throw error;
    }
  }, [user]);

  return [expenses, updateExpenses] as const;
}