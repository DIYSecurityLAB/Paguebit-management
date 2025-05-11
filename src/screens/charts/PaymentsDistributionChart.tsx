import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Payment } from '../../models/types';
import { formatCurrency } from '../../utils/format';

interface Props {
  payments: Payment[];
  loading?: boolean;
  height?: number;
}

// Definir faixas de valores para o histograma
const VALUE_RANGES = [
  { min: 0, max: 100, label: 'Até R$100' },
  { min: 100, max: 500, label: 'R$100 a R$500' },
  { min: 500, max: 1000, label: 'R$500 a R$1.000' },
  { min: 1000, max: 5000, label: 'R$1.000 a R$5.000' },
  { min: 5000, max: 10000, label: 'R$5.000 a R$10.000' },
  { min: 10000, max: Infinity, label: 'Acima de R$10.000' },
];

export default function PaymentsDistributionChart({ payments, loading, height = 250 }: Props) {
  const data = useMemo(() => {
    // Filtrar apenas pagamentos com status relevante
    const relevantPayments = payments.filter(p => 
      ['paid', 'approved', 'withdrawal_processing'].includes(p.status)
    );
    
    // Inicializar contadores para cada faixa
    const distribution = VALUE_RANGES.map(range => ({
      ...range,
      count: 0,
      amount: 0
    }));
    
    // Contar pagamentos por faixa
    relevantPayments.forEach(payment => {
      const amount = payment.amount || 0;
      const range = distribution.find(r => amount >= r.min && amount < r.max);
      if (range) {
        range.count += 1;
        range.amount += amount;
      }
    });
    
    return distribution;
  }, [payments]);

  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="label" 
          axisLine={false} 
          tickLine={false} 
          fontSize={11}
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          allowDecimals={false} 
          axisLine={false} 
          tickLine={false} 
          fontSize={11} 
        />
        <Tooltip 
          contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }}
          formatter={(value, name) => [
            <span style={{ color: '#00C49F' }}>{value}</span>, 
            name === 'count' ? 'Pagamentos' : 'Total'
          ]}
          labelStyle={{ color: '#fff' }}
        />
        <Bar 
          name="Pagamentos" 
          dataKey="count" 
          fill="#8884d8" 
          radius={[4, 4, 0, 0]} 
          maxBarSize={50} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
