import React from 'react';
import { Receivable } from '../types';
import { Calendar, DollarSign, CheckCircle, XCircle, AlertTriangle, Trash2 } from 'lucide-react';

interface ReceivablesListProps {
  receivables: Receivable[];
  onUpdateStatus: (id: string, status: 'pending' | 'received' | 'overdue') => void;
  onDelete: (id: string) => void;
  showFilters?: boolean;
}

const ReceivablesList: React.FC<ReceivablesListProps> = ({
  receivables,
  onUpdateStatus,
  onDelete,
  showFilters = true
}) => {
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'received' | 'overdue'>('all');

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'overdue':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-amber-400 bg-amber-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredReceivables = receivables.filter(receivable => 
    filter === 'all' || receivable.status === filter
  );

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('received')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filter === 'received'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Recebidos
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filter === 'overdue'
                ? 'bg-red-500/20 text-red-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Atrasados
          </button>
        </div>
      )}

      <div className="space-y-4">
        {filteredReceivables.map(receivable => (
          <div
            key={receivable.id}
            className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-white">{receivable.name}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">
                      {new Date(receivable.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-white font-medium">
                      {formatCurrency(receivable.amount)}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-lg ${getStatusColor(receivable.status)}`}>
                    {getStatusIcon(receivable.status)}
                    <span>
                      {receivable.status === 'pending' ?
                        'Pendente' : receivable.status === 'received' ?
                        'Recebido' : 'Atrasado'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {receivable.status === 'pending' && (
                  <button
                    onClick={() => onUpdateStatus(receivable.id, 'received')}
                    className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                    title="Marcar como recebido"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(receivable.id)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredReceivables.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-lg font-medium mb-2">Nenhum valor a receber</p>
            <p className="text-sm">
              {filter === 'all'
                ? 'Adicione valores a receber para começar'
                : filter === 'pending'
                ? 'Não há valores pendentes de recebimento'
                : filter === 'received'
                ? 'Não há valores recebidos'
                : 'Não há valores atrasados'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivablesList;