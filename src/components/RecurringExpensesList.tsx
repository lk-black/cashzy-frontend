import React from 'react';
import { RecurringExpense } from '../types';
import { Calendar, DollarSign, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RecurringExpensesListProps {
  expenses: RecurringExpense[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const RecurringExpensesList: React.FC<RecurringExpensesListProps> = ({
  expenses,
  onToggle,
  onDelete
}) => {
  const formatCurrency = (value: number | string | null | undefined): string => {
    let numValue: number;
    if (typeof value === 'string') {
      numValue = parseFloat(value);
    } else {
      numValue = typeof value === 'number' ? value : 0;
    }

    if (isNaN(numValue)) {
      numValue = 0;
    }

    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  const getNextDueDate = (expense: RecurringExpense): Date => {
    const today = new Date();
    const lastProcessed = expense.lastProcessed ? new Date(expense.lastProcessed) : null;
    
    let nextDue = new Date(today.getFullYear(), today.getMonth(), expense.dayOfMonth);
    
    // If last processed is in current month, move to next month
    if (lastProcessed && 
        lastProcessed.getMonth() === today.getMonth() && 
        lastProcessed.getFullYear() === today.getFullYear()) {
      nextDue = new Date(today.getFullYear(), today.getMonth() + 1, expense.dayOfMonth);
    }
    
    // If the calculated date is in the past, move to next month
    if (nextDue < today) {
      nextDue = new Date(today.getFullYear(), today.getMonth() + 1, expense.dayOfMonth);
    }
    
    return nextDue;
  };

  const getExpenseTypeLabel = (type: string): string => {
    switch (type) {
      case 'ad':
        return 'Anúncio';
      case 'creative':
        return 'Criativo';
      case 'asset':
        return 'Ativo';
      default:
        return type;
    }
  };

  const handleDelete = async (expense: RecurringExpense) => {
    try {
      // Request notification permission if not granted
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Show custom popup dialog
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
      dialog.innerHTML = `
        <div class="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 max-w-md mx-4 animate-fade-in">
          <h3 class="text-lg font-semibold text-white mb-2">Confirmar exclusão</h3>
          <p class="text-gray-400 mb-6">
            Tem certeza que deseja excluir a despesa recorrente "${expense.name}"?
          </p>
          <div class="flex justify-end gap-3">
            <button class="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors" id="cancel">
              Cancelar
            </button>
            <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors" id="confirm">
              Excluir
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      // Handle dialog buttons
      return new Promise<void>((resolve, reject) => {
        const handleConfirm = async () => {
          try {
            await onDelete(expense.id);
            
            // Show system notification
            if (Notification.permission === 'granted') {
              new Notification('Despesa Recorrente Excluída', {
                body: `A despesa "${expense.name}" foi excluída com sucesso.`,
                icon: '/fav.png'
              });
            }

            toast.success('Despesa recorrente excluída com sucesso');
            dialog.remove();
            resolve();
          } catch (error) {
            reject(error);
          }
        };

        const handleCancel = () => {
          dialog.remove();
          resolve();
        };

        dialog.querySelector('#confirm')?.addEventListener('click', handleConfirm);
        dialog.querySelector('#cancel')?.addEventListener('click', handleCancel);
        dialog.addEventListener('click', (e) => {
          if (e.target === dialog) handleCancel();
        });
      });
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      toast.error('Erro ao excluir despesa recorrente');
    }
  };

  return (
    <div className="space-y-4">
      {expenses.map(expense => {
        const nextDue = getNextDueDate(expense);
        const isOverdue = nextDue < new Date();
        const amount = parseFloat(String(expense.amount)) || 0;
        
        return (
          <div
            key={expense.id}
            className={`bg-white/5 rounded-lg p-4 border transition-all ${
              expense.isActive
                ? isOverdue
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-gray-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-white">{expense.name}</h3>
                <p className="text-sm text-gray-400">
                  {expense.description || getExpenseTypeLabel(expense.type)}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">
                      Todo dia {expense.dayOfMonth}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-medium">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                </div>
                {expense.isActive && (
                  <div className={`text-sm mt-2 ${
                    isOverdue ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {isOverdue
                      ? 'Vencida'
                      : `Próximo vencimento: ${nextDue.toLocaleDateString('pt-BR')}`
                    }
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggle(expense.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    expense.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  title={expense.isActive ? 'Desativar' : 'Ativar'}
                >
                  {expense.isActive ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(expense)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {expenses.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-lg font-medium mb-2">Nenhuma despesa recorrente</p>
          <p className="text-sm">
            Adicione despesas recorrentes para automatizar seus registros mensais
          </p>
        </div>
      )}
    </div>
  );
};

export default RecurringExpensesList;