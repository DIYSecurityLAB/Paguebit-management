import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, addDays, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WithdrawalTimeSeriesChartProps {
  withdrawals: Withdrawal[];
  timeFrame: 'day' | 'week' | 'month';
}

const WithdrawalTimeSeriesChart: React.FC<WithdrawalTimeSeriesChartProps> = ({ withdrawals, timeFrame }) => {
  // Formatador de moeda
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Processamento dos dados para o gráfico baseado no timeFrame selecionado
  const chartData = useMemo(() => {
    if (!withdrawals.length) return [];

    const sortedWithdrawals = [...withdrawals]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    if (sortedWithdrawals.length === 0) return [];
    
    let current: Date;
    let end: Date;
    let addFn: (date: Date, amount: number) => Date;
    let formatStr: string;

    const firstDate = parseISO(sortedWithdrawals[0].createdAt);
    const lastDate = parseISO(sortedWithdrawals[sortedWithdrawals.length - 1].createdAt);

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
      completed: number;
      pending: number;
      failed: number;
      total: number;
    }> = [];
    
    while (current < end) {
      const nextDate: Date = addFn(current, 1);
      
      const periodWithdrawals = sortedWithdrawals.filter(withdrawal => {
        const date = parseISO(withdrawal.createdAt);
        return date >= current && date < nextDate;
      });
      
      const completed = periodWithdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0);
      
      const pending = periodWithdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0);
      
      const failed = periodWithdrawals
        .filter(w => w.status === 'failed')
        .reduce((sum, w) => sum + w.amount, 0);
      
      result.push({
        date: format(current, formatStr, { locale: ptBR }),
        completed,
        pending,
        failed,
        total: completed + pending + failed
      });
      
      current = nextDate;
    }
    
    return result;
  }, [withdrawals, timeFrame]);

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
          dataKey="completed" 
          stackId="1" 
          stroke="#10b981" 
          fill="#10b981" 
          fillOpacity={0.6} 
          name="Concluído"
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
          dataKey="failed" 
          stackId="1" 
          stroke="#ef4444" 
          fill="#ef4444" 
          fillOpacity={0.6}
          name="Falha" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default WithdrawalTimeSeriesChart;
 
