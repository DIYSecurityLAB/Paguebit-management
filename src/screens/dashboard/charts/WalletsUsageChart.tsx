import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
 import { formatCurrency } from '../../../utils/format';

import { Payment } from '../../../domain/entities/Payment.entity';
import { Withdrawal } from '../../../domain/entities/Withdrawal.entity';

interface Props {
  payments: Payment[];
  withdrawals: Withdrawal[];
  loading?: boolean;
  type: 'payment' | 'withdrawal';  // Tipo de transação a mostrar
  height?: number;
}

// Mapeia os tipos de carteira para nomes em português
const WALLET_LABELS: Record<string, string> = {
  'LiquidAddress': 'Liquid',
  'OnChainAddress': 'Bitcoin On-Chain',
  'LightningAddress': 'Lightning',
  'TronAddress': 'Tron',
  'PolygonAddress': 'Polygon',
  'other': 'Outras'
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6666'];

export default function WalletsUsageChart({ payments, withdrawals, type, loading, height = 250 }: Props) {
  const data = useMemo(() => {
    const walletCounts: Record<string, { count: number; amount: number }> = {};

    if (type === 'payment') {
      // Analisar pagamentos usando a entidade Payment
      payments.forEach(paymentModel => {
        let payment: Payment;
        try {
          payment = Payment.fromModel(paymentModel as any);
        } catch {
          return;
        }
        // Considera walletType se existir
        const walletType = (payment as any).walletType || '';
        if (!walletType) return;
        if (!walletCounts[walletType]) {
          walletCounts[walletType] = { count: 0, amount: 0 };
        }
        walletCounts[walletType].count += 1;
        walletCounts[walletType].amount += payment.amount || 0;
      });
    } else {
      // Analisar saques usando a entidade Withdrawal
      withdrawals.forEach(withdrawalModel => {
        let withdrawal: Withdrawal;
        try {
          withdrawal = Withdrawal.fromModel(withdrawalModel as any);
        } catch {
          return;
        }
        const walletType = withdrawal.destinationWalletType || '';
        if (!walletType) return;
        if (!walletCounts[walletType]) {
          walletCounts[walletType] = { count: 0, amount: 0 };
        }
        walletCounts[walletType].count += 1;
        walletCounts[walletType].amount += withdrawal.amount || 0;
      });
    }
    
    // Converter para o formato do gráfico
    return Object.entries(walletCounts)
      .map(([walletType, data]) => ({
        walletType,
        walletLabel: WALLET_LABELS[walletType] || walletType,
        ...data
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments, withdrawals, type]);

  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;

  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
      Sem dados disponíveis
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="walletLabel"
          cx="50%"
          cy="50%"
          outerRadius={height / 3}
          innerRadius={height / 6}
          paddingAngle={2}
        >
          {data.map((entry, idx) => (
            <Cell key={entry.walletType} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name, props) => [
            <span style={{ color: '#00C49F' }}>
              {formatCurrency(value as number)} ({props.payload.count} transações)
            </span>, 
            name
          ]}
          contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }}
          labelStyle={{ color: '#fff' }}
        />
        <Legend layout="vertical" verticalAlign="middle" align="right" fontSize={11} />
      </PieChart>
    </ResponsiveContainer>
  );
}
