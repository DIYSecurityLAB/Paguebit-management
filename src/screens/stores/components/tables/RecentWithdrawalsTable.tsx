import React, { useState, useMemo } from 'react';
import { Withdrawal } from '../../../../domain/entities/Withdrawal.entity';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface RecentWithdrawalsTableProps {
  withdrawals: Withdrawal[];
  limit?: number;
}

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'completed', label: 'Concluído' },
  { value: 'failed', label: 'Falha' },
];

const RecentWithdrawalsTable: React.FC<RecentWithdrawalsTableProps> = ({ withdrawals, limit = 5 }) => {
  const [status, setStatus] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  const filteredWithdrawals = useMemo(() => {
    let filtered = withdrawals;
    if (status) filtered = filtered.filter(w => w.status === status);
    filtered = [...filtered].sort((a, b) =>
      order === 'desc'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return filtered.slice(0, limit);
  }, [withdrawals, status, order, limit]);

  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    return `${baseClasses} ${statusClasses[status as keyof typeof statusClasses] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}`;
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        <select
          className="border rounded px-2 py-1 text-sm bg-background text-foreground"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          className="border rounded px-2 py-1 text-sm bg-background text-foreground"
          onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
        >
          {order === 'desc' ? 'Mais recentes' : 'Mais antigos'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Carteira Destino</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredWithdrawals.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted-foreground">
                  Nenhum saque encontrado
                </td>
              </tr>
            ) : (
              filteredWithdrawals.map((withdrawal) => (
                <tr
                  key={withdrawal.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => window.open(`/withdrawals/${withdrawal.id}`, '_blank')}
                >
                  <td className="px-4 py-3 text-sm text-foreground">{withdrawal.id.substring(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {format(parseISO(withdrawal.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {formatter.format(withdrawal.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={getStatusBadge(withdrawal.status)}>
                      {withdrawal.getStatusLabel()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {withdrawal.destinationWallet || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentWithdrawalsTable;
