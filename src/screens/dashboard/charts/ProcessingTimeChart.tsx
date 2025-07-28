import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Payment as PaymentEntity } from '../../../domain/entities/Payment.entity';
import { Withdrawal as WithdrawalEntity } from '../../../domain/entities/Withdrawal.entity';
 
interface Props {
  payments: PaymentEntity[];
  withdrawals: WithdrawalEntity[];
  loading?: boolean;
  height?: number;
}

// Mapeia status para nomes em português
const STATUS_TRANSITIONS = [
  { id: 'receipt_to_approval', label: 'Comprovante até Aprovação' },
  { id: 'approval_to_payment', label: 'Aprovação até Pagamento' },
  { id: 'withdrawal_processing', label: 'Processamento de Saques' }
];

export default function ProcessingTimeChart({ payments, withdrawals, loading, height = 250 }: Props) {
  const data = useMemo(() => {
    // Para simplicidade, vamos usar um cálculo aproximado
    // Em um cenário real, seria necessário ter timestamps para cada mudança de status
    
    // 1. Tempo médio entre receipt_sent e approved
    let receiptToApprovalTimes: number[] = [];
    
    // 2. Tempo médio entre approved e paid
    let approvalToPaymentTimes: number[] = [];
    
    const withdrawalProcessingTimes: number[] = [];
    
    // Use entidades para validação e acesso seguro
    payments.forEach(paymentModel => {
      let payment: PaymentEntity;
      try {
        payment = PaymentEntity.fromModel(paymentModel);
      } catch {
        return; // ignora pagamentos inválidos
      }
      if (payment.status === 'approved' && payment.createdAt && payment.updatedAt) {
        const created = new Date(payment.createdAt).getTime();
        const updated = new Date(payment.updatedAt).getTime();
        const diffInHours = (updated - created) / (1000 * 60 * 60);
        receiptToApprovalTimes.push(diffInHours);
      }
      
      if (payment.status === 'paid' && payment.createdAt && payment.updatedAt) {
        const created = new Date(payment.createdAt).getTime();
        const updated = new Date(payment.updatedAt).getTime();
        const diffInHours = (updated - created) / (1000 * 60 * 60);
        approvalToPaymentTimes.push(diffInHours);
      }
    });
    
    withdrawals.forEach(withdrawalModel => {
      let withdrawal: WithdrawalEntity;
      try {
        withdrawal = WithdrawalEntity.fromModel(withdrawalModel);
      } catch {
        return; // ignora saques inválidos
      }
      if (withdrawal.status === 'completed' && withdrawal.createdAt && withdrawal.completedAt) {
        const created = new Date(withdrawal.createdAt).getTime();
        const completed = new Date(withdrawal.completedAt).getTime();
        const diffInHours = (completed - created) / (1000 * 60 * 60);
        withdrawalProcessingTimes.push(diffInHours);
      }
    });
    
    // Calcular médias
    const getAverage = (arr: number[]) => arr.length > 0 ? 
      arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
    
    return [
      {
        id: 'receipt_to_approval',
        label: 'Comprovante até Aprovação',
        hours: getAverage(receiptToApprovalTimes),
        count: receiptToApprovalTimes.length
      },
      {
        id: 'approval_to_payment',
        label: 'Aprovação até Pagamento',
        hours: getAverage(approvalToPaymentTimes),
        count: approvalToPaymentTimes.length
      },
      {
        id: 'withdrawal_processing',
        label: 'Processamento de Saques',
        hours: getAverage(withdrawalProcessingTimes),
        count: withdrawalProcessingTimes.length
      }
    ];
  }, [payments, withdrawals]);

  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={11} />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          fontSize={11}
          label={{ value: 'Horas', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--muted-foreground)' }}
        />
        <Tooltip 
          contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }}
          formatter={(value, name) => [
            <span style={{ color: '#00C49F' }}>
              {parseFloat(value as string).toFixed(1)} horas
            </span>, 
            'Tempo Médio'
          ]}
          labelStyle={{ color: '#fff' }}
        />
        <Bar 
          dataKey="hours" 
          fill="#00C49F" 
          radius={[4, 4, 0, 0]} 
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
