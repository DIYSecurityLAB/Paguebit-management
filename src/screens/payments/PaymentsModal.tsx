import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Download, CheckCircle, XCircle, ZoomIn, Copy } from 'lucide-react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import ImageViewer from '../../components/ImageViewer';
import { Payment, PaymentStatus } from '../../models/types';
import paymentRepository from '../../repository/payment-repository';
import { formatCurrency } from '../../utils/format';
import { toast } from 'sonner';
import apiClient from '../../datasource/api-client';
import OcrNameSuggestion from '../../components/OcrNameSuggestion';

interface PaymentsModalProps {
  payment: Payment;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentsModal({ payment, isOpen, onClose }: PaymentsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasFraguismo, setHasFraguismo] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation(
    (status: PaymentStatus) => paymentRepository.updatePaymentStatus(payment.id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('payments');
        toast.success('Status do pagamento atualizado com sucesso');
        onClose();
      },
      onError: () => {
        toast.error('Falha ao atualizar o status do pagamento');
      },
    }
  );

  const handleDownloadReceipt = async () => {
    if (!payment.receipt) return;

    try {
      setIsLoading(true);
      const fileName = `comprovante_${payment.email || 'pagamento'}_${format(new Date(payment.createdAt), 'yyyy-MM-dd')}_${payment.amount}.jpg`;
      
      // Verifica se já é um Data URL completo ou apenas a string base64
      const dataUrl = payment.receipt.startsWith('data:') 
        ? payment.receipt 
        : `data:image/jpeg;base64,${payment.receipt}`;
      
      // Download direto usando elemento <a>
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Comprovante baixado com sucesso');
    } catch (error) {
      toast.error('Falha ao baixar comprovante');
      console.error('Erro ao baixar comprovante:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (status: PaymentStatus) => {
    await updateStatusMutation.mutateAsync(status);
  };

  const renderActions = () => {
    const actions = [];

    if (payment.receipt) {
      actions.push(
        <div key="download-group" className="flex flex-col items-start w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleDownloadReceipt}
            isLoading={isLoading}
            leftIcon={<Download className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            Baixar Comprovante
          </Button>
        </div>
      );
    }

    if (payment.status === PaymentStatus.RECEIPT_SENT) {
      actions.push(
        <Button
          key="approve"
          variant="success"
          onClick={() => handleStatusUpdate(PaymentStatus.COMPLETED)}
          isLoading={updateStatusMutation.isLoading}
          leftIcon={<CheckCircle className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          Aprovar
        </Button>,
        <Button
          key="reject"
          variant="danger"
          onClick={() => handleStatusUpdate(PaymentStatus.REJECTED)}
          isLoading={updateStatusMutation.isLoading}
          leftIcon={<XCircle className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          Rejeitar
        </Button>
      );
    }

    return actions;
  };

  // Usar o receipt como está sem manipulação
  const receiptImageSrc = payment.receipt || '';

  // Função para copiar o ID do pagamento
  const handleCopyId = () => {
    navigator.clipboard.writeText(payment.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <>
      <Modal
        title="Detalhes do Pagamento"
        isOpen={isOpen}
        onClose={onClose}
        footer={renderActions()}
      >
        <div className="space-y-4">
          {/* Adiciona exibição do ID do pagamento */}
          <div>
            <label className="text-sm text-muted-foreground">ID do Pagamento</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs break-all">{payment.id}</span>
              <button
                type="button"
                className="p-1 rounded hover:bg-muted transition-colors"
                onClick={handleCopyId}
                title="Copiar ID"
              >
                <Copy className="h-4 w-4" />
              </button>
              {copied && (
                <span className="text-xs text-green-600 ml-1">Copiado!</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Valor</label>
              <p className="font-medium">{formatCurrency(payment.amount)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <div className="mt-1">
                <StatusBadge status={payment.status} />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Tipo de Transação</label>
              <p className="font-medium">{payment.transactionType === 'static' ? 'QR Estático' : 'QR Dinâmico'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Modo de Recebimento</label>
              <p className="font-medium">{payment.receivingMode === 'now' ? 'Imediato' : 'Armazenado'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Nome</label>
              <p className="font-medium">{(() => {
                const user = (payment as any).User;
                if (user) {
                  const firstName = user.firstName || '';
                  const lastName = user.lastName || '';
                  return [firstName, lastName].filter(Boolean).join(' ') || 'Não informado';
                }
                return 'Não informado';
              })()}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="font-medium truncate">{(payment as any).User?.email || payment.email || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Criado em</label>
              <p className="font-medium">
                {format(new Date(payment.createdAt), "dd 'de' MMM 'de' yyyy, HH:mm")}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Atualizado em</label>
              <p className="font-medium">
                {payment.updatedAt ? format(new Date(payment.updatedAt), "dd 'de' MMM 'de' yyyy, HH:mm") : '-'}
              </p>
            </div>
          </div>

          {payment.observation && (
            <div>
              <label className="text-sm text-muted-foreground">Observação</label>
              <p className="mt-1 text-foreground break-words">{payment.observation}</p>
            </div>
          )}

          {payment.qrCodeUrl && (
            <div>
              <label className="text-sm text-muted-foreground">QR Code</label>
              <div className="mt-2">
                <img
                  src={payment.qrCodeUrl}
                  alt="QR Code do Pagamento"
                  className="max-w-[200px] mx-auto"
                />
              </div>
              {payment.qrCopyPaste && (
                <div className="mt-2">
                  <label className="text-sm text-muted-foreground">Código para Copiar/Colar</label>
                  <div className="mt-1 p-2 bg-muted rounded-md">
                    <code className="text-xs sm:text-sm break-all">{payment.qrCopyPaste}</code>
                  </div>
                </div>
              )}
            </div>
          )}

          {payment.receipt && (
            <div>
              <div className="flex items-start justify-between flex-wrap gap-1 mb-2">
                <label className="text-sm font-medium text-muted-foreground">Comprovante</label>
                <div className="flex flex-col items-end">
                  <div className="text-xs text-muted-foreground">
                    {window.innerWidth > 640 ? 'Clique para ampliar' : 'Toque para ampliar'}
                  </div>
                  <OcrNameSuggestion
                    receipt={payment.receipt}
                    onFraguismoCheck={setHasFraguismo}
                  />
                  {/* AVISO extra caso não tenha "fraguismo" - mostrar só aqui */}
                </div>
              </div>
              {hasFraguismo === false && (
                <div className="text-xs text-red-500 font-semibold mb-2">
                  Atenção: o nome "fraguismo" NÃO foi encontrado no comprovante!
                </div>
              )}
              <div 
                className="relative group border border-border rounded-lg overflow-hidden aspect-[4/3] cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                onClick={() => setIsImageViewerOpen(true)}
              >
                <img
                  src={receiptImageSrc}
                  alt="Comprovante de Pagamento"
                  className="w-full h-full object-contain"
                />
                <div 
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all duration-200"
                >
                  <div className="bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ZoomIn className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {payment.receipt && (
        <ImageViewer
          src={receiptImageSrc}
          alt="Comprovante de Pagamento"
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          onDownload={handleDownloadReceipt}
        />
      )}
    </>
  );
}