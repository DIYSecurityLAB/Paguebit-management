import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, addDays, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../../../../lib/utils';

interface Payment {
  createdAt: string;
  status: string;
  amount: number;
  storeId?: string;
}

interface Withdrawal {
  createdAt: string;
  status: string;
  amount: number;
  storeId?: string;
}

interface IncomeExpenseComparisonChartProps {
  payments: Payment[];
  withdrawals: Withdrawal[];
  timeFrame: 'day' | 'week' | 'month';
  storeId?: string;
}

const IncomeExpenseComparisonChart: React.FC<IncomeExpenseComparisonChartProps> = ({
  payments,
  withdrawals,
  timeFrame,
  storeId
}) => {
  // Filtra por storeId se informado
  const filteredPayments = storeId
    ? payments.filter(p => p.storeId === storeId)
    : payments;
  const filteredWithdrawals = storeId
    ? withdrawals.filter(w => w.storeId === storeId)
    : withdrawals;

  const chartData = useMemo(() => {
    if (!filteredPayments.length && !filteredWithdrawals.length) return [];

    const allDates = [
      ...filteredPayments.map(p => new Date(p.createdAt)),
      ...filteredWithdrawals.map(w => new Date(w.createdAt))
    ].sort((a, b) => a.getTime() - b.getTime());

    if (allDates.length === 0) return [];

    let current: Date;
    let end: Date;
    let addFn: (date: Date, amount: number) => Date;
    let formatStr: string;

    const firstDate = allDates[0];
    const lastDate = allDates[allDates.length - 1];

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
      entrada: number;
      saida: number;
      saldo: number;
    }> = [];

    while (current < end) {
      const nextDate: Date = addFn(current, 1);

      const periodPayments = filteredPayments.filter(payment => {
        const date = parseISO(payment.createdAt);
        return date >= current && date < nextDate;
      });

      const periodWithdrawals = filteredWithdrawals.filter(withdrawal => {
        const date = parseISO(withdrawal.createdAt);
        return date >= current && date < nextDate;
      });

      const receivedIncome = periodPayments
        .filter(p => ['approved', 'paid'].includes(p.status))
        .reduce((sum, p) => sum + p.amount, 0);

      const withdrawnAmount = periodWithdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0);

      result.push({
        date: format(current, formatStr, { locale: ptBR }),
        entrada: receivedIncome,
        saida: withdrawnAmount,
        saldo: receivedIncome - withdrawnAmount
      });

      current = nextDate;
    }

    return result;
  }, [filteredPayments, filteredWithdrawals, timeFrame]);

  if (chartData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">Sem dados disponíveis para exibição</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis dataKey="date" />
        <YAxis 
          tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
        />
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={(label) => `Período: ${label}`}
        />
        <Legend />
        <Bar 
          dataKey="entrada" 
          name="Entradas" 
          fill="#10b981" 
        />
        <Bar 
          dataKey="saida" 
          name="Saídas" 
          fill="#ef4444"
        />
        <Bar 
          dataKey="saldo" 
          name="Saldo" 
          fill="#3b82f6"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseComparisonChart;
