import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../../../lib/utils';

interface TransactionTypeChartProps {
  payments: Payment[];
}

const TransactionTypeChart: React.FC<TransactionTypeChartProps> = ({ payments }) => {
  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!payments || !payments.length) return [];

    const staticPayments = payments.filter(p => p.transactionType === 'static');
    const dynamicPayments = payments.filter(p => p.transactionType === 'dynamic');
    const otherPayments = payments.filter(p => p.transactionType !== 'static' && p.transactionType !== 'dynamic');
    
    const staticApproved = staticPayments.filter(p => ['approved', 'paid'].includes(p.status));
    const staticPending = staticPayments.filter(p => ['pending', 'receipt_sent', 'review'].includes(p.status));
    const staticRejected = staticPayments.filter(p => ['rejected', 'not_approved'].includes(p.status));
    
    const dynamicApproved = dynamicPayments.filter(p => ['approved', 'paid'].includes(p.status));
    const dynamicPending = dynamicPayments.filter(p => ['pending', 'receipt_sent', 'review'].includes(p.status));
    const dynamicRejected = dynamicPayments.filter(p => ['rejected', 'not_approved'].includes(p.status));
    
    const otherApproved = otherPayments.filter(p => ['approved', 'paid'].includes(p.status));
    const otherPending = otherPayments.filter(p => ['pending', 'receipt_sent', 'review'].includes(p.status));
    const otherRejected = otherPayments.filter(p => ['rejected', 'not_approved'].includes(p.status));

    return [
      {
        name: 'Estático',
        aprovado: staticApproved.reduce((sum, p) => sum + p.amount, 0),
        pendente: staticPending.reduce((sum, p) => sum + p.amount, 0),
        rejeitado: staticRejected.reduce((sum, p) => sum + p.amount, 0),
        total: staticPayments.reduce((sum, p) => sum + p.amount, 0),
        count: staticPayments.length,
      },
      {
        name: 'Dinâmico',
        aprovado: dynamicApproved.reduce((sum, p) => sum + p.amount, 0),
        pendente: dynamicPending.reduce((sum, p) => sum + p.amount, 0),
        rejeitado: dynamicRejected.reduce((sum, p) => sum + p.amount, 0),
        total: dynamicPayments.reduce((sum, p) => sum + p.amount, 0),
        count: dynamicPayments.length,
      },
      {
        name: 'Outros',
        aprovado: otherApproved.reduce((sum, p) => sum + p.amount, 0),
        pendente: otherPending.reduce((sum, p) => sum + p.amount, 0),
        rejeitado: otherRejected.reduce((sum, p) => sum + p.amount, 0),
        total: otherPayments.reduce((sum, p) => sum + p.amount, 0),
        count: otherPayments.length,
      },
    ].filter(item => item.count > 0);
  }, [payments]);

  if (chartData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">Sem dados disponíveis para exibição</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis dataKey="name" />
        <YAxis 
          tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
        />
        <Tooltip 
          formatter={(value: number) => [formatCurrency(value), 'Valor']}
          labelFormatter={(label) => `Tipo: ${label}`}
        />
        <Legend />
        <Bar 
          dataKey="aprovado" 
          name="Aprovado" 
          fill="#10b981" 
          barSize={40} 
          stackId="stack"
        />
        <Bar 
          dataKey="pendente" 
          name="Pendente" 
          fill="#f59e0b" 
          barSize={40} 
          stackId="stack"
        />
        <Bar 
          dataKey="rejeitado" 
          name="Rejeitado" 
          fill="#ef4444" 
          barSize={40}
          stackId="stack"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TransactionTypeChart;
 
