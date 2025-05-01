import { useState, useEffect, useCallback } from 'react';
import { Receivable } from '../types';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export function useReceivables() {
  const { user } = useAuth();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReceivables();
    } else {
      resetReceivables();
    }
  }, [user]);

  const resetReceivables = useCallback(() => {
    setReceivables([]);
    setLoading(false);
  }, []);

  const loadReceivables = useCallback(async () => {
    try {
      const response = await api.get('/receivables', {
        params: { userId: user?.id }
      });
      const data = response.data;

      const processedData = (data || []).map(receivable => ({
        id: receivable.id,
        name: receivable.name.trim(),
        amount: parseFloat(String(receivable.amount)) || 0,
        dueDate: receivable.dueDate,
        status: receivable.status,
        campaignId: receivable.campaignId,
        createdAt: receivable.createdAt
      }));

      setReceivables(processedData);
    } catch (error) {
      console.error('Error loading receivables:', error);
      toast.error('Erro ao carregar valores a receber');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const modifyReceivables = useCallback(async (updatedReceivables: Receivable[]) => {
    setReceivables(updatedReceivables);
  }, []);

  const addReceivable = useCallback(async (newReceivable: Omit<Receivable, 'id' | 'createdAt'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      if (!newReceivable.name.trim()) {
        throw new Error('O nome é obrigatório');
      }

      if (newReceivable.amount <= 0) {
        throw new Error('O valor deve ser maior que zero');
      }

      const response = await api.post('/receivables', {
        userId: user.id,
        name: newReceivable.name.trim(),
        amount: newReceivable.amount,
        dueDate: newReceivable.dueDate,
        status: newReceivable.status,
        campaignId: newReceivable.campaignId
      });
      const data = response.data;

      const processedReceivable: Receivable = {
        id: data.id,
        name: data.name,
        amount: parseFloat(String(data.amount)) || 0,
        dueDate: data.dueDate,
        status: data.status,
        campaignId: data.campaignId,
        createdAt: data.createdAt
      };

      modifyReceivables([processedReceivable, ...receivables]);
      toast.success('Valor a receber adicionado com sucesso');
      return { success: true, receivable: processedReceivable };
    } catch (error: any) {
      console.error('Error adding receivable:', error);
      toast.error(error.message || 'Erro ao adicionar valor a receber');
      throw error;
    }
  }, [user, receivables, modifyReceivables]);

  const updateReceivableStatus = useCallback(async (id: string, status: 'pending' | 'received' | 'overdue') => {
    if (!user) return;

    try {
      await api.patch(`/receivables/${id}`, { status, userId: user.id });

      modifyReceivables(receivables.map(receivable =>
        receivable.id === id ? { ...receivable, status } : receivable
      ));

      toast.success('Status atualizado com sucesso');
    } catch (error: any) {
      console.error('Error updating receivable status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
      throw error;
    }
  }, [user, receivables, modifyReceivables]);

  const deleteReceivable = useCallback(async (id: string) => {
    if (!user) return;

    try {
      await api.delete(`/receivables/${id}`, { data: { userId: user.id } });

      modifyReceivables(receivables.filter(receivable => receivable.id !== id));
      toast.success('Valor a receber removido com sucesso');
    } catch (error: any) {
      console.error('Error deleting receivable:', error);
      toast.error(error.message || 'Erro ao remover valor a receber');
      throw error;
    }
  }, [user, receivables, modifyReceivables]);

  return {
    receivables,
    loading,
    addReceivable,
    updateReceivableStatus,
    deleteReceivable
  };
}