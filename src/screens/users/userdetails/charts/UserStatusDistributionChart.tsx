import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../../../utils/format';

interface StatusDataItem {
  status: string;
  count: number;
  amount: number;
}

interface UserStatusDistributionChartProps {
  statusData: StatusDataItem[];
}

export default function UserStatusDistributionChart({ statusData }: UserStatusDistributionChartProps) {
  // Cores para o gráfico de pizza
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Funções de formatação para os gráficos
  const formatCurrencyValue = (value: number): string => {
    return formatCurrency(value);
  };
  
  // Função para renderizar o rótulo do gráfico de pizza
  const renderPieLabel = (entry: { status: string }): string => {
    return entry.status;
  };

  return (
    <div className="h-64">
      {statusData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              dataKey="amount"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={renderPieLabel}
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatCurrencyValue(value)}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Sem dados para exibir</p>
        </div>
      )}
    </div>
  );
}
