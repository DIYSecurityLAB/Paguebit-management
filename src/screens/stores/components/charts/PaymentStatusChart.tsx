import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PaymentStatusChartProps {
  payments: Payment[];
}

const COLORS = [
  '#10B981', // green
  '#F59E0B', // amber
  '#3B82F6', // blue
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6B7280', // gray
  '#14B8A6', // teal
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  receipt_sent: "Comprovante Enviado",
  review: "Em Análise",
  approved: "Aprovado",
  not_approved: "Não Aprovado",
  paid: "Pago",
  withdrawal_processing: "Em Processamento de Saque",
  rejected: "Rejeitado",
};

const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const PaymentStatusChart: React.FC<PaymentStatusChartProps> = ({ payments }) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [activeMetric, setActiveMetric] = useState<'amount' | 'count'>('amount');

  const statusData = useMemo(() => {
    const statusCounts: Record<string, { count: number, amount: number }> = {};
    payments.forEach(payment => {
      if (!statusCounts[payment.status]) {
        statusCounts[payment.status] = { count: 0, amount: 0 };
      }
      statusCounts[payment.status].count += 1;
      statusCounts[payment.status].amount += payment.amount;
    });
    return Object.entries(statusCounts).map(([status, data]) => ({
      name: status,
      statusLabel: STATUS_LABELS[status] || status,
      count: data.count,
      amount: data.amount,
      value: data.count,
    }));
  }, [payments]);

  if (statusData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">Sem dados disponíveis para exibição</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => setActiveMetric('count')}
            className={`px-2 py-1 text-xs rounded ${
              activeMetric === 'count' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Quantidade
          </button>
          <button
            onClick={() => setActiveMetric('amount')}
            className={`px-2 py-1 text-xs rounded ${
              activeMetric === 'amount' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Valor
          </button>
        </div>
      </div>
      <div className="flex flex-col flex-1 gap-4 items-center">
        <div className="flex-1 min-w-0 flex flex-col items-center w-full">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey={activeMetric}
                nameKey="statusLabel"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                onClick={(_, idx) => setActiveIndex(idx)}
                activeIndex={activeIndex}
                label={({ name, percent }) => `${STATUS_LABELS[name] || name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusData.map((entry, idx) => (
                  <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  if (activeMetric === 'amount') {
                    return [
                      formatter.format(value) + ` (${props.payload.count} transações)`,
                      STATUS_LABELS[name] || name
                    ];
                  }
                  return [
                    `${value} transações (${formatter.format(props.payload.amount)})`,
                    STATUS_LABELS[name] || name
                  ];
                }}
                contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }}
                labelStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legenda/descrição abaixo do gráfico, responsiva e funcional */}
          <div className="w-full mt-4">
            <div className="flex flex-wrap justify-center gap-2">
              {statusData.map((entry, idx) => (
                <div
                  key={entry.name}
                  className={`flex items-center gap-1 text-xs cursor-pointer ${activeIndex === idx ? 'font-semibold' : ''}`}
                  onClick={() => setActiveIndex(activeIndex === idx ? undefined : idx)}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span>{entry.statusLabel}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({activeMetric === 'count' ? entry.count : formatter.format(entry.amount)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusChart;
 