import React, { useState, useEffect } from 'react';
import { NewCampaign } from '../types';
import { DollarSign, TrendingUp, Package, Calculator } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CampaignFormProps {
  onSubmit: (campaign: NewCampaign) => void;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ onSubmit }) => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<NewCampaign>({
    name: '',
    platform: '',
    date: today,
    adSpend: 0,
    revenue: 0,
    assetsCost: 0,
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [roi, setRoi] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);

  useEffect(() => {
    // Calculate total cost and ROI whenever form data changes
    const total = Number(formData.adSpend || 0) + 
                 Number(formData.assetsCost || 0);
    setTotalCost(total);
    setRoi(total > 0 ? ((Number(formData.revenue || 0) / total) - 1) * 100 : 0);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        toast.error('Nome da campanha é obrigatório');
        return;
      }
      if (!formData.platform?.trim()) {
        toast.error('Plataforma é obrigatória');
        return;
      }

      // Convert string values to numbers and ensure they're valid
      const campaign: NewCampaign = {
        name: formData.name.trim(),
        platform: formData.platform.trim(),
        date: new Date(formData.date).toISOString(), // Convert to ISO string
        adSpend: Number(formData.adSpend) || 0,
        revenue: Number(formData.revenue) || 0,
        assetsCost: Number(formData.assetsCost) || 0
      };

      await onSubmit(campaign);

      // Reset form
      setFormData({
        name: '',
        platform: '',
        date: today,
        adSpend: 0,
        revenue: 0,
        assetsCost: 0,
      });
    } catch (error: any) {
      console.error('Error submitting campaign:', error);
      toast.error(error.message || 'Erro ao adicionar campanha');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // For numeric fields, ensure we store valid numbers
    if (['adSpend', 'revenue', 'assetsCost'].includes(name)) {
      const numValue = value === '' ? 0 : Number(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData(prev => ({
          ...prev,
          [name]: numValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const formatCurrency = (value: number): string => {
    // Ensure value is a valid number
    if (typeof value !== 'number' || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nome da Campanha
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            className={`w-full p-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-300 ${
              focusedField === 'name'
                ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            placeholder="Ex: Black Friday 2025"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Plataforma
          </label>
          <select
            name="platform"
            value={formData.platform}
            onChange={handleChange}
            onFocus={() => setFocusedField('platform')}
            onBlur={() => setFocusedField(null)}
            className={`w-full p-2 bg-white/5 border rounded-lg text-white transition-all duration-300 ${
              focusedField === 'platform'
                ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            required
          >
            <option value="">Selecione uma plataforma</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Google Ads">Google Ads</option>
            <option value="TikTok Ads">TikTok Ads</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Gasto em Anúncios
            </label>
            <div className="relative group">
              <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                focusedField === 'adSpend' ? 'text-purple-400' : 'text-gray-400'
              }`} />
              <input
                type="number"
                name="adSpend"
                value={formData.adSpend || ''}
                onChange={handleChange}
                onFocus={() => setFocusedField('adSpend')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-300 ${
                  focusedField === 'adSpend'
                    ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="0,00"
                min="0"
                step="0.01"
              />
            </div>
            {formData.adSpend > 0 && (
              <p className="mt-1 text-sm text-gray-400">
                {formatCurrency(formData.adSpend)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Receita
            </label>
            <div className="relative group">
              <TrendingUp className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                focusedField === 'revenue' ? 'text-purple-400' : 'text-gray-400'
              }`} />
              <input
                type="number"
                name="revenue"
                value={formData.revenue || ''}
                onChange={handleChange}
                onFocus={() => setFocusedField('revenue')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-300 ${
                  focusedField === 'revenue'
                    ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="0,00"
                min="0"
                step="0.01"
              />
            </div>
            {formData.revenue > 0 && (
              <p className="mt-1 text-sm text-gray-400">
                {formatCurrency(formData.revenue)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Custos com Ativos
            </label>
            <div className="relative group">
              <Package className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                focusedField === 'assetsCost' ? 'text-purple-400' : 'text-gray-400'
              }`} />
              <input
                type="number"
                name="assetsCost"
                value={formData.assetsCost || ''}
                onChange={handleChange}
                onFocus={() => setFocusedField('assetsCost')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-400 transition-all duration-300 ${
                  focusedField === 'assetsCost'
                    ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                placeholder="0,00"
                min="0"
                step="0.01"
              />
            </div>
            {formData.assetsCost > 0 && (
              <p className="mt-1 text-sm text-gray-400">
                {formatCurrency(formData.assetsCost)}
              </p>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-medium text-white">Resumo da Campanha</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Custo Total</p>
              <p className="text-lg font-medium text-white">{formatCurrency(totalCost)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">ROI Esperado</p>
              <p className={`text-lg font-medium ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {roi.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                roi >= 0 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(Math.max((roi + 100) / 3, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] transform duration-200"
      >
        <span className="transform group-hover:scale-105 transition-transform">
          Adicionar Campanha
        </span>
      </button>
    </form>
  );
};

export default CampaignForm;