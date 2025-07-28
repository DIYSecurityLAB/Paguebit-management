import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, addDays, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Payment {
  createdAt: string;
  status: string;
  amount: number;
}

interface PaymentTimeSeriesChartProps {
  payments: Payment[];
  timeFrame: 'day' | 'week' | 'month';
}

const PaymentTimeSeriesChart: React.FC<PaymentTimeSeriesChartProps> = ({ payments, timeFrame }) => {
  // Formatador de moeda
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Processamento dos dados para o gráfico baseado no timeFrame selecionado
  const chartData = useMemo(() => {
    if (!payments.length) return [];

    const sortedPayments = [...payments]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (sortedPayments.length === 0) return [];

    let current: Date;
    let end: Date;
    let addFn: (date: Date, amount: number) => Date;
    let formatStr: string;

    const firstDate = parseISO(sortedPayments[0].createdAt);
    const lastDate = parseISO(sortedPayments[sortedPayments.length - 1].createdAt);

    switch(timeFrame) {
      case 'day':
        current = startOfDay(firstDate);
        end = startOfDay(addDays(lastDate, 1));
        addFn = addDays;
        formatStr = 'dd/MM';
        break;
      case 'week':
        current = startOfWeek(firstDate, { weekStartsOn: 1 });
        end = startOfWeek(addWeeks(lastDate, 1), { weekStartsOn: 1 });
        addFn = addWeeks;
        formatStr = "'Sem' w - MMM";
        break;
      case 'month':
      default:
        current = startOfMonth(firstDate);
        end = startOfMonth(addMonths(lastDate, 1));
        addFn = addMonths;
        formatStr = 'MMM/yyyy';
    }

    const result: Array<{
      date: string;
      approved: number;
      pending: number;
      rejected: number;
      total: number;
    }> = [];

    while (current < end) {
      const nextDate: Date = addFn(current, 1);

      const periodPayments = sortedPayments.filter(payment => {
        const date = parseISO(payment.createdAt);
        return date >= current && date < nextDate;
      });

      const approved = periodPayments
        .filter(p => ['approved', 'paid'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);

      const pending = periodPayments
        .filter(p => ['pending', 'receipt_sent', 'review'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);

      const rejected = periodPayments
        .filter(p => ['rejected', 'not_approved'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);

      result.push({
        date: format(current, formatStr, { locale: ptBR }),
        approved,
        pending,
        rejected,
        total: approved + pending + rejected
      });

      current = nextDate;
    }

    return result;
  }, [payments, timeFrame]);

  if (chartData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">Sem dados disponíveis para exibição</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatter.format(value).replace('R$', '')}
        />
        <Tooltip 
          formatter={(value: number) => formatter.format(value)}
          labelFormatter={(label) => `Período: ${label}`}
        />
        <Area 
          type="monotone" 
          dataKey="approved" 
          stackId="1" 
          stroke="#10b981" 
          fill="#10b981" 
          fillOpacity={0.6} 
          name="Aprovado/Pago"
        />
        <Area 
          type="monotone" 
          dataKey="pending" 
          stackId="1" 
          stroke="#f59e0b" 
          fill="#f59e0b" 
          fillOpacity={0.6}
          name="Pendente" 
        />
        <Area 
          type="monotone" 
          dataKey="rejected" 
          stackId="1" 
          stroke="#ef4444" 
          fill="#ef4444" 
          fillOpacity={0.6}
          name="Rejeitado" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default PaymentTimeSeriesChart;
 