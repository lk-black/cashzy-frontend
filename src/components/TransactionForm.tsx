import React, { useState, useEffect } from 'react';
import { NewTransaction, transactionSchema, Category } from '../types';
import { toast } from 'react-hot-toast';
import { DollarSign, Calendar } from 'lucide-react';

interface TransactionFormProps {
  type: 'expense' | 'income';
  categories: Category[];
  onSubmit: (transaction: NewTransaction) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  type,
  categories,
  onSubmit,
  onCancel
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<NewTransaction>({
    type,
    amount: 0,
    description: '',
    categoryId: '',
    date: today
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Ensure amount is a valid number
      const validAmount = formData.amount || 0;
      
      // Format date to ISO string
      const date = new Date(formData.date);
      date.setHours(12); // Set to noon to avoid timezone issues
      const validDate = date.toISOString();
      
      const validatedData = transactionSchema.parse({
        ...formData,
        amount: validAmount,
        date: validDate
      });
      
      onSubmit(validatedData);
    } catch (error: any) {
      // Show specific validation errors
      if (error.errors) {
        const messages = error.errors.map((err: any) => err.message);
        toast.error(messages.join('\n'));
      } else {
        toast.error('Por favor, verifique os dados informados');
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value === '' ? 0 : parseFloat(value);
    
    if (!isNaN(numericValue) && numericValue >= 0) {
      setFormData(prev => ({
        ...prev,
        amount: numericValue
      }));
    }
  };

  // Filter categories based on type
  const filteredCategories = categories.filter(
    cat => cat.type === type || cat.type === 'both'
  );

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Descrição
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          onFocus={() => setFocusedField('description')}
          onBlur={() => setFocusedField(null)}
          className={`w-full p-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-300 ${
            focusedField === 'description'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
          placeholder={type === 'income' ? 'Ex: Freelance Website' : 'Ex: Compras Supermercado'}
          required
        />
      </div>

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
            value={formData.amount || ''}
            onChange={handleAmountChange}
            onFocus={() => setFocusedField('amount')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-300 ${
              focusedField === 'amount'
                ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            placeholder="0,00"
            min="0"
            step="0.01"
            required
          />
        </div>
        {formData.amount > 0 && (
          <p className="mt-1 text-sm text-gray-400">
            {formatCurrency(formData.amount)}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Categoria
        </label>
        <select
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          onFocus={() => setFocusedField('category')}
          onBlur={() => setFocusedField(null)}
          className={`w-full p-2 bg-white/5 border rounded-lg text-white transition-all duration-300 ${
            focusedField === 'category'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
          required
        >
          <option value="">Selecione uma categoria</option>
          {filteredCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
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
            max={today}
          />
        </div>
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
          className={`px-4 py-2 rounded-lg transition-colors ${
            type === 'income'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          Adicionar {type === 'income' ? 'Receita' : 'Despesa'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;