import React from 'react';
import { BudgetLimit, Category } from '../types';
import { DollarSign, Calendar, Bell, Trash2, Edit2 } from 'lucide-react';

interface BudgetLimitsListProps {
  limits: BudgetLimit[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (limit: BudgetLimit) => void;
}

const BudgetLimitsList: React.FC<BudgetLimitsListProps> = ({
  limits,
  categories,
  onDelete,
  onEdit
}) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Categoria não encontrada';
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily':
        return 'Diário';
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return 'Mensal';
      default:
        return period;
    }
  };

  return (
    <div className="space-y-4">
      {limits.map(limit => (
        <div
          key={limit.id}
          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-amber-500/30 transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-white">
                {getCategoryName(limit.categoryId)}
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-medium">
                    {formatCurrency(limit.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">
                    {getPeriodLabel(limit.period)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">
                    Notificar em {limit.notifyAt}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(limit)}
                className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(limit.id)}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {limits.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-lg font-medium mb-2">Nenhum limite definido</p>
          <p className="text-sm">
            Defina limites de gastos para melhor controle financeiro
          </p>
        </div>
      )}
    </div>
  );
};

export default BudgetLimitsList;