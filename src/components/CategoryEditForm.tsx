import React, { useState } from 'react';
import { Category } from '../types';
import { Palette, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CategoryEditFormProps {
  category: Category;
  onSubmit: (category: Category) => void;
  onCancel: () => void;
}

const CategoryEditForm: React.FC<CategoryEditFormProps> = ({
  category,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<Category>(category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('O nome da categoria é obrigatório');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Nome da Categoria
        </label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ex: Alimentação"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Cor
        </label>
        <div className="relative">
          <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-full pl-10 pr-4 py-2 h-10 bg-white/5 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Tipo
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as Category['type'] })}
          className="w-full p-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="both">Receitas e Despesas</option>
          <option value="income">Apenas Receitas</option>
          <option value="expense">Apenas Despesas</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Ícone
        </label>
        <select
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          className="w-full p-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="tag">Tag</option>
          <option value="wallet">Carteira</option>
          <option value="briefcase">Maleta</option>
          <option value="shopping-cart">Carrinho</option>
          <option value="credit-card">Cartão</option>
          <option value="home">Casa</option>
          <option value="car">Carro</option>
          <option value="utensils">Talheres</option>
          <option value="heart">Coração</option>
          <option value="gift">Presente</option>
          <option value="book">Livro</option>
          <option value="music">Música</option>
          <option value="film">Filme</option>
          <option value="coffee">Café</option>
          <option value="phone">Telefone</option>
          <option value="wifi">Internet</option>
          <option value="file-text">Documento</option>
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
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Salvar Alterações
        </button>
      </div>
    </form>
  );
};

export default CategoryEditForm;