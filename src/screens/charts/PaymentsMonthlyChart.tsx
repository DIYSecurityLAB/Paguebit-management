import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Payment } from '../../models/types';
import { formatCurrency } from '../../utils/format';

interface Props {
  payments: Payment[];
  loading?: boolean;
  height?: number;
}

export default function PaymentsMonthlyChart({ payments, loading, height = 250 }: Props) {
  const data = useMemo(() => {
    const byMonth: Record<string, number> = {};
    payments.forEach(p => {
      if (p.createdAt) {
        const date = new Date(p.createdAt);
        const month = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
        byMonth[month] = (byMonth[month] || 0) + (p.amount || 0);
      }
    });
    
    // Ordenar por data
    return Object.entries(byMonth)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split(' ');
        const [monthB, yearB] = b.month.split(' ');
        return yearA === yearB 
          ? monthA.localeCompare(monthB) 
          : yearA.localeCompare(yearB);
      });
  }, [payments]);

  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false} 
          fontSize={11} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          fontSize={11}
          tickFormatter={(value) => formatCurrency(value, { compact: true })}
        />
        <Tooltip contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }} formatter={(value) => formatCurrency(value as number)} />
        <Area 
          type="monotone" 
          dataKey="amount" 
          stroke="#00C49F" 
          fill="#00C49F" 
          fillOpacity={0.2} 
          strokeWidth={2}
          name="Valor"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
