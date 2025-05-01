import React, { useState } from 'react';
import { 
  RepeatIcon, Tags, CreditCard, PieChart, Lock, Bell, 
  Award, Trophy, MessageSquare, HelpCircle, Plus, X,
  Check, ChevronRight, AlertTriangle, ArrowLeft, Edit2, Trash2,
  DollarSign, Wallet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRecurringExpenses, useCategories, useBudgetLimits, usePinSecurity, useReceivables } from '../lib/hooks';
import RecurringExpenseForm from './RecurringExpenseForm';
import RecurringExpensesList from './RecurringExpensesList';
import CategoryEditForm from './CategoryEditForm';
import BudgetLimitForm from './BudgetLimitForm';
import BudgetLimitsList from './BudgetLimitsList';
import PinDialog from './PinDialog';
import ReceivableForm from './ReceivableForm';
import ReceivablesList from './ReceivablesList';
import { NewRecurringExpense, Category, BudgetLimit, NewCategory } from '../types';

interface SettingsOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const settingsOptions: SettingsOption[] = [
  {
    id: 'recurring',
    title: 'Despesas Recorrentes',
    description: 'Configure suas despesas mensais fixas',
    icon: <RepeatIcon className="w-5 h-5" />,
    color: 'purple'
  },
  {
    id: 'categories',
    title: 'Categorias Personalizadas',
    description: 'Crie e gerencie suas categorias',
    icon: <Tags className="w-5 h-5" />,
    color: 'emerald'
  },
  {
    id: 'receivables',
    title: 'Dinheiro a Receber',
    description: 'Gerencie seus valores a receber',
    icon: <Wallet className="w-5 h-5" />,
    color: 'amber'
  },
  {
    id: 'bank',
    title: 'Contas Bancárias',
    description: 'Conecte suas contas bancárias',
    icon: <CreditCard className="w-5 h-5" />,
    color: 'blue'
  },
  {
    id: 'budget',
    title: 'Controle de Orçamento',
    description: 'Defina limites de gastos por categoria',
    icon: <PieChart className="w-5 h-5" />,
    color: 'amber'
  },
  {
    id: 'pin',
    title: 'PIN de Segurança',
    description: 'Configure um PIN para o aplicativo',
    icon: <Lock className="w-5 h-5" />,
    color: 'red'
  },
  {
    id: 'notifications',
    title: 'Notificações',
    description: 'Gerencie suas notificações',
    icon: <Bell className="w-5 h-5" />,
    color: 'indigo'
  },
  {
    id: 'points',
    title: 'Consulta de Pontos',
    description: 'Veja seu histórico de pontos',
    icon: <Award className="w-5 h-5" />,
    color: 'yellow'
  },
  {
    id: 'achievements',
    title: 'Histórico de Conquistas',
    description: 'Acompanhe suas conquistas',
    icon: <Trophy className="w-5 h-5" />,
    color: 'orange'
  },
  {
    id: 'feedback',
    title: 'Feedback',
    description: 'Envie suas sugestões e comentários',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'teal'
  },
  {
    id: 'help',
    title: 'FAQ e Tutoriais',
    description: 'Tire suas dúvidas e aprenda mais',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'cyan'
  }
];

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showReceivableForm, setShowReceivableForm] = useState(false);
  const { recurringExpenses, setRecurringExpenses } = useRecurringExpenses();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { budgetLimits, addBudgetLimit, updateBudgetLimit, deleteBudgetLimit } = useBudgetLimits();
  const { receivables, addReceivable, updateReceivableStatus, deleteReceivable } = useReceivables();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBudgetLimit, setEditingBudgetLimit] = useState<BudgetLimit | null>(null);
  const [points] = useState(1250);
  const [achievements] = useState(15);
  const { pin, setSecurityPin } = usePinSecurity();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinAction, setPinAction] = useState<'set' | 'change' | 'remove'>('set');
  const [currentPin, setCurrentPin] = useState<string | null>(null);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const handleAddRecurringExpense = (expense: NewRecurringExpense) => {
    setRecurringExpenses(expense);
    setShowRecurringForm(false);
    toast.success('Despesa recorrente adicionada');
  };

  const handleToggleRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.map(exp => 
      exp.id === id ? { ...exp, isActive: !exp.isActive } : exp
    ));
    toast.success('Status da despesa atualizado');
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.filter(exp => exp.id !== id));
    toast.success('Despesa recorrente removida');
  };

  const handleAddCategory = async () => {
    const newCategory: NewCategory = {
      name: 'Nova Categoria',
      color: '#6366f1',
      icon: 'tag',
      type: 'both'
    };

    try {
      await addCategory(newCategory);
      setEditingCategory(null);
      toast.success('Categoria adicionada');
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error(error.message || 'Erro ao adicionar categoria');
    }
  };

  const handleEditCategory = async (category: Category) => {
    try {
      await updateCategory(category.id, category);
      setEditingCategory(null);
      toast.success('Categoria atualizada');
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast.error(error.message || 'Erro ao atualizar categoria');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success('Categoria removida');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Erro ao remover categoria');
    }
  };

  const handleAddBudgetLimit = async (limit: Omit<BudgetLimit, 'id' | 'createdAt'>) => {
    try {
      await addBudgetLimit(limit);
      setShowBudgetForm(false);
      toast.success('Limite de orçamento adicionado');
    } catch (error: any) {
      console.error('Error adding budget limit:', error);
      toast.error(error.message || 'Erro ao adicionar limite de orçamento');
    }
  };

  const handleEditBudgetLimit = async (limit: BudgetLimit) => {
    try {
      await updateBudgetLimit(limit.id, limit);
      setEditingBudgetLimit(null);
      toast.success('Limite de orçamento atualizado');
    } catch (error: any) {
      console.error('Error updating budget limit:', error);
      toast.error(error.message || 'Erro ao atualizar limite de orçamento');
    }
  };

  const handleDeleteBudgetLimit = async (id: string) => {
    try {
      await deleteBudgetLimit(id);
      toast.success('Limite de orçamento removido');
    } catch (error: any) {
      console.error('Error deleting budget limit:', error);
      toast.error(error.message || 'Erro ao remover limite de orçamento');
    }
  };

  const handlePinSubmit = (enteredPin: string) => {
    if (pinAction === 'set') {
      if (!currentPin) {
        setCurrentPin(enteredPin);
        setPinError(null);
        toast.success('Digite o PIN novamente para confirmar');
      } else {
        if (enteredPin === currentPin) {
          setSecurityPin(enteredPin);
          setShowPinDialog(false);
          setCurrentPin(null);
          setPinError(null);
          toast.success('PIN configurado com sucesso');
        } else {
          setPinError('Os PINs não coincidem');
          setCurrentPin(null);
        }
      }
    } else if (pinAction === 'change') {
      if (!currentPin) {
        if (enteredPin === pin) {
          setCurrentPin('verified');
          setPinError(null);
          toast.success('Digite o novo PIN');
        } else {
          setPinError('PIN atual incorreto');
        }
      } else if (currentPin === 'verified') {
        setCurrentPin(enteredPin);
        setPinError(null);
        toast.success('Digite o novo PIN novamente para confirmar');
      } else {
        if (enteredPin === currentPin) {
          setSecurityPin(enteredPin);
          setShowPinDialog(false);
          setCurrentPin(null);
          setPinError(null);
          toast.success('PIN atualizado com sucesso');
        } else {
          setPinError('Os PINs não coincidem');
          setCurrentPin('verified');
        }
      }
    } else if (pinAction === 'remove') {
      if (enteredPin === pin) {
        setSecurityPin(null);
        setShowPinDialog(false);
        setPinError(null);
        toast.success('PIN removido com sucesso');
      } else {
        setPinError('PIN incorreto');
      }
    }
  };

  const handleSetPin = () => {
    setPinAction('set');
    setCurrentPin(null);
    setPinError(null);
    setShowPinDialog(true);
  };

  const handleChangePin = () => {
    setPinAction('change');
    setCurrentPin(null);
    setPinError(null);
    setShowPinDialog(true);
  };

  const handleRemovePin = () => {
    setPinAction('remove');
    setCurrentPin(null);
    setPinError(null);
    setShowPinDialog(true);
  };

  const getColorClasses = (color: string) => ({
    icon: `text-${color}-400`,
    bg: `bg-${color}-500/20`,
    border: `border-${color}-500/30`,
    hover: `hover:border-${color}-500/30 hover:bg-${color}-500/5`
  });

  const renderSectionContent = (sectionId: string) => {
    const option = settingsOptions.find(opt => opt.id === sectionId);
    if (!option) return null;

    const colors = getColorClasses(option.color);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveSection(null)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-white">{option.title}</h3>
            <p className="text-gray-400">{option.description}</p>
          </div>
        </div>

        {/* Section specific content */}
        {sectionId === 'recurring' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Despesas Recorrentes</h3>
              <button
                onClick={() => setShowRecurringForm(true)}
                className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
              >
                <Plus className="w-5 h-5 text-purple-400" />
              </button>
            </div>

            {showRecurringForm ? (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <RecurringExpenseForm
                  onSubmit={handleAddRecurringExpense}
                  onCancel={() => setShowRecurringForm(false)}
                />
              </div>
            ) : (
              <RecurringExpensesList
                expenses={recurringExpenses}
                onToggle={handleToggleRecurring}
                onDelete={handleDeleteRecurring}
              />
            )}
          </div>
        )}

        {sectionId === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Categorias</h3>
              <button
                onClick={handleAddCategory}
                className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
              >
                <Plus className="w-5 h-5 text-emerald-400" />
              </button>
            </div>
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Tags className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-gray-400">Nenhuma categoria personalizada</p>
                <button
                  onClick={handleAddCategory}
                  className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                >
                  Adicionar Categoria
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-emerald-500/30 transition-all"
                  >
                    {editingCategory?.id === category.id ? (
                      <CategoryEditForm
                        category={category}
                        onSubmit={handleEditCategory}
                        onCancel={() => setEditingCategory(null)}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: category.color + '33' }}
                          >
                            <Tags className="w-5 h-5" style={{ color: category.color }} />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{category.name}</h4>
                            <p className="text-sm text-gray-400">
                              {category.type === 'both' 
                                ? 'Receitas e Despesas'
                                : category.type === 'income'
                                ? 'Apenas Receitas'
                                : 'Apenas Despesas'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {sectionId === 'receivables' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Valores a Receber</h3>
              <button
                onClick={() => setShowReceivableForm(true)}
                className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
              >
                <Plus className="w-5 h-5 text-amber-400" />
              </button>
            </div>

            {showReceivableForm ? (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <ReceivableForm
                  onSubmit={async (receivable) => {
                    await addReceivable(receivable);
                    setShowReceivableForm(false);
                  }}
                  onCancel={() => setShowReceivableForm(false)}
                />
              </div>
            ) : (
              <ReceivablesList
                receivables={receivables}
                onUpdateStatus={updateReceivableStatus}
                onDelete={deleteReceivable}
              />
            )}
          </div>
        )}

        {sectionId === 'budget' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Limites de Orçamento</h3>
              <button
                onClick={() => setShowBudgetForm(true)}
                className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
              >
                <Plus className="w-5 h-5 text-amber-400" />
              </button>
            </div>

            {showBudgetForm ? (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <BudgetLimitForm
                  categories={categories}
                  onSubmit={handleAddBudgetLimit}
                  onCancel={() => setShowBudgetForm(false)}
                />
              </div>
            ) : (
              <BudgetLimitsList
                limits={budgetLimits}
                categories={categories}
                onDelete={handleDeleteBudgetLimit}
                onEdit={setEditingBudgetLimit}
              />
            )}

            {/* Budget Insights */}
            {budgetLimits.length > 0 && (
              <div className="mt-8 bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Insights de Orçamento</h4>
                    <p className="text-sm text-gray-400">
                      {budgetLimits.length} limite{budgetLimits.length !== 1 ? 's' : ''} definido{budgetLimits.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {budgetLimits.map(limit => {
                    const category = categories.find(c => c.id === limit.categoryId);
                    if (!category) return null;

                    return (
                      <div key={limit.id} className="flex items-center gap-4">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-300">{category.name}</span>
                            <span className="text-sm text-gray-400">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(limit.amount)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{ width: '30%' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {sectionId === 'pin' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-red-500/20">
                  <Lock className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">PIN de Segurança</h3>
                  <p className="text-sm text-gray-400">
                    {pin
                      ? 'Seu PIN está configurado e ativo'
                      : 'Configure um PIN para proteger seu acesso'}
                  </p>
                </div>
              </div>

              {pin ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-5 h-5" />
                    <span>PIN configurado</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleChangePin}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Alterar PIN
                    </button>
                    <button
                      onClick={handleRemovePin}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Remover PIN
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSetPin}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Configurar PIN
                </button>
              )}
            </div>

            <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-200 font-medium mb-1">Importante</p>
                  <p className="text-amber-100/80">
                    O PIN de segurança protege seu acesso ao aplicativo. Após configurado,
                    ele será solicitado ao abrir o app e após 5 minutos de inatividade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getGridItems = () => {
    const items = [];
    let expandedIndex = -1;

    settingsOptions.forEach((option, index) => {
      if (option.id === activeSection) {
        expandedIndex = index;
      }
    });

    settingsOptions.forEach((option, index) => {
      const colors = getColorClasses(option.color);
      const isActive = activeSection === option.id;
      
      items.push(
        <div key={option.id} className={`relative ${isActive ? 'col-span-full lg:col-span-2' : ''}`}>
          <button
            onClick={() => setActiveSection(isActive ? null : option.id)}
            className={`group w-full bg-[#1a1a1a] rounded-xl p-6 border transition-all text-left ${
              isActive
                ? `${colors.border} ${colors.bg}`
                : `border-white/10 ${colors.hover}`
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${colors.bg} transition-transform group-hover:scale-110`}>
                {React.cloneElement(option.icon as React.ReactElement, {
                  className: `w-5 h-5 ${colors.icon}`
                })}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        </div>
      );

      if (isActive) {
        items.push(
          <div 
            key={`${option.id}-content`}
            className="col-span-full bg-[#1a1a1a] rounded-xl border border-white/10 animate-fade-in"
          >
            <div className="p-6 lg:p-10">
              {renderSectionContent(option.id)}
            </div>
          </div>
        );
      }
    });

    return items;
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 p-6 mb-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1000&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-white mb-2">Configurações</h2>
          <p className="text-purple-200">Personalize sua experiência no Cashzy</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[90%] mx-auto">
        {getGridItems()}
      </div>

      {/* PIN Dialog */}
      <PinDialog
        isOpen={showPinDialog}
        onClose={() => {
          setShowPinDialog(false);
          setCurrentPin(null);
          setPinError(null);
        }}
        onSubmit={handlePinSubmit}
        title={
          pinAction === 'set'
            ? !currentPin
              ? 'Digite o PIN'
              : 'Confirme o PIN'
            : pinAction === 'change'
            ? !currentPin
              ? 'Digite o PIN atual'
              : currentPin === 'verified'
              ? 'Digite o novo PIN'
              : 'Confirme o novo PIN'
            : 'Digite seu PIN para remover'
        }
        description={
          pinAction === 'set'
            ? 'Configure um PIN de 4 dígitos para proteger seu acesso'
            : pinAction === 'change'
            ? 'Altere seu PIN de segurança'
            : 'Digite seu PIN atual para removê-lo'
        }
        error={pinError}
      />
    </div>
  );
};

export default Settings;