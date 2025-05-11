import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/format';

interface Props {
  paymentsByStatus: Record<string, { count: number; amount: number }>;
  loading?: boolean;
  height?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6666', '#66CC99'];

export default function PaymentsStatusChart({ paymentsByStatus, loading, height = 250 }: Props) {
  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;
  
  const data = Object.entries(paymentsByStatus).map(([status, { amount }]) => ({
    status,
    amount,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={height / 3}
          innerRadius={height / 6}
          paddingAngle={2}
        >
          {data.map((entry, idx) => (
            <Cell key={entry.status} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Legend layout="vertical" verticalAlign="middle" align="right" fontSize={11} />
      </PieChart>
    </ResponsiveContainer>
  );
}
