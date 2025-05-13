import React from 'react';
import { Payment } from '../../../models/types';
import Button from '../../../components/Button';

interface DoacoesSummaryStepProps {
  payments: Payment[];
  decisions: Record<string, { status: 'approved' | 'not_approved'; notes?: string }>;
  whatsappLink: string;
  onReviewAgain: () => void;
}

export default function DoacoesSummaryStep({
  payments,
  decisions,
  whatsappLink,
  onReviewAgain
}: DoacoesSummaryStepProps) {
  const approved = payments.filter(p => decisions[p.id]?.status === 'approved');
  const rejected = payments.filter(p => decisions[p.id]?.status === 'not_approved');
  
  return (
    <div className="max-w-xl mx-auto mt-6 p-4 bg-card border border-border rounded-lg shadow">
      <h2 className="text-lg font-bold mb-3">Resumo da Conferência</h2>
      
      <div className="mb-3">
        <strong>Aprovados ({approved.length}):</strong>
        {approved.length === 0 ? (
          <p className="ml-6 text-muted-foreground text-sm italic">Nenhum pagamento aprovado</p>
        ) : (
          <ul className="list-disc ml-6">
            {approved.map(p => (
              <li key={p.id}>
                Valor: R$ {p.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Nome: {p.payerName || '-'}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mb-3">
        <strong>Não aprovados ({rejected.length}):</strong>
        {rejected.length === 0 ? (
          <p className="ml-6 text-muted-foreground text-sm italic">Nenhum pagamento rejeitado</p>
        ) : (
          <ul className="list-disc ml-6">
            {rejected.map(p => (
              <li key={p.id}>
                Valor: R$ {p.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Nome: {p.payerName || '-'}
                <br />
                <span className="text-xs text-red-500">Motivo: {decisions[p.id]?.notes || '-'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="flex gap-2 mt-4 justify-between">
        <Button variant="outline" onClick={onReviewAgain}>
          Revisar novamente
        </Button>
        
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md bg-green-600 text-white px-4 py-2 text-sm font-medium shadow hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Enviar para WhatsApp
        </a>
      </div>
    </div>
  );
}
