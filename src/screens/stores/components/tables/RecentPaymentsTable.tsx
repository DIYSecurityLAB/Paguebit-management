import React, { useState, useMemo } from 'react';
import { Payment } from '../../../../domain/entities/Payment.entity';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface RecentPaymentsTableProps {
  payments: Payment[];
  limit?: number;
}

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'receipt_sent', label: 'Comprovante Enviado' },
  { value: 'review', label: 'Em Análise' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'not_approved', label: 'Não Aprovado' },
  { value: 'paid', label: 'Pago' },
  { value: 'withdrawal_processing', label: 'Em Processamento de Saque' },
  { value: 'rejected', label: 'Rejeitado' },
];

const RecentPaymentsTable: React.FC<RecentPaymentsTableProps> = ({ payments, limit = 5 }) => {
  const [status, setStatus] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  const filteredPayments = useMemo(() => {
    let filtered = payments;
    if (status) filtered = filtered.filter(p => p.status === status);
    filtered = [...filtered].sort((a, b) =>
      order === 'desc'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return filtered.slice(0, limit);
  }, [payments, status, order, limit]);

  // Formatador de moeda
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      receipt_sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      not_approved: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      withdrawal_processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted-foreground">
                  Nenhum pagamento encontrado
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => window.open(`/payments/${payment.id}`, '_blank')}
                >
                  <td className="px-4 py-3 text-sm text-foreground">{payment.id.substring(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {format(parseISO(payment.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {formatter.format(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {payment.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {payment.transactionType === 'static' ? 'Estático' : 
                    payment.transactionType === 'dynamic' ? 'Dinâmico' : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={getStatusBadge(payment.status)}>
                      {payment.getStatusLabel()}
                    </span>
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

export default RecentPaymentsTable;
