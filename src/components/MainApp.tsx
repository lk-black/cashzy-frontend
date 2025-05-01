import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
  useCampaigns,
  useExpenses,
  useTheme,
  useCategories,
  useTransactions,
  useRecurringExpenses,
  useBudgetLimits,
  usePinSecurity,
} from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import History from './CampaignList';
import CampaignForm from './CampaignForm';
import ExpenseForm from './ExpenseForm';
import TransactionForm from './TransactionForm';
import CategoryForm from './CategoryForm';
import ThemeToggle from './ThemeToggle';
import Goals from './Goals';
import Settings from './Settings';
import PinDialog from './PinDialog';
import { NewCampaign, Expense, NewTransaction, NewCategory } from '../types';
import {
  PlusCircle,
  X,
  DollarSign,
  Package,
  LayoutDashboard,
  LineChart,
  Trophy,
  Settings as SettingsIcon,
  User,
  LogOut,
  ChevronRight,
  Bell,
  Wallet,
  Tag,
  TrendingUp,
  TrendingDown,
  RepeatIcon,
  Menu,
} from 'lucide-react';

type FormType =
  | 'campaign'
  | 'ad'
  | 'asset'
  | 'expense'
  | 'income'
  | 'category'
  | null;
type Page = 'dashboard' | 'insights' | 'goals' | 'settings';

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-6 h-6" />,
    description: 'Visão geral das suas finanças',
  },
  {
    id: 'insights',
    label: 'Histórico',
    icon: <LineChart className="w-6 h-6" />,
    description: 'Histórico de transações',
  },
  {
    id: 'goals',
    label: 'Metas',
    icon: <Trophy className="w-6 h-6" />,
    description: 'Acompanhe seus objetivos',
  },
  {
    id: 'settings',
    label: 'Ajustes',
    icon: <SettingsIcon className="w-6 h-6" />,
    description: 'Configure sua conta',
  },
];

const tabGroups = [
  {
    title: 'Finanças',
    description: 'Gerencie suas receitas e despesas gerais',
    items: [
      {
        id: 'income' as const,
        label: 'Nova Receita',
        icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
        description: 'Registre uma nova receita',
        color: 'emerald',
      },
      {
        id: 'expense' as const,
        label: 'Nova Despesa',
        icon: <TrendingDown className="w-5 h-5 text-red-400" />,
        description: 'Registre uma nova despesa',
        color: 'red',
      },
      {
        id: 'category' as const,
        label: 'Nova Categoria',
        icon: <Tag className="w-5 h-5 text-amber-400" />,
        description: 'Crie uma nova categoria',
        color: 'amber',
      },
    ],
  },
  {
    title: 'Marketing',
    description: 'Gerencie suas campanhas e despesas de marketing',
    items: [
      {
        id: 'campaign' as const,
        label: 'Nova Campanha',
        icon: <PlusCircle className="w-5 h-5 text-emerald-400" />,
        description: 'Adicione uma nova campanha de marketing',
        color: 'emerald',
      },
      {
        id: 'ad' as const,
        label: 'Despesa com Anúncio',
        icon: <DollarSign className="w-5 h-5 text-blue-400" />,
        description: 'Registre gastos com anúncios',
        color: 'blue',
      },
      {
        id: 'asset' as const,
        label: 'Despesa com Ativo',
        icon: <Package className="w-5 h-5 text-orange-400" />,
        description: 'Registre gastos com ativos',
        color: 'orange',
      },
    ],
  },
];

const MainApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { isDark, setIsDark } = useTheme();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormType>(null);
  const [campaigns, setCampaigns] = useCampaigns();
  const [expenses, setExpenses] = useExpenses();
  const { categories, addCategory } = useCategories();
  const [transactions, setTransactions] = useTransactions();
  const { recurringExpenses, setRecurringExpenses, toggleRecurringExpense, deleteRecurringExpense } = useRecurringExpenses();
  const { budgetLimits, addBudgetLimit } = useBudgetLimits();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [notifications] = useState([
    { id: 1, title: 'Nova conquista desbloqueada!', time: '5min' },
    { id: 2, title: 'Meta mensal atingida', time: '1h' },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { pin, isLocked, verifyPin, lockApp, hasLockout, remainingAttempts } = usePinSecurity();
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsNavVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handlePinSubmit = (enteredPin: string) => {
    if (!pin) return true;

    const isValid = verifyPin(enteredPin);
    if (!isValid) {
      setPinError('PIN incorreto');
    } else {
      setPinError(null);
    }
  };

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (pin) {
        inactivityTimer = setTimeout(lockApp, 5 * 60 * 1000);
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [pin, lockApp]);

  const handleNewCampaign = useCallback(
    async (newCampaign: NewCampaign) => {
      try {
        await setCampaigns(newCampaign);
        setIsPanelOpen(false);
        setSelectedForm(null);
      } catch (error: any) {
        console.error('Error submitting campaign:', error);
        throw error;
      }
    },
    [setCampaigns]
  );

  const handleNewExpense = useCallback(
    async (newExpense: Omit<Expense, 'id'>) => {
      try {
        await setExpenses(newExpense);
        setIsPanelOpen(false);
        setSelectedForm(null);
      } catch (error: any) {
        console.error('Error submitting expense:', error);
        throw error;
      }
    },
    [setExpenses]
  );

  const handleNewTransaction = useCallback(
    async (newTransaction: NewTransaction) => {
      try {
        await setTransactions(newTransaction);
        setIsPanelOpen(false);
        setSelectedForm(null);
      } catch (error: any) {
        console.error('Error submitting transaction:', error);
        throw error;
      }
    },
    [setTransactions]
  );

  const handleNewCategory = useCallback(
    async (newCategory: NewCategory) => {
      try {
        await addCategory(newCategory);
        setIsPanelOpen(false);
        setSelectedForm(null);
      } catch (error: any) {
        console.error('Error submitting category:', error);
        throw error;
      }
    },
    [addCategory]
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const handleToggleRecurring = useCallback(async (id: string) => {
    try {
      await toggleRecurringExpense(id);
    } catch (error) {
      console.error('Error toggling recurring expense:', error);
      toast.error('Erro ao atualizar despesa recorrente');
    }
  }, [toggleRecurringExpense]);

  const handleDeleteRecurring = useCallback(async (id: string) => {
    try {
      await deleteRecurringExpense(id);
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      toast.error('Erro ao excluir despesa recorrente');
    }
  }, [deleteRecurringExpense]);

  const metrics = useMemo(() => {
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const totalRevenue = campaigns.reduce((acc, camp) => acc + camp.revenue, 0);
    const adExpenses = expenses
      .filter((e) => e.type === 'ad')
      .reduce((acc, exp) => acc + exp.amount, 0);
    const assetsCost =
      campaigns.reduce((acc, camp) => acc + camp.assetsCost, 0) +
      expenses
        .filter((e) => e.type === 'asset')
        .reduce((acc, exp) => acc + exp.amount, 0);

    return {
      totalSpend: totalExpenses,
      totalRevenue,
      roi: adExpenses > 0 ? totalRevenue / adExpenses - 1 : 0,
      assetsCost,
      currentBalance: totalRevenue - totalExpenses,
      recurringExpenses: {
        total: recurringExpenses.reduce(
          (acc, exp) => (exp.isActive ? acc + exp.amount : acc),
          0
        ),
        nextDue: recurringExpenses.filter((exp) => exp.isActive),
      },
    };
  }, [campaigns, expenses, recurringExpenses]);

  const monthlyMetrics = useMemo(() => {
    const monthlyData = new Map<
      string,
      {
        month: string;
        year: number;
        revenue: number;
        expenses: number;
        balance: number;
      }
    >();

    campaigns.forEach((campaign) => {
      const date = new Date(campaign.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          year: date.getFullYear(),
          revenue: 0,
          expenses: 0,
          balance: 0,
        });
      }

      const monthData = monthlyData.get(monthKey)!;
      monthData.revenue += campaign.revenue;
      monthData.expenses +=
        campaign.adSpend + campaign.assetsCost;
      monthData.balance = monthData.revenue - monthData.expenses;
    });

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          year: date.getFullYear(),
          revenue: 0,
          expenses: 0,
          balance: 0,
        });
      }

      const monthData = monthlyData.get(monthKey)!;
      monthData.expenses += expense.amount;
      monthData.balance = monthData.revenue - monthData.expenses;
    });

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          year: date.getFullYear(),
          revenue: 0,
          expenses: 0,
          balance: 0,
        });
      }

      const monthData = monthlyData.get(monthKey)!;
      if (transaction.type === 'income') {
        monthData.revenue += transaction.amount;
      } else {
        monthData.expenses += transaction.amount;
      }
      monthData.balance = monthData.revenue - monthData.expenses;
    });

    return Array.from(monthlyData.values());
  }, [campaigns, expenses, transactions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.user-menu') &&
        !target.closest('.notifications-menu')
      ) {
        setIsUserMenuOpen(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white transition-colors">
      <Toaster position="top-right" />

      <PinDialog
        isOpen={isLocked}
        onClose={() => {}}
        onSubmit={handlePinSubmit}
        title="Digite seu PIN"
        description="Digite seu PIN de 4 dígitos para desbloquear o aplicativo"
        error={pinError}
        remainingAttempts={remainingAttempts}
      />

      {!isLocked && (
        <>
          <nav className={`fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-b border-white/10 z-50 transition-transform duration-300 ${
            isNavVisible ? 'translate-y-0' : '-translate-y-full'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors lg:hidden"
                  >
                    <Menu className="w-5 h-5 text-gray-400" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="hidden lg:flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <img
                        src="/logobranca.png"
                        alt="Cashzy"
                        className="h-8 w-auto transition-transform duration-300"
                      />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ThemeToggle
                    isDark={isDark}
                    onToggle={() => setIsDark(!isDark)}
                  />

                  <div className="relative notifications-menu">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors relative"
                    >
                      <Bell className="w-5 h-5 text-gray-400" />
                      {notifications.length > 0 && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      )}
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] rounded-lg shadow-lg border border-white/10 py-1 animate-fade-in">
                        <div className="px-4 py-2 border-b border-white/10">
                          <h3 className="font-medium text-white">
                            Notificações
                          </h3>
                        </div>
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 animate-pulse" />
                              <div>
                                <p className="text-sm text-white">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {notification.time} atrás
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative user-menu">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-sm font-medium">{user?.name || 'Usuário'}</span>
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] rounded-lg shadow-lg border border-white/10 py-1 animate-fade-in">
                        <div className="px-4 py-2 border-b border-white/10">
                          <p className="text-sm font-medium">{user?.name || 'Usuário'}</p>
                          <p className="text-xs text-gray-400">
                            {user?.email || 'usuario@email.com'}
                          </p>
                        </div>
                        <div className="px-4 py-2 border-b border-white/10">
                          <p className="text-xs text-gray-400">Pontos</p>
                          <p className="text-sm font-medium">1,250</p>
                        </div>
                        <button
                          onClick={() => {
                            setCurrentPage('settings');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          Configurações
                        </button>
                        <button 
                          onClick={handleSignOut}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                        >
                          Sair
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className={`hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-white/10 backdrop-blur-lg border-r border-white/10 transform transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="w-full py-6">
              <div className="space-y-2 px-3">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as Page)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative overflow-hidden group ${
                      currentPage === item.id
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-3 transition-transform duration-300 ${
                        hoveredItem === item.id
                          ? '-translate-x-2'
                          : 'translate-x-0'
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight
                      className={`absolute right-4 opacity-0 transition-all duration-300 ${
                        hoveredItem === item.id
                          ? 'opacity-100 translate-x-0'
                          : 'translate-x-4'
                      }`}
                    />
                    {hoveredItem === item.id && (
                      <div className="absolute left-0 right-0 -bottom-8 px-4 py-1 bg-gray-900/80 backdrop-blur-sm text-xs text-gray-400 transform translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                        {item.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="px-3 mt-8">
                <button
                  onClick={() => setIsPanelOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-400 bg-purple-500/20 hover:bg-purple-500/30 transition-colors hover:scale-105 transform duration-200"
                >
                  <PlusCircle className="w-6 h-6" />
                  <span className="font-medium">Adicionar</span>
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all cursor-pointer group">
                  <h4 className="text-sm font-medium text-purple-400 mb-1 group-hover:text-purple-300">
                    Dica do Dia
                  </h4>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300">
                    Configure metas financeiras para acompanhar melhor seus
                    objetivos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {currentPage === 'dashboard' ? (
                <Dashboard
                  metrics={metrics}
                  monthlyMetrics={monthlyMetrics}
                  campaigns={campaigns}
                  expenses={expenses}
                  transactions={transactions}
                  recurringExpenses={recurringExpenses}
                  budgetLimits={budgetLimits}
                  categories={categories}
                  onToggleRecurring={handleToggleRecurring}
                  onDeleteRecurring={handleDeleteRecurring}
                />
              ) : currentPage === 'insights' ? (
                <History
                  campaigns={campaigns}
                  expenses={expenses}
                  transactions={transactions}
                />
              ) : currentPage === 'goals' ? (
                <Goals campaigns={campaigns} expenses={expenses} />
              ) : (
                <Settings />
              )}
            </div>
          </main>

          <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/10 backdrop-blur-lg border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-around items-center py-3">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as Page)}
                    className={`flex flex-col items-center space-y-1 ${
                      currentPage === item.id
                        ? 'text-purple-400'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}

                <button
                  onClick={() => setIsPanelOpen(true)}
                  className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 hover:scale-110 transform duration-200"
                  aria-label="Adicionar"
                >
                  <PlusCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
          </nav>

          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-50 ${
              isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => {
              setIsPanelOpen(false);
              setSelectedForm(null);
            }}
          />
          <div
            className={`fixed inset-y-0 right-0 w-full max-w-xl bg-gradient-to-br from-purple-900 via-gray-900 to-black shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
              isPanelOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Adicionar</h2>
                <button
                  onClick={() => {
                    setIsPanelOpen(false);
                    setSelectedForm(null);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto hide-scrollbar">
                <div className="p-6 space-y-8">
                  {tabGroups.map((group, index) => (
                    <div key={group.title} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {group.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {group.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {group.items.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setSelectedForm(tab.id)}
                            className={`group relative overflow-hidden rounded-xl border transition-all hover:scale-[1.02] transform duration-200 ${
                              selectedForm === tab.id
                                ? `bg-${tab.color}-500/20 border-${tab.color}-500/50 shadow-lg shadow-${tab.color}-500/10`
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity duration-300 ${
                                selectedForm === tab.id
                                  ? `from-${tab.color}-500/20 via-${tab.color}-400/10 to-transparent`
                                  : 'from-transparent to-transparent group-hover:from-white/10'
                              }`}
                            />

                            <div className="relative p-4">
                              <div className="flex flex-col items-center gap-3 text-center">
                                <div
                                  className={`p-3 rounded-lg transition-all duration-300 transform group-hover:scale-110 ${
                                    selectedForm === tab.id
                                      ? `bg-${tab.color}-500/20`
                                      : 'bg-white/5'
                                  }`}
                                >
                                  {tab.icon}
                                </div>
                                <div>
                                  <span className="font-medium block mb-1">
                                    {tab.label}
                                  </span>
                                  <span className="text-sm text-gray-400 line-clamp-2">
                                    {tab.description}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div
                              className={`absolute inset-0 border border-white/20 rounded-xl transition-opacity duration-300 ${
                                selectedForm === tab.id
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-50'
                              }`}
                              style={{
                                background:
                                  'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                                backgroundSize: '200% 200%',
                                animation:
                                  selectedForm === tab.id
                                    ? 'gradient-shift 2s ease infinite'
                                    : 'none',
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div
                    className={`mt-8 transition-all duration-300 ${
                      selectedForm
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4'
                    }`}
                  >
                    {selectedForm === 'campaign' && (
                      <CampaignForm onSubmit={handleNewCampaign} />
                    )}
                    {(selectedForm === 'ad' ||
                      selectedForm === 'asset') && (
                      <ExpenseForm
                        type={selectedForm}
                        onSubmit={handleNewExpense}
                      />
                    )}
                    {(selectedForm === 'expense' ||
                      selectedForm === 'income') && (
                      <TransactionForm
                        type={selectedForm}
                        categories={categories}
                        onSubmit={handleNewTransaction}
                        onCancel={() => setSelectedForm(null)}
                      />
                    )}
                    {selectedForm === 'category' && (
                      <CategoryForm
                        onSubmit={handleNewCategory}
                        onCancel={() => setSelectedForm(null)}
                      />
                    )}
                    {!selectedForm && (
                      <div className="text-center text-gray-400 py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <PlusCircle className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-lg font-medium mb-2">
                          Selecione uma opção
                        </p>
                        <p className="text-sm text-gray-500">
                          Escolha uma das opções acima para começar a adicionar
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MainApp;