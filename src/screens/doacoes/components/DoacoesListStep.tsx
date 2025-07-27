import React from 'react';
import { Payment } from '../../../data/models/types';
import Button from '../../../components/Button';
import { Square } from 'lucide-react';
import PaymentCard from './PaymentCard';

interface DoacoesListStepProps {
  payments: Payment[];
  currentIndex: number;
  decisions: Record<string, { status: 'approved' | 'not_approved'; notes?: string }>;
  observation: string;
  setObservation: (value: string) => void;
  onApprove: (payment: Payment) => void;
  onReject: (payment: Payment, observation: string) => void;
  onShowImage: (src: string) => void;
  onDownload: (payment: Payment) => void;
  onViewSummary: () => void;
  onSwitchToModal: () => void;
}

export default function DoacoesListStep({
  payments,
  currentIndex,
  decisions,
  observation,
  setObservation,
  onApprove,
  onReject,
  onShowImage,
  onDownload,
  onViewSummary,
  onSwitchToModal
}: DoacoesListStepProps) {
  return (
    <div className="max-w-5xl mx-auto mt-4 p-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Conferência Bancária de Doações</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Total: {payments.length} pagamentos
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onSwitchToModal}
            leftIcon={<Square className="h-4 w-4" />}
          >
            Modal
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        {payments.map((payment, idx) => {
          const receiptSrc = payment.receipt?.startsWith('data:') ? payment.receipt : `data:image/jpeg;base64,${payment.receipt}`;
          return (
            <PaymentCard
              key={payment.id}
              payment={payment}
              decision={decisions[payment.id]}
              onApprove={() => onApprove(payment)}
              onReject={() => onReject(payment, idx === currentIndex ? observation : '')}
              observation={decisions[payment.id]?.status === 'not_approved' ? (decisions[payment.id]?.notes || '') : (idx === currentIndex ? observation : '')}
              setObservation={value => {
                if (idx === currentIndex) setObservation(value);
              }}
              onShowImage={() => onShowImage(receiptSrc)}
              showActions={!decisions[payment.id]}
              onDownload={() => onDownload(payment)}
            />
          );
        })}
      </div>
      
      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          onClick={onViewSummary}
        >
          Ir para Resumo
        </Button>
      </div>
    </div>
  );
}
