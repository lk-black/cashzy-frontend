import React, { useState, useEffect } from 'react';
import { Category, budgetLimitSchema } from '../types';
import { DollarSign, Calendar, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BudgetLimitFormProps {
  categories: Category[];
  onSubmit: (limit: {
    categoryId: string;
    amount: number;
    period: 'daily' | 'weekly' | 'monthly';
    notifyAt: number;
  }) => void;
  onCancel: () => void;
  initialData?: {
    categoryId: string;
    amount: number;
    period: 'daily' | 'weekly' | 'monthly';
    notifyAt: number;
  };
}

const BudgetLimitForm: React.FC<BudgetLimitFormProps> = ({
  categories,
  onSubmit,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState({
    categoryId: initialData?.categoryId || '',
    amount: initialData?.amount || 0,
    period: initialData?.period || 'monthly' as const,
    notifyAt: initialData?.notifyAt || 80
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validateField = (name: string, value: any) => {
    try {
      const partialData = { [name]: value };
      const partialSchema = budgetLimitSchema.pick({ [name]: true });
      partialSchema.parse(partialData);
      setErrors(prev => ({ ...prev, [name]: '' }));
      return true;
    } catch (error: any) {
      const message = error.errors?.[0]?.message || `Campo ${name} inválido`;
      setErrors(prev => ({ ...prev, [name]: message }));
      return false;
    }
  };

  const handleChange = (field: string, value: any) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    if (field === 'amount') {
      value = parseFloat(value) || 0;
    } else if (field === 'notifyAt') {
      value = parseInt(value) || 80;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = Object.keys(formData);
    const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
    setTouched(newTouched);

    try {
      // Validate all data
      const validatedData = budgetLimitSchema.parse(formData);

      // Additional validation
      if (!validatedData.categoryId) {
        throw new Error('Selecione uma categoria');
      }

      if (validatedData.amount <= 0) {
        throw new Error('O valor do limite deve ser maior que zero');
      }

      await onSubmit(validatedData);
    } catch (error: any) {
      console.error('Validation error:', error);
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      toast.error(error.message || 'Por favor, verifique os dados informados');
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Categoria
        </label>
        <select
          value={formData.categoryId}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          className={`w-full p-2 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            touched.categoryId && errors.categoryId ? 'border-red-500' : 'border-gray-700'
          }`}
          required
        >
          <option value="">Selecione uma categoria</option>
          {categories
            .filter(c => c.type === 'expense' || c.type === 'both')
            .map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          }
        </select>
        {touched.categoryId && errors.categoryId && (
          <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Limite
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="number"
            value={formData.amount || ''}
            onChange={(e) => handleChange('amount', e.target.value)}
            className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              touched.amount && errors.amount ? 'border-red-500' : 'border-gray-700'
            }`}
            placeholder="0,00"
            min="0.01"
            step="0.01"
            required
          />
        </div>
        {touched.amount && errors.amount ? (
          <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
        ) : formData.amount > 0 && (
          <p className="mt-1 text-sm text-gray-400">
            {formatCurrency(formData.amount)}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Período
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={formData.period}
            onChange={(e) => handleChange('period', e.target.value)}
            className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              touched.period && errors.period ? 'border-red-500' : 'border-gray-700'
            }`}
            required
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
        {touched.period && errors.period && (
          <p className="mt-1 text-sm text-red-500">{errors.period}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Notificar quando atingir
        </label>
        <div className="relative">
          <Bell className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={formData.notifyAt}
            onChange={(e) => handleChange('notifyAt', e.target.value)}
            className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              touched.notifyAt && errors.notifyAt ? 'border-red-500' : 'border-gray-700'
            }`}
            required
          >
            <option value="50">50% do limite</option>
            <option value="80">80% do limite</option>
            <option value="90">90% do limite</option>
            <option value="100">100% do limite</option>
          </select>
        </div>
        {touched.notifyAt && errors.notifyAt && (
          <p className="mt-1 text-sm text-red-500">{errors.notifyAt}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          {initialData ? 'Atualizar Limite' : 'Adicionar Limite'}
        </button>
      </div>
    </form>
  );
};

export default BudgetLimitForm;