import { useState, useEffect, useCallback } from 'react';
import { BudgetLimit, budgetLimitSchema } from '../../types';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export function useBudgetLimits() {
  const { user } = useAuth();
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBudgetLimits();
    } else {
      setBudgetLimits([]);
      setLoading(false);
    }
  }, [user]);

  const loadBudgetLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_limits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process and validate data
      const processedData = (data || []).map(limit => ({
        id: limit.id,
        categoryId: limit.category_id,
        amount: parseFloat(String(limit.amount)) || 0,
        period: limit.period,
        notifyAt: parseInt(String(limit.notify_at)) || 80,
        active: Boolean(limit.active),
        createdAt: limit.created_at,
        startDate: limit.start_date || new Date().toISOString()
      }));

      setBudgetLimits(processedData);
    } catch (error) {
      console.error('Error loading budget limits:', error);
      toast.error('Erro ao carregar limites de orçamento');
    } finally {
      setLoading(false);
    }
  };

  const addBudgetLimit = useCallback(async (newLimit: Omit<BudgetLimit, 'id' | 'createdAt'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Validate data
      const validatedData = budgetLimitSchema.parse(newLimit);

      // Check if limit already exists for this category
      const existingLimit = budgetLimits.find(
        limit => limit.categoryId === validatedData.categoryId && limit.active
      );

      if (existingLimit) {
        throw new Error('Já existe um limite ativo para esta categoria');
      }

      // Insert new limit
      const { data, error } = await supabase
        .from('budget_limits')
        .insert({
          user_id: user.id,
          category_id: validatedData.categoryId,
          amount: validatedData.amount,
          period: validatedData.period,
          notify_at: validatedData.notifyAt,
          active: true,
          start_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Process returned data
      const processedLimit: BudgetLimit = {
        id: data.id,
        categoryId: data.category_id,
        amount: parseFloat(String(data.amount)) || 0,
        period: data.period,
        notifyAt: parseInt(String(data.notify_at)) || 80,
        active: Boolean(data.active),
        createdAt: data.created_at,
        startDate: data.start_date
      };

      setBudgetLimits(prev => [processedLimit, ...prev]);
      toast.success('Limite de orçamento adicionado com sucesso');
      return { success: true, limit: processedLimit };
    } catch (error: any) {
      console.error('Error adding budget limit:', error);
      toast.error(error.message || 'Erro ao adicionar limite de orçamento');
      throw error;
    }
  }, [user, budgetLimits]);

  const updateBudgetLimit = useCallback(async (limitId: string, updates: Partial<BudgetLimit>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const currentLimit = budgetLimits.find(l => l.id === limitId);
      if (!currentLimit) {
        throw new Error('Limite não encontrado');
      }

      // Validate updates
      const validatedData = budgetLimitSchema.parse({
        categoryId: updates.categoryId || currentLimit.categoryId,
        amount: updates.amount || currentLimit.amount,
        period: updates.period || currentLimit.period,
        notifyAt: updates.notifyAt || currentLimit.notifyAt,
        active: updates.active ?? currentLimit.active
      });

      // Check for existing limits if category is being changed
      if (updates.categoryId && updates.categoryId !== currentLimit.categoryId) {
        const existingLimit = budgetLimits.find(
          limit => limit.categoryId === updates.categoryId && limit.active && limit.id !== limitId
        );

        if (existingLimit) {
          throw new Error('Já existe um limite ativo para esta categoria');
        }
      }

      // Update limit
      const { data, error } = await supabase
        .from('budget_limits')
        .update({
          category_id: validatedData.categoryId,
          amount: validatedData.amount,
          period: validatedData.period,
          notify_at: validatedData.notifyAt,
          active: validatedData.active
        })
        .eq('id', limitId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Process returned data
      const processedLimit: BudgetLimit = {
        id: data.id,
        categoryId: data.category_id,
        amount: parseFloat(String(data.amount)) || 0,
        period: data.period,
        notifyAt: parseInt(String(data.notify_at)) || 80,
        active: Boolean(data.active),
        createdAt: data.created_at,
        startDate: data.start_date
      };

      setBudgetLimits(prev => prev.map(limit => 
        limit.id === limitId ? processedLimit : limit
      ));

      toast.success('Limite de orçamento atualizado com sucesso');
      return { success: true, limit: processedLimit };
    } catch (error: any) {
      console.error('Error updating budget limit:', error);
      toast.error(error.message || 'Erro ao atualizar limite de orçamento');
      throw error;
    }
  }, [user, budgetLimits]);

  const deleteBudgetLimit = useCallback(async (limitId: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { error } = await supabase
        .from('budget_limits')
        .delete()
        .eq('id', limitId)
        .eq('user_id', user.id);

      if (error) throw error;

      setBudgetLimits(prev => prev.filter(limit => limit.id !== limitId));
      toast.success('Limite de orçamento removido com sucesso');
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting budget limit:', error);
      toast.error(error.message || 'Erro ao remover limite de orçamento');
      throw error;
    }
  }, [user]);

  return {
    budgetLimits,
    loading,
    addBudgetLimit,
    updateBudgetLimit,
    deleteBudgetLimit
  };
}