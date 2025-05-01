import React, { useState } from 'react';
import { Users, UserCheck, UserX, Calendar, Mail, Search, RefreshCw, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  created_at: string;
  name?: string;
  last_sign_in_at?: string;
  is_active: boolean;
}

interface UserStats {
  totalUsers: number;
  activeToday: number;
  inactiveUsers: number;
  newUsersThisWeek: number;
}

// Dados simulados para o painel de administração
const mockUsers: User[] = [
  {
    id: '1',
    email: 'usuario1@exemplo.com',
    name: 'Usuário 1',
    created_at: new Date(2023, 1, 15).toISOString(),
    last_sign_in_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: '2',
    email: 'usuario2@exemplo.com',
    name: 'Usuário 2',
    created_at: new Date(2023, 2, 20).toISOString(),
    last_sign_in_at: new Date(2023, 5, 10).toISOString(),
    is_active: true
  },
  {
    id: '3',
    email: 'usuario3@exemplo.com',
    name: 'Usuário 3',
    created_at: new Date(2023, 3, 5).toISOString(),
    last_sign_in_at: new Date(2023, 4, 25).toISOString(),
    is_active: false
  },
  {
    id: '4',
    email: 'usuario4@exemplo.com',
    name: 'Usuário 4',
    created_at: new Date().toISOString(),
    is_active: true
  }
];

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: mockUsers.length,
    activeToday: 1,
    inactiveUsers: 1,
    newUsersThisWeek: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsRefreshing(true);
      // Simulação de carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Dados atualizados com sucesso');
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Simulação de atualização de status
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
      
      toast.success('Status do usuário atualizado com sucesso');
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast.error('Erro ao atualizar status do usuário');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => (
    <div className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-${color}-500/20`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full bg-${color}-500/20 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Painel Administrativo</h2>
        <button
          onClick={fetchUsers}
          className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-5 h-5 text-purple-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Usuários"
          value={stats.totalUsers}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Ativos Hoje"
          value={stats.activeToday}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Inativos (30d)"
          value={stats.inactiveUsers}
          icon={UserX}
          color="red"
        />
        <StatCard
          title="Novos (7d)"
          value={stats.newUsersThisWeek}
          icon={Users}
          color="blue"
        />
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Usuários</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="pb-3 text-gray-400 font-medium">Usuário</th>
                  <th className="pb-3 text-gray-400 font-medium">Email</th>
                  <th className="pb-3 text-gray-400 font-medium">Último Acesso</th>
                  <th className="pb-3 text-gray-400 font-medium">Cadastro</th>
                  <th className="pb-3 text-gray-400 font-medium">Status</th>
                  <th className="pb-3 text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="text-gray-300">
                    <td className="py-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-400 text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span>{user.name || 'Usuário'}</span>
                    </td>
                    <td className="py-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.email}
                    </td>
                    <td className="py-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')
                        : 'Nunca'}
                    </td>
                    <td className="py-3">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle className="w-4 h-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400">
                          <Ban className="w-4 h-4" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          user.is_active
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        } transition-colors`}
                      >
                        {user.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;