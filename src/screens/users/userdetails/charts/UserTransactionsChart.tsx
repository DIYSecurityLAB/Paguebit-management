import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../../../utils/format';

interface MonthlyDataItem {
  month: string;
  amount: number;
}

interface UserTransactionsChartProps {
  monthlyData: MonthlyDataItem[];
}

export default function UserTransactionsChart({ monthlyData }: UserTransactionsChartProps) {
  // Funções de formatação para os gráficos
  const formatCurrencyValue = (value: number): string => {
    return formatCurrency(value);
  };
  
  const formatAxisTick = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <div className="h-64">
      {monthlyData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis 
              tickFormatter={formatAxisTick}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrencyValue(value)}
            />
            <Legend />
            <Bar dataKey="amount" name="Valor" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Sem dados para exibir</p>
        </div>
      )}
    </div>
  );
}
