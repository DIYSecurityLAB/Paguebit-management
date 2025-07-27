import React, { useMemo } from 'react';
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Payment } from '../../data/models/types';
import { formatCurrency } from '../../utils/format';

interface Props {
  payments: Payment[];
  loading?: boolean;
  height?: number;
}

// Ordem lógica do funil de pagamentos
const FUNNEL_ORDER = [
  'pending', 
  'receipt_sent', 
  'under_review', 
  'approved', 
  'paid'
];

// Mapeamento de status em inglês para português
const STATUS_LABELS: Record<string, string> = {
  'pending': 'Pendente',
  'receipt_sent': 'Comprovante Enviado',
  'under_review': 'Em Análise',
  'approved': 'Aprovado',
  'not_approved': 'Não Aprovado',
  'paid': 'Pago',
  'withdrawal_processing': 'Em Processamento',
  'unknown': 'Desconhecido'
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PaymentsFunnelChart({ payments, loading, height = 250 }: Props) {
  const data = useMemo(() => {
    // Agrupar pagamentos por status
    const byStatus: Record<string, number> = {};
    payments.forEach(p => {
      const status = p.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    
    // Converter para formato do funil e ordenar
    return FUNNEL_ORDER
      .filter(status => byStatus[status] > 0)
      .map(status => ({
        status,
        statusLabel: STATUS_LABELS[status] || status,
        value: byStatus[status],
        percentage: Math.round((byStatus[status] / payments.length) * 100)
      }));
  }, [payments]);

  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;

  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
      Sem dados disponíveis
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <FunnelChart>
        <Tooltip 
          contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }}
          formatter={(value, name, props) => [
            <span style={{ color: '#00C49F' }}>
              {`${value} pagamentos (${props.payload.percentage}%)`}
            </span>, 
            name
          ]}
          labelStyle={{ color: '#fff' }}
        />
        <Funnel
          dataKey="value"
          nameKey="statusLabel"
          data={data}
          isAnimationActive
          labelLine={false}
        >
          <LabelList 
            position="right" 
            fill="#fff" 
            stroke="none" 
            dataKey="statusLabel" 
          />
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
