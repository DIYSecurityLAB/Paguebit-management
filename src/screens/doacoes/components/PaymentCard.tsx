import React from 'react';
import { Payment } from '../../../models/types';
import Button from '../../../components/Button';
import { Eye, Download, CheckCircle, XCircle, ZoomIn } from 'lucide-react';

interface PaymentCardProps {
  payment: Payment;
  decision?: { status: 'approved' | 'not_approved'; notes?: string };
  onApprove: () => void;
  onReject: () => void;
  observation: string;
  setObservation: (v: string) => void;
  onShowImage: () => void;
  showActions?: boolean;
  compact?: boolean;
  onDownload: () => void;
}

export default function PaymentCard({
  payment,
  decision,
  onApprove,
  onReject,
  observation,
  setObservation,
  onShowImage,
  showActions = true,
  compact = false,
  onDownload,
}: PaymentCardProps) {
  if (!payment) return null;
  
  // Obter URL da imagem do recibo
  const receiptSrc = payment.receipt?.startsWith('data:') 
    ? payment.receipt 
    : `data:image/jpeg;base64,${payment.receipt}`;
  
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Layout completamente redesenhado - imagem grande à esquerda, detalhes à direita */}
      <div className="flex flex-col md:flex-row">
        {/* Parte da imagem - grande, ocupando toda a altura, à esquerda */}
        <div className="md:w-2/3 lg:w-3/4 relative group">
          {/* Imagem grande e sem margens */}
          <div 
            className="relative cursor-pointer w-full h-[400px] md:h-[500px] overflow-hidden bg-black/5"
            onClick={onShowImage}
          >
            <img
              src={receiptSrc}
              alt="Comprovante"
              className="w-full h-full object-contain"
            />
            
            {/* Overlay com ícone de zoom ao passar o mouse */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity duration-200">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                <ZoomIn className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Barra de ações para o comprovante */}
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <Button size="sm" variant="outline" className="bg-card/80 backdrop-blur-sm" onClick={onShowImage} leftIcon={<Eye className="h-4 w-4" />}>
              Ampliar
            </Button>
            <Button size="sm" variant="outline" className="bg-card/80 backdrop-blur-sm" onClick={onDownload} leftIcon={<Download className="h-4 w-4" />}>
              Baixar
            </Button>
          </div>
        </div>
        
        {/* Seção de detalhes e ações - à direita, com fundo sutil diferente */}
        <div className="md:w-1/3 lg:w-1/4 p-4 bg-muted/10 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-4 pb-2 border-b">Detalhes da Doação</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground">Valor:</label>
                <span className="text-xl font-semibold">
                  R$ {payment.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground">Nome do doador:</label>
                <span className="font-medium">
                  {payment.payerName || <span className="text-muted-foreground italic">Não informado</span>}
                </span>
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="mt-auto">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Observação:</label>
                <p className="text-xs text-muted-foreground mb-1">Obrigatória para rejeitar a doação</p>
                <textarea
                  className="w-full border border-input rounded p-2 text-sm bg-background text-foreground"
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                  rows={3}
                  placeholder="Motivo da rejeição (se for rejeitá-la)"
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button
                  variant="success"
                  onClick={onApprove}
                  leftIcon={<CheckCircle className="h-4 w-4" />}
                >
                  Aprovar
                </Button>
                <Button
                  variant="danger"
                  onClick={onReject}
                  leftIcon={<XCircle className="h-4 w-4" />}
                >
                  Rejeitar
                </Button>
              </div>
            </div>
          )}
          
          {decision && (
            <div className={`mt-4 p-3 rounded-md ${decision.status === 'approved' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <span className={`font-semibold ${decision.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                {decision.status === 'approved' ? 'Aprovado' : 'Não aprovado'}
              </span>
              {decision.notes && (
                <p className="mt-1 text-xs">
                  {decision.notes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
