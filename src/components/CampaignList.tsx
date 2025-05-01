import React, { useState, useMemo } from 'react';
import { Campaign, Expense, Transaction } from '../types';
import { 
  DollarSign, Palette, Package, PlusCircle, Coins, Calendar,
  Search, Filter, ArrowUp, ArrowDown, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, BarChart3, Clock, Menu
} from 'lucide-react';

interface HistoryProps {
  campaigns: Campaign[];
  expenses: Expense[];
  transactions: Transaction[];
}

const History: React.FC<HistoryProps> = ({ campaigns, expenses, transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'campaign' | 'expense' | 'transaction'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Enhanced formatCurrency function with better error handling
  const formatCurrency = (value: number | string | null | undefined): string => {
    // Convert string to number if needed
    let numValue: number;
    if (typeof value === 'string') {
      numValue = parseFloat(value);
    } else {
      numValue = typeof value === 'number' ? value : 0;
    }

    // Handle NaN and invalid numbers
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'campaign':
        return <PlusCircle className="w-5 h-5 text-emerald-500" />;
      case 'ad':
        return <DollarSign className="w-5 h-5 text-blue-500" />;
      case 'creative':
        return <Palette className="w-5 h-5 text-purple-500" />;
      case 'asset':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'income':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'expense':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  // Enhanced calculateProfit function with better error handling
  const calculateProfit = (campaign: Campaign): number => {
    // Convert all values to numbers and handle invalid inputs
    const revenue = parseFloat(String(campaign.revenue)) || 0;
    const adSpend = parseFloat(String(campaign.adSpend)) || 0;
    const creativesCost = parseFloat(String(campaign.creativesCost)) || 0;
    const assetsCost = parseFloat(String(campaign.assetsCost)) || 0;

    // Calculate profit
    return revenue - adSpend - creativesCost - assetsCost;
  };

  type HistoryItem = {
    id: string;
    date: string;
    type: 'campaign' | 'expense' | 'transaction';
    data: Campaign | Expense | Transaction;
    amount: number;
  };

  const historyItems: HistoryItem[] = useMemo(() => {
    const items = [
      ...campaigns.map(campaign => ({
        id: campaign.id,
        date: campaign.date,
        type: 'campaign' as const,
        data: campaign,
        amount: parseFloat(String(campaign.revenue)) || 0
      })),
      ...expenses.map(expense => ({
        id: expense.id,
        date: expense.date,
        type: 'expense' as const,
        data: expense,
        amount: parseFloat(String(expense.amount)) || 0
      })),
      ...transactions.map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        type: 'transaction' as const,
        data: transaction,
        amount: parseFloat(String(transaction.amount)) || 0
      }))
    ];

    return items
      .filter(item => {
        if (filterType !== 'all') {
          if (filterType === 'transaction') {
            if (item.type !== 'transaction') return false;
          } else if (item.type !== filterType) {
            return false;
          }
        }
        
        const searchString = item.type === 'campaign'
          ? (item.data as Campaign).name.toLowerCase()
          : item.type === 'transaction'
          ? (item.data as Transaction).description.toLowerCase()
          : (item.data as Expense).description.toLowerCase();
        
        return searchString.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        const aValue = sortBy === 'date' ? new Date(a.date).getTime() : a.amount;
        const bValue = sortBy === 'date' ? new Date(b.date).getTime() : b.amount;
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });
  }, [campaigns, expenses, transactions, searchTerm, filterType, sortBy, sortOrder]);

  const toggleSort = (newSortBy: 'date' | 'amount') => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    
    historyItems.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(item);
    });

    return groups;
  }, [historyItems]);

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 p-4 md:p-6">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1000&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
        <div className="relative">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">
            Histórico de Transações
          </h2>
          <p className="text-sm md:text-base text-purple-200">
            Acompanhe todas as suas movimentações financeiras
          </p>
        </div>
      </div>

      {/* Mobile Filters Toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-4 py-2 bg-white/5 border border-gray-700 rounded-lg text-white flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros e Ordenação
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters and Search */}
      <div className={`flex flex-col gap-4 ${!showFilters ? 'hidden md:flex' : 'flex'} md:flex-row md:items-center md:justify-between`}>
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('campaign')}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                filterType === 'campaign'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Campanhas
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                filterType === 'expense'
                  ? 'bg-red-500/20 text-red-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => setFilterType('transaction')}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                filterType === 'transaction'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Transações
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => toggleSort('date')}
              className={`flex-1 md:flex-none px-3 py-1 rounded-lg transition-colors flex items-center justify-center md:justify-start gap-1 ${
                sortBy === 'date'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="whitespace-nowrap">Data</span>
              {sortBy === 'date' && (
                sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => toggleSort('amount')}
              className={`flex-1 md:flex-none px-3 py-1 rounded-lg transition-colors flex items-center justify-center md:justify-start gap-1 ${
                sortBy === 'amount'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="whitespace-nowrap">Valor</span>
              {sortBy === 'amount' && (
                sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-6 md:space-y-8">
        {Object.entries(groupedByMonth).map(([monthKey, items]) => {
          const [year, month] = monthKey.split('-');
          const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'long' });
          
          const monthlyStats = items.reduce((acc, item) => {
            if (item.type === 'campaign') {
              const campaign = item.data as Campaign;
              acc.revenue += parseFloat(String(campaign.revenue)) || 0;
              acc.expenses += (parseFloat(String(campaign.adSpend)) || 0) + 
                            (parseFloat(String(campaign.creativesCost)) || 0) + 
                            (parseFloat(String(campaign.assetsCost)) || 0);
            } else if (item.type === 'transaction') {
              const transaction = item.data as Transaction;
              if (transaction.type === 'income') {
                acc.revenue += parseFloat(String(transaction.amount)) || 0;
              } else {
                acc.expenses += parseFloat(String(transaction.amount)) || 0;
              }
            } else {
              acc.expenses += parseFloat(String((item.data as Expense).amount)) || 0;
            }
            return acc;
          }, { revenue: 0, expenses: 0 });

          return (
            <div key={monthKey} className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-white capitalize">
                  {monthName} de {year}
                </h3>
                <div className="flex items-center gap-4 text-sm bg-white/5 p-2 rounded-lg md:bg-transparent md:p-0">
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">{formatCurrency(monthlyStats.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">{formatCurrency(monthlyStats.expenses)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const isExpanded = expandedItem === item.id;
                  
                  return (
                    <div
                      key={item.id}
                      className={`group bg-gray-900/50 backdrop-blur-lg rounded-xl border transition-all ${
                        isExpanded
                          ? 'border-purple-500/30 bg-purple-500/5'
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        className="w-full text-left p-4"
                      >
                        <div className="flex items-center gap-4">
                          {item.type === 'campaign' ? (
                            <>
                              {getIcon('campaign')}
                              <div className="flex-grow">
                                <h3 className="font-medium text-gray-100">
                                  Nova Campanha: {(item.data as Campaign).name}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {new Date(item.date).toLocaleDateString('pt-BR')} • {(item.data as Campaign).platform}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <p className="text-sm text-gray-400">
                                    Investimento: {formatCurrency((item.data as Campaign).adSpend)} • 
                                    Receita: {formatCurrency((item.data as Campaign).revenue)}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <Coins className="w-4 h-4" />
                                    <span className={`text-sm font-medium ${
                                      calculateProfit(item.data as Campaign) >= 0 
                                        ? 'text-emerald-500' 
                                        : 'text-red-500'
                                    }`}>
                                      {formatCurrency(calculateProfit(item.data as Campaign))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : item.type === 'transaction' ? (
                            <>
                              {getIcon((item.data as Transaction).type)}
                              <div className="flex-grow">
                                <h3 className="font-medium text-gray-100">
                                  {(item.data as Transaction).description}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {new Date(item.date).toLocaleDateString('pt-BR')}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`text-sm font-medium ${
                                    (item.data as Transaction).type === 'income'
                                      ? 'text-emerald-500'
                                      : 'text-red-500'
                                  }`}>
                                    {formatCurrency((item.data as Transaction).amount)}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              {getIcon((item.data as Expense).type)}
                              <div className="flex-grow">
                                <h3 className="font-medium text-gray-100">
                                  {(item.data as Expense).description}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {new Date(item.date).toLocaleDateString('pt-BR')}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-sm font-medium text-red-500">
                                    {formatCurrency((item.data as Expense).amount)}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && item.type === 'campaign' && (
                        <div className="px-4 pb-4 pt-2 border-t border-gray-800">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-400">Anúncios</p>
                              <p className="text-lg font-medium text-white">
                                {formatCurrency((item.data as Campaign).adSpend)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Criativos</p>
                              <p className="text-lg font-medium text-white">
                                {formatCurrency((item.data as Campaign).creativesCost)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Ativos</p>
                              <p className="text-lg font-medium text-white">
                                {formatCurrency((item.data as Campaign).assetsCost)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">ROI</p>
                              {(() => {
                                const campaign = item.data as Campaign;
                                const revenue = parseFloat(String(campaign.revenue)) || 0;
                                const totalCost = (parseFloat(String(campaign.adSpend)) || 0) + 
                                                (parseFloat(String(campaign.creativesCost)) || 0) + 
                                                (parseFloat(String(campaign.assetsCost)) || 0);
                                
                                const roi = totalCost > 0 
                                  ? ((revenue / totalCost) - 1) * 100 
                                  : 0;
                                
                                return (
                                  <p className={`text-lg font-medium ${
                                    roi >= 0 ? 'text-emerald-500' : 'text-red-500'
                                  }`}>
                                    {roi.toFixed(2)}%
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {historyItems.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-purple-400" />
            </div>
            <p className="text-lg font-medium mb-2">Nenhuma transação encontrada</p>
            <p className="text-sm">
              {searchTerm
                ? 'Tente ajustar os filtros de busca'
                : 'Adicione campanhas ou despesas para começar'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;