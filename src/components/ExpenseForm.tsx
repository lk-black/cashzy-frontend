import React, { useState } from 'react';
import { Expense } from '../types';
import { DollarSign, Calendar, FileText, RepeatIcon, AlertTriangle } from 'lucide-react';

interface ExpenseFormProps {
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  type: 'ad' | 'creative' | 'asset';
}

const typeLabels = {
  ad: 'Gasto com Anúncio',
  creative: 'Gasto com Criativo',
  asset: 'Gasto com Ativo',
};

const typeIcons = {
  ad: DollarSign,
  creative: FileText,
  asset: RepeatIcon,
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSubmit, type }) => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: today,
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
      isRecurring,
      ...(isRecurring && { recurringDay: dayOfMonth })
    });
    setFormData({
      amount: '',
      description: '',
      date: today,
    });
    setIsRecurring(false);
    setDayOfMonth(1);
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number);
  };

  const Icon = typeIcons[type];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${type === 'ad' ? 'blue' : type === 'creative' ? 'purple' : 'orange'}-500/20`}>
            <Icon className={`w-5 h-5 text-${type === 'ad' ? 'blue' : type === 'creative' ? 'purple' : 'orange'}-400`} />
          </div>
          <div>
            <h3 className="font-medium text-white">{typeLabels[type]}</h3>
            <p className="text-sm text-gray-400">Registre seus gastos com {typeLabels[type].toLowerCase()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Valor
          </label>
          <div className="relative">
            <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
              focusedField === 'amount' ? 'text-purple-400' : 'text-gray-400'
            }`} />
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              onFocus={() => setFocusedField('amount')}
              onBlur={() => setFocusedField(null)}
              className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-300 ${
                focusedField === 'amount'
                  ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              placeholder="0,00"
              required
              min="0"
              step="0.01"
            />
          </div>
          {formData.amount && (
            <p className="mt-1 text-sm text-gray-400">
              {formatCurrency(formData.amount)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Descrição
          </label>
          <div className="relative">
            <FileText className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
              focusedField === 'description' ? 'text-purple-400' : 'text-gray-400'
            }`} />
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-300 ${
                focusedField === 'description'
                  ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              placeholder="Descreva a despesa..."
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Data
          </label>
          <div className="relative">
            <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
              focusedField === 'date' ? 'text-purple-400' : 'text-gray-400'
            }`} />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              onFocus={() => setFocusedField('date')}
              onBlur={() => setFocusedField(null)}
              className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white transition-all duration-300 ${
                focusedField === 'date'
                  ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              required
            />
          </div>
        </div>

        {/* Recurring Expense Toggle */}
        <div className="pt-4 border-t border-gray-800">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-10 h-6 rounded-full transition-colors duration-300 ${
                isRecurring ? 'bg-purple-600' : 'bg-gray-700'
              }`}
              onClick={() => setIsRecurring(!isRecurring)}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-300 mt-1 ${
                  isRecurring ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="text-sm text-gray-300">Despesa Recorrente</span>
          </label>

          {isRecurring && (
            <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-purple-200">
                  Esta despesa será registrada automaticamente todo mês no dia selecionado
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Dia do Mês
                </label>
                <input
                  type="number"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  min="1"
                  max="31"
                  className="w-full p-2 bg-white/5 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] transform duration-200"
      >
        <span className="transform group-hover:scale-105 transition-transform">
          Adicionar {typeLabels[type]}
        </span>
      </button>
    </form>
  );
};

export default ExpenseForm;