import React, { useState } from 'react';
import { NewReceivable, receivableSchema } from '../types';
import { DollarSign, Calendar, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReceivableFormProps {
  onSubmit: (receivable: NewReceivable) => void;
  onCancel: () => void;
  initialData?: Partial<NewReceivable>;
}

const ReceivableForm: React.FC<ReceivableFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<NewReceivable>({
    name: initialData?.name || '',
    amount: initialData?.amount || 0,
    dueDate: initialData?.dueDate || today,
    status: initialData?.status || 'pending',
    campaignId: initialData?.campaignId
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = receivableSchema.parse(formData);
      await onSubmit(validatedData);
    } catch (error: any) {
      console.error('Validation error:', error);
      if (error.errors) {
        const messages = error.errors.map((err: any) => err.message);
        toast.error(messages.join('\n'));
      } else {
        toast.error('Por favor, verifique os dados informados');
      }
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Nome/Descrição
        </label>
        <div className="relative">
          <FileText className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
            focusedField === 'name' ? 'text-purple-400' : 'text-gray-400'
          }`} />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-300 ${
              focusedField === 'name'
                ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            placeholder="Ex: Pagamento Cliente X"
            required
          />
        </div>
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
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            onFocus={() => setFocusedField('amount')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-300 ${
              focusedField === 'amount'
                ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            placeholder="0,00"
            min="0.01"
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
          Data de Recebimento
        </label>
        <div className="relative">
          <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
            focusedField === 'dueDate' ? 'text-purple-400' : 'text-gray-400'
          }`} />
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            onFocus={() => setFocusedField('dueDate')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white transition-all duration-300 ${
              focusedField === 'dueDate'
                ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            min={today}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'received' | 'overdue' })}
          onFocus={() => setFocusedField('status')}
          onBlur={() => setFocusedField(null)}
          className={`w-full p-2 bg-white/5 border rounded-lg text-white transition-all duration-300 ${
            focusedField === 'status'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
          required
        >
          <option value="pending">Pendente</option>
          <option value="received">Recebido</option>
          <option value="overdue">Atrasado</option>
        </select>
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
          {initialData ? 'Atualizar' : 'Adicionar'} Valor a Receber
        </button>
      </div>
    </form>
  );
};

export default ReceivableForm;