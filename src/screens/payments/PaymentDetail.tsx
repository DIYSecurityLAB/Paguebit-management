import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { ArrowLeft, ZoomIn, Download, CheckCircle, XCircle } from 'lucide-react';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import ImageViewer from '../../components/ImageViewer';
import { Payment, PaymentStatus } from '../../models/types';
import paymentRepository from '../../repository/payment-repository';
import { formatCurrency } from '../../utils/format';
import apiClient from '../../datasource/api-client';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

export default function PaymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notFound, setNotFound] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);

  const { data: payment, isLoading, error } = useQuery(
    ['payment', id],
    () => paymentRepository.getPaymentById(id as string),
    {
      enabled: !!id,
      retry: 1,
      onError: () => {
        setNotFound(true);
      }
    }
  );

  const updateStatusMutation = useMutation(
    (status: PaymentStatus) => paymentRepository.updatePaymentStatus(id as string, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['payment', id]);
        queryClient.invalidateQueries('payments');
        toast.success('Status do pagamento atualizado com sucesso');
      },
      onError: () => {
        toast.error('Falha ao atualizar o status do pagamento');
      },
    }
  );

  // Usar o receipt como está sem manipulação
  const receiptImageSrc = payment?.receipt || '';

  const handleDownloadReceipt = async () => {
    if (!payment?.receipt) return;

    try {
      setIsDownloading(true);
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
      setIsDownloading(false);
    }
  };

  const handleApprovePayment = async () => {
    await updateStatusMutation.mutateAsync(PaymentStatus.COMPLETED);
  };

  const handleRejectPayment = async () => {
    await updateStatusMutation.mutateAsync(PaymentStatus.REJECTED);
  };

  // OCR para sugerir nome do remetente
  useEffect(() => {
    setSuggestedName(null);
    const receipt = payment?.receipt || '';
    if (!receipt) return;

    let cancelled = false;
    async function extractName() {
      try {
        const { data } = await Tesseract.recognize(
          receipt.startsWith('data:') ? receipt : `data:image/jpeg;base64,${receipt}`,
          'por'
        );
        const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);
        const possibleName = lines.find(line =>
          /^[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ ]{5,}$/.test(line) && !/BANCO|AGENCIA|CONTA|VALOR|CPF|CNPJ|PIX|DOC|TED|R\$|FAVORECIDO|RECEBEDOR/i.test(line)
        );
        if (!cancelled) setSuggestedName(possibleName || null);
      } catch {
        if (!cancelled) setSuggestedName(null);
      }
    }
    extractName();
    return () => { cancelled = true; };
  }, [payment?.receipt]);

  if (isLoading) return <Loading />;
  if (notFound || error) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/payments')} 
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Voltar para Pagamentos
          </Button>
        </div>
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Pagamento não encontrado</h2>
          <p className="text-muted-foreground">
            O pagamento que você está procurando não existe ou foi removido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/payments')} 
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Voltar para Pagamentos
          </Button>
          <h1 className="text-2xl font-bold ml-4">Detalhes do Pagamento</h1>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">ID</label>
                  <p className="font-medium break-all">{payment?.id}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Valor</label>
                  <p className="font-medium">{formatCurrency(payment?.amount || 0)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={payment?.status || ''} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tipo de Transação</label>
                  <p className="font-medium">{payment?.transactionType === 'static' ? 'QR Estático' : 'QR Dinâmico'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Modo de Recebimento</label>
                  <p className="font-medium">{payment?.receivingMode === 'now' ? 'Imediato' : 'Armazenado'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Data de Criação</label>
                  <p className="font-medium">
                    {payment?.createdAt ? format(new Date(payment.createdAt), "dd 'de' MMMM 'de' yyyy, HH:mm") : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Última Atualização</label>
                  <p className="font-medium">
                    {payment?.updatedAt ? format(new Date(payment.updatedAt), "dd 'de' MMMM 'de' yyyy, HH:mm") : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Informações do Cliente</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">ID do Usuário</label>
                  <p className="font-medium break-all">{payment?.userId}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Nome Completo</label>
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
                  <p className="font-medium">{(payment as any).User?.email || payment?.email || 'Não informado'}</p>
                </div>
              </div>
              
              {payment?.status === PaymentStatus.RECEIPT_SENT && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Ações</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="success"
                      onClick={handleApprovePayment}
                      isLoading={updateStatusMutation.isLoading}
                      leftIcon={<CheckCircle className="h-4 w-4" />}
                    >
                      Aprovar Pagamento
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleRejectPayment}
                      isLoading={updateStatusMutation.isLoading}
                      leftIcon={<XCircle className="h-4 w-4" />}
                    >
                      Rejeitar Pagamento
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {payment?.observation && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Observação</h2>
              <div className="p-4 bg-muted rounded-md">
                <p className="text-foreground">{payment.observation}</p>
              </div>
            </div>
          )}

          {payment?.receipt && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Comprovante</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReceipt}
                    isLoading={isDownloading}
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Baixar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImageViewerOpen(true)}
                    leftIcon={<ZoomIn className="h-4 w-4" />}
                  >
                    Ampliar
                  </Button>
                </div>
              </div>
              {suggestedName && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Nome sugerido pelo OCR: <span className="font-semibold">{suggestedName}</span>
                </div>
              )}
              <div className="mt-4 relative group border border-border rounded-lg overflow-hidden aspect-video">
                <img
                  src={receiptImageSrc}
                  alt="Comprovante de Pagamento"
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => setIsImageViewerOpen(true)}
                />
                <div 
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center transition-all duration-200"
                  onClick={() => setIsImageViewerOpen(true)}
                >
                  <ZoomIn 
                    className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                  />
                </div>
              </div>
            </div>
          )}

          {payment?.qrCodeUrl && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">QR Code</h2>
              <div className="flex flex-col items-center mt-2">
                <img
                  src={payment.qrCodeUrl}
                  alt="QR Code de Pagamento"
                  className="max-w-[200px]"
                />
                {payment.qrCopyPaste && (
                  <div className="mt-4 w-full">
                    <h3 className="text-sm font-medium mb-1">Código para Copiar e Colar</h3>
                    <div className="p-3 bg-muted rounded-md">
                      <code className="text-sm break-all">{payment.qrCopyPaste}</code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {payment?.receipt && (
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
