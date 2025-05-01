import { useState, useEffect, useCallback } from 'react';
import { RecurringExpense } from '../../types';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export function useRecurringExpenses() {
  const { user } = useAuth();
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecurringExpenses();
    } else {
      setRecurringExpenses([]);
      setLoading(false);
    }
  }, [user]);

  const loadRecurringExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process and validate data
      const processedData = (data || []).map(expense => ({
        id: expense.id,
        name: expense.name.trim(),
        amount: parseFloat(String(expense.amount)) || 0,
        type: expense.type,
        dayOfMonth: Math.min(Math.max(parseInt(String(expense.day_of_month)), 1), 31),
        description: expense.description?.trim() || '',
        isActive: Boolean(expense.is_active),
        lastProcessed: expense.last_processed,
        createdAt: expense.created_at
      }));

      setRecurringExpenses(processedData);
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
      toast.error('Erro ao carregar despesas recorrentes');
    } finally {
      setLoading(false);
    }
  };

  const updateRecurringExpenses = useCallback(async (newExpense: Omit<RecurringExpense, 'id' | 'createdAt' | 'lastProcessed'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Validate and clean input data
      const name = newExpense.name.trim();
      if (!name) {
        throw new Error('O nome da despesa recorrente é obrigatório');
      }

      const amount = parseFloat(String(newExpense.amount));
      if (isNaN(amount) || amount <= 0) {
        throw new Error('O valor deve ser maior que zero');
      }

      const dayOfMonth = Math.min(Math.max(parseInt(String(newExpense.dayOfMonth)), 1), 31);
      if (isNaN(dayOfMonth)) {
        throw new Error('O dia do mês é inválido');
      }

      // Prepare data for insertion
      const expenseData = {
        user_id: user.id,
        name,
        amount,
        type: newExpense.type,
        day_of_month: dayOfMonth,
        description: newExpense.description?.trim() || '',
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert(expenseData)
        .select()
        .single();

      if (error) {
        if (error.code === '23502') { // not-null violation
          throw new Error('Todos os campos obrigatórios devem ser preenchidos');
        }
        if (error.code === '23514') { // check constraint violation
          throw new Error('Os valores informados são inválidos');
        }
        throw error;
      }

      // Process returned data
      const processedData: RecurringExpense = {
        id: data.id,
        name: data.name.trim(),
        amount: parseFloat(String(data.amount)) || 0,
        type: data.type,
        dayOfMonth: parseInt(String(data.day_of_month)),
        description: data.description?.trim() || '',
        isActive: Boolean(data.is_active),
        lastProcessed: data.last_processed,
        createdAt: data.created_at
      };

      setRecurringExpenses(prev => [processedData, ...prev]);
      toast.success('Despesa recorrente adicionada com sucesso');
      return { success: true };
    } catch (error: any) {
      console.error('Error updating recurring expenses:', error);
      toast.error(error.message || 'Erro ao adicionar despesa recorrente');
      throw error;
    }
  }, [user]);

  const toggleRecurringExpense = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const expense = recurringExpenses.find(e => e.id === id);
      if (!expense) {
        throw new Error('Despesa recorrente não encontrada');
      }

      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_active: !expense.isActive })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setRecurringExpenses(prev => prev.map(exp => 
        exp.id === id ? { ...exp, isActive: !exp.isActive } : exp
      ));

      toast.success(`Despesa recorrente ${expense.isActive ? 'desativada' : 'ativada'}`);
    } catch (error: any) {
      console.error('Error toggling recurring expense:', error);
      toast.error(error.message || 'Erro ao atualizar despesa recorrente');
    }
  }, [user, recurringExpenses]);

  const deleteRecurringExpense = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setRecurringExpenses(prev => prev.filter(exp => exp.id !== id));
      toast.success('Despesa recorrente removida com sucesso');
    } catch (error: any) {
      console.error('Error deleting recurring expense:', error);
      toast.error(error.message || 'Erro ao remover despesa recorrente');
    }
  }, [user]);

  return {
    recurringExpenses,
    setRecurringExpenses: updateRecurringExpenses,
    toggleRecurringExpense,
    deleteRecurringExpense,
    loading
  };
}