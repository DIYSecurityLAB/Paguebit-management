import React from 'react';
import { Payment } from '../../../models/types';
import Button from '../../../components/Button'; // Verifica importação
import { List } from 'lucide-react';
import PaymentCard from './PaymentCard';

interface DoacoesReviewStepProps {
  payments: Payment[];
  currentIndex: number;
  decisions: Record<string, { status: 'approved' | 'not_approved'; notes?: string }>;
  observation: string;
  setObservation: (value: string) => void;
  onApprove: (payment: Payment) => void;
  onReject: (payment: Payment, observation: string) => void;
  onShowImage: (src: string) => void;
  onDownload: (payment: Payment) => void;
  onPrevious: () => void;
  onNext: () => void;
  onViewSummary: () => void;
  onSwitchToList: () => void;
}

export default function DoacoesReviewStep({
  payments,
  currentIndex,
  decisions,
  observation,
  setObservation,
  onApprove,
  onReject,
  onShowImage,
  onDownload,
  onPrevious,
  onNext,
  onViewSummary,
  onSwitchToList
}: DoacoesReviewStepProps) {
  const payment = payments[currentIndex];
  if (!payment) return null;
  
  return (
    <div className="max-w-lg mx-auto mt-4 p-2 sm:p-4 bg-card border border-border rounded-lg shadow">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-bold">Conferência Bancária de Doações</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={onSwitchToList}
          leftIcon={<List className="h-4 w-4" />}
        >
          Lista
        </Button>
      </div>
      
      <div className="mb-2 text-xs text-muted-foreground">
        Pagamento {currentIndex + 1} de {payments.length}
      </div>
      
      <PaymentCard
        payment={payment}
        decision={decisions[payment.id]}
        onApprove={() => onApprove(payment)}
        onReject={() => onReject(payment, observation)}
        observation={observation}
        setObservation={setObservation}
        onShowImage={() => onShowImage(payment.receipt?.startsWith('data:') ? payment.receipt : `data:image/jpeg;base64,${payment.receipt}`)}
        showActions={!decisions[payment.id]}
        compact
        onDownload={() => onDownload(payment)}
      />
      
      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          Anterior
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onNext}
          disabled={currentIndex === payments.length - 1}
        >
          Próximo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewSummary}
        >
          Resumo
        </Button>
      </div>
    </div>
  );
}
