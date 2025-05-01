import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Target, AlertTriangle, DollarSign, 
  PiggyBank, ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
  LineChart, BarChart3, PieChart, Wallet, Calculator, Calendar,
  TrendingDown as Decrease, Activity, Zap
} from 'lucide-react';
import { Campaign, Expense, DashboardMetrics, Transaction } from '../types';

interface InsightsProps {
  metrics: DashboardMetrics;
  campaigns: Campaign[];
  expenses: Expense[];
  transactions: Transaction[];
  selectedMonth: Date;
}

const Insights: React.FC<InsightsProps> = ({ 
  metrics,
  campaigns,
  expenses,
  transactions,
  selectedMonth
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatPercentage = (value: number) => 
    `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  // Calculate monthly data for charts and trends
  const monthlyData = useMemo(() => {
    const data = new Map<string, {
      month: string;
      revenue: number;
      expenses: number;
      profit: number;
      expenseBreakdown: {
        ads: number;
        creatives: number;
        assets: number;
        other: number;
      };
    }>();

    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(selectedMonth);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      data.set(monthKey, {
        month: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date),
        revenue: 0,
        expenses: 0,
        profit: 0,
        expenseBreakdown: {
          ads: 0,
          creatives: 0,
          assets: 0,
          other: 0
        }
      });
    }

    // Add campaign data
    campaigns.forEach(campaign => {
      const date = new Date(campaign.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (data.has(monthKey)) {
        const monthData = data.get(monthKey)!;
        monthData.revenue += Number(campaign.revenue) || 0;
        monthData.expenses += (Number(campaign.adSpend) || 0) + 
                            (Number(campaign.creativesCost) || 0) + 
                            (Number(campaign.assetsCost) || 0);
        monthData.expenseBreakdown.ads += Number(campaign.adSpend) || 0;
        monthData.expenseBreakdown.creatives += Number(campaign.creativesCost) || 0;
        monthData.expenseBreakdown.assets += Number(campaign.assetsCost) || 0;
        monthData.profit = monthData.revenue - monthData.expenses;
      }
    });

    // Add expense data
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (data.has(monthKey)) {
        const monthData = data.get(monthKey)!;
        monthData.expenses += Number(expense.amount) || 0;
        
        switch (expense.type) {
          case 'ad':
            monthData.expenseBreakdown.ads += Number(expense.amount) || 0;
            break;
          case 'creative':
            monthData.expenseBreakdown.creatives += Number(expense.amount) || 0;
            break;
          case 'asset':
            monthData.expenseBreakdown.assets += Number(expense.amount) || 0;
            break;
          default:
            monthData.expenseBreakdown.other += Number(expense.amount) || 0;
        }
        
        monthData.profit = monthData.revenue - monthData.expenses;
      }
    });

    // Add transaction data
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (data.has(monthKey)) {
        const monthData = data.get(monthKey)!;
        if (transaction.type === 'income') {
          monthData.revenue += Number(transaction.amount) || 0;
        } else {
          monthData.expenses += Number(transaction.amount) || 0;
          monthData.expenseBreakdown.other += Number(transaction.amount) || 0;
        }
        monthData.profit = monthData.revenue - monthData.expenses;
      }
    });

    return Array.from(data.values());
  }, [campaigns, expenses, transactions, selectedMonth]);

  // Calculate trends and projections
  const trends = useMemo(() => {
    const last3Months = monthlyData.slice(-3);
    const last6Months = monthlyData.slice(-6);

    // Calculate average growth rates
    const revenueGrowth = last3Months.reduce((acc, curr, i) => {
      if (i === 0) return acc;
      const prevRevenue = last3Months[i - 1].revenue;
      return prevRevenue > 0 ? acc + ((curr.revenue - prevRevenue) / prevRevenue) : acc;
    }, 0) / 2;

    const expenseGrowth = last3Months.reduce((acc, curr, i) => {
      if (i === 0) return acc;
      const prevExpenses = last3Months[i - 1].expenses;
      return prevExpenses > 0 ? acc + ((curr.expenses - prevExpenses) / prevExpenses) : acc;
    }, 0) / 2;

    // Calculate moving averages
    const revenueMA = last6Months.reduce((acc, curr) => acc + curr.revenue, 0) / 6;
    const expenseMA = last6Months.reduce((acc, curr) => acc + curr.expenses, 0) / 6;

    // Project next month
    const lastMonth = last3Months[last3Months.length - 1] || { revenue: 0, expenses: 0, profit: 0 };
    const projectedRevenue = lastMonth.revenue * (1 + revenueGrowth);
    const projectedExpenses = lastMonth.expenses * (1 + expenseGrowth);
    const projectedProfit = projectedRevenue - projectedExpenses;

    return {
      revenueGrowth,
      expenseGrowth,
      revenueMA,
      expenseMA,
      projectedRevenue,
      projectedExpenses,
      projectedProfit,
      profitTrend: projectedProfit > lastMonth.profit ? 'up' : 'down'
    };
  }, [monthlyData]);

  // Calculate efficiency metrics
  const efficiency = useMemo(() => {
    const last3Months = monthlyData.slice(-3);
    const roiTrend = last3Months.map(month => 
      month.expenses > 0 ? (month.revenue / month.expenses - 1) * 100 : 0
    );
    
    const expenseRatio = last3Months.map(month =>
      month.revenue > 0 ? (month.expenses / month.revenue) * 100 : 0
    );

    return {
      roiTrend,
      expenseRatio,
      improving: roiTrend[2] > roiTrend[0],
      averageROI: roiTrend.reduce((acc, curr) => acc + curr, 0) / 3
    };
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* Trend Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Growth Trends */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div className={`px-3 py-1 rounded-lg ${
              trends.revenueGrowth >= 0
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {formatPercentage(trends.revenueGrowth * 100)}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Tendência de Crescimento</h3>
          <p className="text-sm text-gray-400 mb-4">
            Análise de crescimento dos últimos 3 meses
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Média Móvel (6m)</span>
              <span className="text-white">{formatCurrency(trends.revenueMA)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((trends.revenueGrowth + 1) * 50, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Future Projections */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Calculator className="w-6 h-6 text-blue-400" />
            </div>
            <div className={`px-3 py-1 rounded-lg ${
              trends.projectedProfit > 0
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {trends.profitTrend === 'up' ? '↑' : '↓'} Projeção
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Projeção Mensal</h3>
          <p className="text-sm text-gray-400 mb-4">
            Estimativa para o próximo mês
          </p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Receita Projetada</span>
              <span className="text-emerald-400">{formatCurrency(trends.projectedRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Despesas Projetadas</span>
              <span className="text-red-400">{formatCurrency(trends.projectedExpenses)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-800">
              <span className="text-gray-400">Lucro Projetado</span>
              <span className={trends.projectedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {formatCurrency(trends.projectedProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-amber-500/20">
              <Activity className="w-6 h-6 text-amber-400" />
            </div>
            <div className={`px-3 py-1 rounded-lg ${
              efficiency.improving
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {efficiency.improving ? 'Melhorando' : 'Atenção'}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Eficiência Operacional</h3>
          <p className="text-sm text-gray-400 mb-4">
            Análise de desempenho e ROI
          </p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">ROI Médio</span>
              <span className={`font-medium ${
                efficiency.averageROI >= 20 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {formatPercentage(efficiency.averageROI)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tendência ROI</span>
              <span className={`font-medium ${
                efficiency.improving ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {efficiency.improving ? '↑ Positiva' : '↓ Negativa'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Composição de Despesas</h3>
          {(() => {
            const currentMonth = monthlyData[monthlyData.length - 1];
            const totalExpenses = Object.values(currentMonth.expenseBreakdown).reduce((a, b) => a + b, 0);
            
            return (
              <div className="space-y-3">
                {Object.entries(currentMonth.expenseBreakdown).map(([key, value]) => {
                  const percentage = totalExpenses > 0 ? (value / totalExpenses) * 100 : 0;
                  if (percentage === 0) return null;
                  
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        key === 'ads' ? 'bg-blue-500' :
                        key === 'creatives' ? 'bg-purple-500' :
                        key === 'assets' ? 'bg-orange-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-gray-400 text-sm">
                        {key === 'ads' ? 'Anúncios' :
                         key === 'creatives' ? 'Criativos' :
                         key === 'assets' ? 'Ativos' : 'Outros'}
                      </span>
                      <div className="flex-1 mx-2">
                        <div className="w-full bg-gray-800 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${
                              key === 'ads' ? 'bg-blue-500' :
                              key === 'creatives' ? 'bg-purple-500' :
                              key === 'assets' ? 'bg-orange-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-white">{percentage.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Revenue Sources */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Fontes de Receita</h3>
          {(() => {
            const campaignRevenue = campaigns
              .filter(c => {
                const date = new Date(c.date);
                return date.getMonth() === selectedMonth.getMonth() &&
                       date.getFullYear() === selectedMonth.getFullYear();
              })
              .reduce((acc, campaign) => acc + (Number(campaign.revenue) || 0), 0);
            
            const transactionRevenue = transactions
              .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === selectedMonth.getMonth() &&
                       date.getFullYear() === selectedMonth.getFullYear() &&
                       t.type === 'income';
              })
              .reduce((acc, transaction) => acc + (Number(transaction.amount) || 0), 0);

            const totalRevenue = campaignRevenue + transactionRevenue;
            
            const sources = [
              { name: 'Campanhas', value: campaignRevenue, color: 'bg-purple-500' },
              { name: 'Outras Receitas', value: transactionRevenue, color: 'bg-emerald-500' }
            ];

            return (
              <div className="space-y-3">
                {sources.map(source => {
                  const percentage = totalRevenue > 0 ? (source.value / totalRevenue) * 100 : 0;
                  if (percentage === 0) return null;

                  return (
                    <div key={source.name} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${source.color}`} />
                      <span className="text-gray-400 text-sm">{source.name}</span>
                      <div className="flex-1 mx-2">
                        <div className="w-full bg-gray-800 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${source.color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-white">{percentage.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default Insights;