import { useState, useEffect, useCallback } from 'react';
import { Transaction, transactionSchema } from '../../types';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const updateTransactions = useCallback(async (newTransaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      // Validate data
      const validatedData = transactionSchema.parse(newTransaction);

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: validatedData.type,
          amount: validatedData.amount,
          description: validatedData.description,
          category_id: validatedData.categoryId,
          date: validatedData.date
        })
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [data, ...prev]);
      toast.success('Transação adicionada com sucesso');
      return { success: true };
    } catch (error: any) {
      console.error('Error updating transactions:', error);
      toast.error(error.message || 'Erro ao adicionar transação');
      throw error;
    }
  }, [user]);

  return [transactions, updateTransactions] as const;
}