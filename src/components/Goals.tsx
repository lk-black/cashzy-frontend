import React, { useState } from 'react';
import { 
  Trophy, Target, Star, Zap, Award, TrendingUp, CheckCircle, DollarSign, 
  Plus, X, Trash2, Sparkles, Calendar, AlertTriangle, Medal, Crown, Rocket,
  ChevronDown, ChevronUp, PiggyBank, Wallet, LineChart, BarChart3, Coins,
  Bell, Repeat, Tag, FileText, Briefcase, Calculator
} from 'lucide-react';
import { Campaign, Expense } from '../types';

interface GoalsProps {
  campaigns: Campaign[];
  expenses: Expense[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  target: number;
  color: string;
  reward: string;
}

interface FinancialGoal {
  id: string;
  title: string;
  target: number;
  deadline: string;
  type: 'revenue' | 'profit' | 'roi' | 'custom';
  metric?: string;
  currentValue?: number;
  createdAt: string;
}

const calculateGoalProgress = (goal: FinancialGoal, campaigns: Campaign[]) => {
  const currentDate = new Date();
  const deadline = new Date(goal.deadline);
  
  if (currentDate > deadline) {
    return 0;
  }

  let current = 0;
  const relevantCampaigns = campaigns.filter(c => 
    new Date(c.date) >= new Date(goal.createdAt) && 
    new Date(c.date) <= deadline
  );

  switch (goal.type) {
    case 'revenue':
      current = relevantCampaigns.reduce((acc, camp) => acc + camp.revenue, 0);
      break;
    case 'profit':
      current = relevantCampaigns.reduce((acc, camp) => {
        const profit = camp.revenue - (camp.adSpend + camp.creativesCost + camp.assetsCost);
        return acc + profit;
      }, 0);
      break;
    case 'roi':
      const totalRevenue = relevantCampaigns.reduce((acc, camp) => acc + camp.revenue, 0);
      const totalCost = relevantCampaigns.reduce((acc, camp) => 
        acc + camp.adSpend + camp.creativesCost + camp.assetsCost, 0
      );
      current = totalCost > 0 ? ((totalRevenue / totalCost) - 1) * 100 : 0;
      break;
    case 'custom':
      current = goal.currentValue || 0;
      break;
  }

  return Math.min((current / goal.target) * 100, 100);
};

const Goals: React.FC<GoalsProps> = ({ campaigns, expenses }) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'achievements' | 'goals'>('achievements');
  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    const savedGoals = localStorage.getItem('financial_goals');
    return savedGoals ? JSON.parse(savedGoals) : [];
  });
  const [newGoal, setNewGoal] = useState<Omit<FinancialGoal, 'id' | 'createdAt'>>({
    title: '',
    target: 0,
    deadline: '',
    type: 'revenue'
  });

  React.useEffect(() => {
    localStorage.setItem('financial_goals', JSON.stringify(goals));
  }, [goals]);

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const todayUpdates = {
    campaigns: campaigns.filter(c => new Date(c.date) >= startOfDay).length,
    expenses: expenses.filter(e => new Date(e.date) >= startOfDay).length
  };

  const achievements: Achievement[] = [
    {
      id: 'daily_update',
      title: 'Atualização Diária',
      description: 'Registre pelo menos uma transação hoje',
      icon: <Zap className="w-6 h-6" />,
      progress: todayUpdates.campaigns + todayUpdates.expenses,
      target: 1,
      color: 'purple',
      reward: '+5 pontos'
    },
    {
      id: 'campaign_master',
      title: 'Mestre das Campanhas',
      description: 'Registre 10 campanhas',
      icon: <Trophy className="w-6 h-6" />,
      progress: campaigns.length,
      target: 10,
      color: 'emerald',
      reward: '+25 pontos'
    },
    {
      id: 'expense_tracker',
      title: 'Controlador de Gastos',
      description: 'Registre 15 despesas',
      icon: <Target className="w-6 h-6" />,
      progress: expenses.length,
      target: 15,
      color: 'blue',
      reward: '+15 pontos'
    },
    {
      id: 'profit_seeker',
      title: 'Caçador de Lucros',
      description: 'Alcance ROI positivo em 5 campanhas',
      icon: <TrendingUp className="w-6 h-6" />,
      progress: campaigns.filter(c => (c.revenue / (c.adSpend + c.creativesCost + c.assetsCost) - 1) > 0).length,
      target: 5,
      color: 'amber',
      reward: '+35 pontos'
    },
    {
      id: 'goal_achiever',
      title: 'Realizador de Metas',
      description: 'Complete 3 metas financeiras',
      icon: <Award className="w-6 h-6" />,
      progress: goals.filter(g => calculateGoalProgress(g, campaigns) >= 100).length,
      target: 3,
      color: 'purple',
      reward: '+20 pontos'
    },
    // New achievements
    {
      id: 'budget_master',
      title: 'Mestre do Orçamento',
      description: 'Mantenha gastos abaixo do orçamento por 3 meses',
      icon: <PiggyBank className="w-6 h-6" />,
      progress: 1, // This should be calculated based on budget history
      target: 3,
      color: 'emerald',
      reward: '+30 pontos'
    },
    {
      id: 'roi_expert',
      title: 'Especialista em ROI',
      description: 'Alcance ROI acima de 200% em uma campanha',
      icon: <Calculator className="w-6 h-6" />,
      progress: campaigns.filter(c => ((c.revenue / (c.adSpend + c.creativesCost + c.assetsCost)) - 1) * 100 > 200).length,
      target: 1,
      color: 'blue',
      reward: '+40 pontos'
    },
    {
      id: 'category_organizer',
      title: 'Organizador de Categorias',
      description: 'Use 5 categorias diferentes para despesas',
      icon: <Tag className="w-6 h-6" />,
      progress: new Set(expenses.map(e => e.categoryId)).size,
      target: 5,
      color: 'purple',
      reward: '+15 pontos'
    },
    {
      id: 'recurring_master',
      title: 'Mestre das Recorrências',
      description: 'Configure 3 despesas recorrentes',
      icon: <Repeat className="w-6 h-6" />,
      progress: expenses.filter(e => e.isRecurring).length,
      target: 3,
      color: 'amber',
      reward: '+20 pontos'
    },
    {
      id: 'analytics_pro',
      title: 'Profissional em Analytics',
      description: 'Visualize relatórios por 7 dias consecutivos',
      icon: <LineChart className="w-6 h-6" />,
      progress: 3, // This should be tracked in user stats
      target: 7,
      color: 'emerald',
      reward: '+25 pontos'
    },
    {
      id: 'campaign_diversifier',
      title: 'Diversificador de Campanhas',
      description: 'Use 3 plataformas diferentes para campanhas',
      icon: <BarChart3 className="w-6 h-6" />,
      progress: new Set(campaigns.map(c => c.platform)).size,
      target: 3,
      color: 'blue',
      reward: '+30 pontos'
    },
    {
      id: 'savings_hero',
      title: 'Herói da Economia',
      description: 'Mantenha saldo positivo por 3 meses',
      icon: <Coins className="w-6 h-6" />,
      progress: 2, // This should be calculated from historical data
      target: 3,
      color: 'purple',
      reward: '+35 pontos'
    },
    {
      id: 'notification_master',
      title: 'Mestre das Notificações',
      description: 'Configure 3 alertas de orçamento',
      icon: <Bell className="w-6 h-6" />,
      progress: 1, // This should be tracked in user preferences
      target: 3,
      color: 'amber',
      reward: '+15 pontos'
    },
    {
      id: 'creative_optimizer',
      title: 'Otimizador Criativo',
      description: 'Registre 10 despesas com criativos',
      icon: <FileText className="w-6 h-6" />,
      progress: expenses.filter(e => e.type === 'creative').length,
      target: 10,
      color: 'emerald',
      reward: '+25 pontos'
    },
    {
      id: 'business_pro',
      title: 'Profissional dos Negócios',
      description: 'Alcance faturamento total de R$ 10.000',
      icon: <Briefcase className="w-6 h-6" />,
      progress: Math.min(campaigns.reduce((acc, camp) => acc + camp.revenue, 0) / 10000 * 100, 100),
      target: 100,
      color: 'blue',
      reward: '+50 pontos'
    }
  ];

  const totalPoints = achievements.reduce((acc, achievement) => {
    return acc + (achievement.progress >= achievement.target ? parseInt(achievement.reward.match(/\d+/)?.[0] || '0') : 0);
  }, 0);

  const getProgressColor = (achievement: Achievement) => {
    const isComplete = achievement.progress >= achievement.target;
    switch (achievement.color) {
      case 'emerald':
        return isComplete ? 'bg-emerald-500' : 'bg-emerald-500/20';
      case 'blue':
        return isComplete ? 'bg-blue-500' : 'bg-blue-500/20';
      case 'amber':
        return isComplete ? 'bg-amber-500' : 'bg-amber-500/20';
      default:
        return isComplete ? 'bg-purple-500' : 'bg-purple-500/20';
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const goal: FinancialGoal = {
      ...newGoal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    setGoals(prev => [goal, ...prev]);
    setNewGoal({
      title: '',
      target: 0,
      deadline: '',
      type: 'revenue'
    });
    setShowGoalForm(false);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const handleUpdateCustomGoal = (id: string, value: number) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, currentValue: value } : goal
    ));
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'profit':
        return <TrendingUp className="w-5 h-5 text-purple-400" />;
      case 'roi':
        return <Target className="w-5 h-5 text-blue-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  const getBadgeIcon = (points: number) => {
    if (points >= 2000) return <Rocket className="w-6 h-6 text-purple-400" />;
    if (points >= 1000) return <Crown className="w-6 h-6 text-amber-400" />;
    if (points >= 500) return <Medal className="w-6 h-6 text-gray-400" />;
    if (points >= 200) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Medal className="w-6 h-6 text-zinc-600" />; // Default badge
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 p-4 md:p-6 mb-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1000&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Metas e Conquistas</h2>
            <p className="text-sm md:text-base text-purple-200">Acompanhe seu progresso e alcance seus objetivos</p>
          </div>
          <div className="flex items-center gap-4 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            {getBadgeIcon(totalPoints)}
            <div>
              <div className="text-sm text-purple-200">Seus pontos</div>
              <div className="text-xl font-bold text-white">{totalPoints}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { level: 'Bronze', icon: <Medal className="w-6 h-6 text-amber-600" />, points: 200 },
          { level: 'Prata', icon: <Medal className="w-6 h-6 text-gray-400" />, points: 500 },
          { level: 'Ouro', icon: <Crown className="w-6 h-6 text-amber-400" />, points: 1000 },
          { level: 'Platina', icon: <Rocket className="w-6 h-6 text-purple-400" />, points: 2000 }
        ].map((rank) => (
          <div
            key={rank.level}
            className={`bg-[#1a1a1a] rounded-xl p-3 md:p-4 border ${
              totalPoints >= rank.points
                ? 'border-purple-500/30 bg-purple-500/5'
                : 'border-gray-800'
            }`}
          >
            <div className="flex items-center gap-2 md:gap-3">
              {rank.icon}
              <div>
                <div className="text-sm font-medium text-gray-300">{rank.level}</div>
                <div className="text-xs text-gray-400">{rank.points} pts</div>
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-800 rounded-full h-1">
              <div
                className="bg-purple-500 h-1 rounded-full transition-all"
                style={{
                  width: `${Math.min((totalPoints / rank.points) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800 relative overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`pb-2 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'achievements' 
              ? 'text-purple-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Conquistas
          </div>
          {activeTab === 'achievements' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 animate-slide-in" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`pb-2 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'goals' 
              ? 'text-purple-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Metas Financeiras
          </div>
          {activeTab === 'goals' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500 animate-slide-in" />
          )}
        </button>
      </div>

      {activeTab === 'achievements' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(achievement => {
              const isComplete = achievement.progress >= achievement.target;
              const showAchievement = showCompleted ? true : !isComplete;

              if (!showAchievement) return null;

              return (
                <div
                  key={achievement.id}
                  className={`group bg-[#1a1a1a] rounded-xl p-4 md:p-6 border transition-all hover:border-purple-500/30 ${
                    isComplete ? 'border-green-500/20' : 'border-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-${achievement.color}-500/10 transition-transform group-hover:scale-110`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base md:text-lg font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                          {achievement.title}
                        </h3>
                        {isComplete && (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-4">
                        {achievement.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            Progresso: {achievement.progress} / {achievement.target}
                          </span>
                          <span className="text-amber-400 font-medium">{achievement.reward}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`${getProgressColor(achievement)} h-2 rounded-full transition-all ${
                              isComplete ? 'animate-pulse' : ''
                            }`}
                            style={{
                              width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            {showCompleted ? (
              <>
                <X className="w-4 h-4" />
                Ocultar conquistas completadas
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Mostrar todas as conquistas
              </>
            )}
          </button>
        </>
      ) : (
        <div className="space-y-6">
          {!showGoalForm && (
            <button
              onClick={() => setShowGoalForm(true)}
              className="w-full p-4 md:p-6 border border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
              <span className="font-medium">Adicionar Meta Financeira</span>
            </button>
          )}

          {showGoalForm && (
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden animate-slide-down">
              <div className="p-4 md:p-6 border-b border-gray-800 bg-gradient-to-r from-purple-500/10 via-purple-400/5 to-transparent">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    Nova Meta
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="text-gray-400 hover:text-gray-300 p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddGoal} className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Título da Meta
                      </label>
                      <input
                        type="text"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                        className="w-full p-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        placeholder="Ex: Aumentar receita mensal"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Tipo de Meta
                      </label>
                      <select
                        value={newGoal.type}
                        onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as FinancialGoal['type'] })}
                        className="w-full p-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        required
                      >
                        <option value="revenue">Receita Total</option>
                        <option value="profit">Lucro Líquido</option>
                        <option value="roi">ROI (Retorno sobre Investimento)</option>
                        <option value="custom">Meta Personalizada</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {newGoal.type === 'custom' ? 'Valor Alvo' : `Meta ${newGoal.type === 'roi' ? '(%)' : '(R$)'}`}
                      </label>
                      <input
                        type="number"
                        value={newGoal.target}
                        onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) })}
                        className="w-full p-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        required
                        min="0"
                        step={newGoal.type === 'roi' ? '0.1' : '0.01'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Data Limite
                      </label>
                      <input
                        type="date"
                        value={newGoal.deadline}
                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                        className="w-full p-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                {newGoal.type === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Métrica Personalizada
                    </label>
                    <input
                      type="text"
                      value={newGoal.metric}
                      onChange={(e) => setNewGoal({ ...newGoal, metric: e.target.value })}
                      className="w-full p-2 bg-white/5 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      placeholder="Ex: Número de campanhas, Taxa de conversão, etc."
                      required={newGoal.type === 'custom'}
                    />
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="w-full md:w-auto px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full md:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Meta
                  </button>
                </div>
              </form>
            </div>
          )}

          {goals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map(goal => {
                const progress = calculateGoalProgress(goal, campaigns);
                const isExpired = new Date() > new Date(goal.deadline);
                const daysLeft = Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={goal.id}
                    className={`group bg-[#1a1a1a] rounded-xl p-4 md:p-6 border transition-all hover:border-purple-500/30 ${
                      isExpired ? 'border-red-500/20' : progress >= 100 ? 'border-green-500/20' : 'border-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-purple-500/10 transition-transform group-hover:scale-110">
                          {getGoalTypeIcon(goal.type)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base md:text-lg font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                            {goal.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Meta: {goal.type === 'roi' ? `${goal.target}%` : formatCurrency(goal.target)}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <Calendar className="w-4 h-4" />
                            {isExpired ? (
                              <span className="text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                Meta expirada
                              </span>
                            ) : (
                              <span>{daysLeft} dias restantes</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-gray-400 hover:text-red-400 p-2 hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {goal.type === 'custom' && (
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="number"
                            value={goal.currentValue || 0}
                            onChange={(e) => handleUpdateCustomGoal(goal.id, parseFloat(e.target.value))}
                            className="w-full p-2 bg-white/5 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                            placeholder="Valor atual"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          Progresso: {progress.toFixed(1)}%
                        </span>
                        {progress >= 100 && (
                          <span className="text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Meta alcançada!
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isExpired ? 'bg-red-500' : progress >= 100 ? 'bg-green-500 animate-pulse' : 'bg-purple-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !showGoalForm && (
              <div className="text-center text-gray-400 py-8 md:py-12">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-purple-500/5 flex items-center justify-center">
                  <Target className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
                </div>
                <p className="text-lg font-medium mb-2">Nenhuma meta financeira definida</p>
                <p className="text-sm">
                  Defina metas para acompanhar seu progresso financeiro e alcançar seus objetivos
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Goals;