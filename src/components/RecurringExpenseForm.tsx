import React, { useState } from 'react';
import { NewRecurringExpense, recurringExpenseSchema } from '../types';
import { toast } from 'react-hot-toast';
import { DollarSign, Calendar, FileText, RepeatIcon } from 'lucide-react';

interface RecurringExpenseFormProps {
  onSubmit: (expense: NewRecurringExpense) => void;
  onCancel: () => void;
}

const RecurringExpenseForm: React.FC<RecurringExpenseFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<NewRecurringExpense>({
    name: '',
    amount: 0,
    type: 'ad',
    dayOfMonth: 1,
    description: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: any) => {
    try {
      // Create a partial schema for the specific field
      const partialData = { [name]: value };
      const partialSchema = recurringExpenseSchema.pick({ [name]: true });
      
      // Special handling for name field
      if (name === 'name' && (!value || !value.trim())) {
        throw new Error('O nome da despesa recorrente é obrigatório');
      }
      
      partialSchema.parse(partialData);
      setErrors(prev => ({ ...prev, [name]: '' }));
      return true;
    } catch (error: any) {
      const message = error.message || `Campo ${name} inválido`;
      setErrors(prev => ({ ...prev, [name]: message }));
      return false;
    }
  };

  const handleChange = (field: keyof NewRecurringExpense, value: any) => {
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));

    // Handle numeric fields
    if (field === 'amount') {
      value = parseFloat(value) || 0;
    } else if (field === 'dayOfMonth') {
      value = parseInt(value) || 1;
    } else if (field === 'name') {
      value = value.trim(); // Trim name field
    }

    // Update form data
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate the field
    validateField(field, value);
  };

  const handleBlur = (field: keyof NewRecurringExpense) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = Object.keys(formData) as Array<keyof NewRecurringExpense>;
    const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
    setTouched(newTouched);

    try {
      // Validate name field specifically
      const name = formData.name?.trim();
      if (!name) {
        setErrors(prev => ({ ...prev, name: 'O nome da despesa recorrente é obrigatório' }));
        throw new Error('O nome da despesa recorrente é obrigatório');
      }

      // Prepare data for validation
      const dataToValidate = {
        ...formData,
        name,
        amount: Number(formData.amount),
        dayOfMonth: Number(formData.dayOfMonth),
        description: formData.description?.trim()
      };

      // Validate all data
      const validatedData = recurringExpenseSchema.parse(dataToValidate);

      // Submit if validation passes
      await onSubmit(validatedData);
    } catch (error: any) {
      // Handle Zod validation errors
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
        
        // Show first error in toast
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Por favor, verifique os dados informados');
      }
      console.error('Validation error:', error);
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
          Nome da Despesa Recorrente
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              touched.name && errors.name ? 'border-red-500' : 'border-gray-700'
            }`}
            placeholder="Ex: Assinatura Adobe"
            required
          />
        </div>
        {touched.name && errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Valor Mensal
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="number"
            value={formData.amount || ''}
            onChange={(e) => handleChange('amount', e.target.value)}
            onBlur={() => handleBlur('amount')}
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
          Tipo de Despesa
        </label>
        <div className="relative">
          <RepeatIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            onBlur={() => handleBlur('type')}
            className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              touched.type && errors.type ? 'border-red-500' : 'border-gray-700'
            }`}
            required
          >
            <option value="ad">Anúncio</option>
            <option value="creative">Criativo</option>
            <option value="asset">Ativo</option>
          </select>
        </div>
        {touched.type && errors.type && (
          <p className="mt-1 text-sm text-red-500">{errors.type}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Dia do Mês para Cobrança
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="number"
            value={formData.dayOfMonth}
            onChange={(e) => handleChange('dayOfMonth', e.target.value)}
            onBlur={() => handleBlur('dayOfMonth')}
            className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              touched.dayOfMonth && errors.dayOfMonth ? 'border-red-500' : 'border-gray-700'
            }`}
            min="1"
            max="31"
            required
          />
        </div>
        {touched.dayOfMonth && errors.dayOfMonth && (
          <p className="mt-1 text-sm text-red-500">{errors.dayOfMonth}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Descrição (opcional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          className={`w-full p-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            touched.description && errors.description ? 'border-red-500' : 'border-gray-700'
          }`}
          rows={3}
          placeholder="Adicione uma descrição para esta despesa recorrente"
        />
        {touched.description && errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description}</p>
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
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Adicionar Despesa Recorrente
        </button>
      </div>
    </form>
  );
};

export default RecurringExpenseForm;