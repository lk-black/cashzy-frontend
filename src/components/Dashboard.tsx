import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, UserX, Calendar, Mail, Search, RefreshCw, Ban, CheckCircle,
  PlusCircle, Coins, Calendar as CalendarIcon, Bell, AlertTriangle, Medal, Crown, Rocket,
  ChevronDown, ChevronUp, PiggyBank, Wallet, LineChart, BarChart3, Coins as CoinsIcon,
  Bell as BellIcon, Repeat, Tag, FileText, Briefcase, Calculator, DollarSign, TrendingUp,
  TrendingDown, RepeatIcon, Target
} from 'lucide-react';
import { Campaign, Expense, RecurringExpense, Category, BudgetLimit, Transaction } from '../types';
import Insights from './Insights';
import RecurringExpensesList from './RecurringExpensesList';
import { useReceivables } from '../lib/hooks';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  valueColor?: string;
  isNegative?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  valueColor = 'text-white',
  isNegative = false,
}) => {
  // Determine font size based on value length
  const getFontSize = (value: string) => {
    const length = value.length;
    if (length > 20) return 'text-sm';
    if (length > 15) return 'text-base';
    if (length > 12) return 'text-lg';
    return 'text-xl';
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-900 rounded-lg flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-gray-400">{title}</div>
          <div className={`font-medium ${valueColor} ${getFontSize(value)} break-all`}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

interface DashboardProps {
  metrics: DashboardMetrics;
  monthlyMetrics: MonthlyMetrics[];
  campaigns: Campaign[];
  expenses: Expense[];
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
  budgetLimits: BudgetLimit[];
  categories: Category[];
  onToggleRecurring: (id: string) => void;
  onDeleteRecurring: (id: string) => void;
}

interface DashboardMetrics {
  totalSpend: number;
  totalRevenue: number;
  roi: number;
  assetsCost: number;
  currentBalance: number;
  recurringExpenses: {
    total: number;
    nextDue: RecurringExpense[];
  };
}

interface MonthlyMetrics {
  month: string;
  year: number;
  revenue: number;
  expenses: number;
  balance: number;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  metrics,
  monthlyMetrics,
  campaigns,
  expenses,
  transactions,
  recurringExpenses,
  budgetLimits,
  categories,
  onToggleRecurring,
  onDeleteRecurring
}) => {
  const { receivables } = useReceivables();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showExtras, setShowExtras] = useState(false);

  const formatCurrency = (value: number | string | null | undefined): string => {
    let numValue: number;
    if (typeof value === 'string') {
      numValue = parseFloat(value);
    } else {
      numValue = typeof value === 'number' ? value : 0;
    }

    if (isNaN(numValue)) {
      numValue = 0;
    }

    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  // Calculate total receivables
  const totalReceivables = useMemo(() => {
    return receivables.reduce((total, receivable) => {
      if (receivable.status === 'pending') {
        return total + receivable.amount;
      }
      return total;
    }, 0);
  }, [receivables]);

  // Get metrics for the selected month only
  const selectedMonthMetrics = useMemo(() => {
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Calculate campaign metrics
    const monthCampaigns = campaigns.filter(c => {
      const date = new Date(c.date);
      return date >= monthStart && date <= monthEnd;
    });

    // Calculate campaign expenses
    const campaignMetrics = monthCampaigns.reduce((acc, campaign) => {
      acc.revenue += Number(campaign.revenue) || 0;
      acc.adSpend += Number(campaign.adSpend) || 0;
      acc.assetsCost += Number(campaign.assetsCost) || 0;
      return acc;
    }, { revenue: 0, adSpend: 0, assetsCost: 0 });

    // Calculate transaction metrics
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });

    const transactionRevenue = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const transactionExpenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Calculate expense metrics
    const monthExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      return date >= monthStart && date <= monthEnd;
    });

    const expenseTotal = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Calculate total revenue and expenses
    const totalRevenue = campaignMetrics.revenue + transactionRevenue;
    const totalExpenses = campaignMetrics.adSpend + 
                         campaignMetrics.assetsCost + 
                         transactionExpenses + 
                         expenseTotal;

    return {
      month: monthKey,
      year: currentDate.getFullYear(),
      revenue: totalRevenue,
      expenses: totalExpenses,
      balance: totalRevenue - totalExpenses,
      expenseBreakdown: {
        adSpend: campaignMetrics.adSpend,
        assetsCost: campaignMetrics.assetsCost,
        other: transactionExpenses + expenseTotal
      }
    };
  }, [currentDate, campaigns, expenses, transactions]);

  // Calculate budget progress for each limit
  const budgetProgress = useMemo(() => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    return budgetLimits.map(limit => {
      const category = categories.find(c => c.id === limit.categoryId);
      
      // Get expenses for this category in the current period
      const relevantTransactions = transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const date = new Date(t.date);
        
        // Check if transaction is within the current period
        const isInPeriod = (() => {
          switch (limit.period) {
            case 'daily':
              return date.toDateString() === new Date().toDateString();
            case 'weekly':
              const weekStart = new Date();
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              return date >= weekStart && date <= new Date();
            case 'monthly':
              return date >= monthStart && date <= monthEnd;
          }
        })();

        return isInPeriod && t.categoryId === limit.categoryId;
      });

      const totalSpent = relevantTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const progress = (totalSpent / (Number(limit.amount) || 1)) * 100;

      return {
        limit,
        category,
        spent: totalSpent,
        remaining: (Number(limit.amount) || 0) - totalSpent,
        progress,
        isExceeded: progress >= 100,
        isWarning: progress >= limit.notifyAt
      };
    });
  }, [transactions, budgetLimits, categories, currentDate]);

  // Get the most critical budget limit (highest percentage used)
  const criticalBudget = useMemo(() => {
    return budgetProgress
      .filter(b => b.progress > 0)
      .sort((a, b) => b.progress - a.progress)[0];
  }, [budgetProgress]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-center gap-4 mb-6">
        <button 
          onClick={() => changeMonth(-1)}
          className="p-1 rounded-full hover:bg-white/5 transition-colors"
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>
        <span className="text-sm text-gray-400 uppercase tracking-wider min-w-[120px] text-center">
          {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
        <button 
          onClick={() => changeMonth(1)}
          className="p-1 rounded-full hover:bg-white/5 transition-colors"
        >
          <ChevronUp className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      {/* Balance Card */}
      <div className="bg-[#1a1a1a] rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-900 rounded-lg">
            <Coins className={`w-5 h-5 ${selectedMonthMetrics.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
          </div>
          <div>
            <div className="text-sm text-gray-400">Saldo Total</div>
            <div className={`text-2xl font-medium ${selectedMonthMetrics.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(selectedMonthMetrics.balance)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="Receita"
          value={formatCurrency(selectedMonthMetrics.revenue)}
          icon={<BarChart3 className="w-5 h-5 text-emerald-400" />}
          valueColor="text-emerald-400"
        />
        
        <MetricCard
          title="Despesas"
          value={formatCurrency(selectedMonthMetrics.expenses)}
          icon={<DollarSign className="w-5 h-5 text-red-400" />}
          valueColor="text-red-400"
        />
      </div>

      {/* Expandable Section */}
      <div className="space-y-4">
        <button
          onClick={() => setShowExtras(!showExtras)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          {showExtras ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {showExtras ? 'Ocultar' : 'Expandir'} custos detalhados
        </button>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${
          showExtras ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'
        }`}>
          <MetricCard
            title="Ativos"
            value={formatCurrency(selectedMonthMetrics.expenseBreakdown.assetsCost)}
            icon={<Briefcase className="w-5 h-5 text-blue-400" />}
            valueColor="text-blue-400"
          />

          <MetricCard
            title="Dinheiro a Receber"
            value={formatCurrency(totalReceivables)}
            icon={<Wallet className="w-5 h-5 text-amber-400" />}
            valueColor="text-amber-400"
          />

          {/* Budget Control Card */}
          <div className="col-span-full">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Controle de Orçamento</h3>
                    <p className="text-sm text-gray-400">
                      {budgetLimits.length} limite{budgetLimits.length !== 1 ? 's' : ''} definido{budgetLimits.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {budgetLimits.length > 0 ? (
                <div className="space-y-4">
                  {budgetProgress.map(({ limit, category, spent, remaining, progress, isExceeded, isWarning }) => (
                    <div key={limit.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category?.color }}
                          />
                          <span className="text-sm text-gray-300">{category?.name}</span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {formatCurrency(spent)} / {formatCurrency(limit.amount)}
                        </span>
                      </div>

                      <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`absolute left-0 h-full transition-all duration-300 rounded-full ${
                            isExceeded
                              ? 'bg-red-500'
                              : isWarning
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>

                      {(isWarning || isExceeded) && (
                        <div className={`p-2 rounded-lg flex items-start gap-2 text-sm ${
                          isExceeded
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <p>
                            {isExceeded
                              ? `Limite excedido em ${formatCurrency(Math.abs(remaining))}`
                              : `${progress.toFixed(1)}% do limite utilizado`}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  <p>Nenhum limite de orçamento definido</p>
                  <p className="text-sm mt-1">Configure limites nas configurações</p>
                </div>
              )}
            </div>
          </div>

          {/* Recurring Expenses Card */}
          <div className="col-span-full">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <RepeatIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Despesas Recorrentes</h3>
                    <p className="text-sm text-gray-400">
                      {recurringExpenses.filter(exp => exp.isActive).length} despesas ativas
                    </p>
                  </div>
                </div>
                <p className="text-lg font-medium text-white">
                  {formatCurrency(recurringExpenses.reduce((sum, exp) => exp.isActive ? sum + (Number(exp.amount) || 0) : sum, 0))}
                </p>
              </div>

              <RecurringExpensesList
                expenses={recurringExpenses}
                onToggle={onToggleRecurring}
                onDelete={onDeleteRecurring}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pass selected date to Insights */}
      <Insights 
        metrics={metrics}
        campaigns={campaigns}
        expenses={expenses}
        transactions={transactions}
        selectedMonth={currentDate}
      />
    </div>
  );
};

export default Dashboard;