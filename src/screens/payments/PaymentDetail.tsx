import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { ArrowLeft, ZoomIn, Download, CheckCircle, XCircle, Copy } from 'lucide-react';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import ImageViewer from '../../components/ImageViewer';
import Modal from '../../components/Modal';
import { Payment } from '../../domain/entities/Payment.entity';
import { PaymentStatus } from '../../data/model/payment.model';
import { PaymentRepository } from '../../data/repository/payment-repository';
import { formatCurrency } from '../../utils/format';
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
  const [copiedId, setCopiedId] = useState(false);
  const [copiedQrId, setCopiedQrId] = useState(false);
  
  // Estados para alteração de status
  const [showStatusConfirm, setShowStatusConfirm] = useState<null | { status: PaymentStatus, label: string }>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const statusPopoverRef = useRef<HTMLDivElement>(null);

  const paymentRepository = new PaymentRepository();

  const { data: paymentModel, isLoading, error } = useQuery(
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

  // Converte para entity
  const payment = paymentModel ? Payment.fromModel(paymentModel) : undefined;

  const updateStatusMutation = useMutation(
    (status: PaymentStatus) => paymentRepository.updatePaymentStatus(
      id as string,
      { status }
    ),
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

  // Função para iniciar alteração de status com confirmação
  const handleChangeStatus = (status: PaymentStatus, label: string) => {
    setShowStatusConfirm({ status, label });
  };

  // Função para confirmar alteração de status
  const confirmChangeStatus = async () => {
    if (!showStatusConfirm) return;
    setStatusLoading(true);
    try {
      await updateStatusMutation.mutateAsync(showStatusConfirm.status);
      setShowStatusConfirm(null);
    } finally {
      setStatusLoading(false);
    }
  };

  // Usar o receipt como está sem manipulação
  const receiptImageSrc = payment?.receipt || '';

  const handleDownloadReceipt = async () => {
    if (!payment?.receipt) return;

    try {
      setIsDownloading(true);
      const fileName = `comprovante_${payment.email || 'pagamento'}_${format(new Date(payment.createdAt), 'yyyy-MM-dd')}_${payment.amount}.jpg`;
      const dataUrl = payment.receipt.startsWith('data:') 
        ? payment.receipt 
        : `data:image/jpeg;base64,${payment.receipt}`;
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
    await updateStatusMutation.mutateAsync(PaymentStatus.APPROVED);
  };

  const handleRejectPayment = async () => {
    await updateStatusMutation.mutateAsync(PaymentStatus.REJECTED);
  };

  // Fechar popover quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusPopoverRef.current && !statusPopoverRef.current.contains(event.target as Node)) {
        setStatusPopoverOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Renderizar opções rápidas de status para o popover
  const renderStatusPopoverOptions = () => {
    // Lista de status possíveis (exceto o atual)
    const statusOptions: { value: PaymentStatus, label: string }[] = [
      { value: PaymentStatus.PENDING, label: 'Pendente' },
      { value: PaymentStatus.RECEIPT_SENT, label: 'Comprovante Enviado' },
      { value: PaymentStatus.REVIEW, label: 'Em Análise' },
      { value: PaymentStatus.APPROVED, label: 'Aprovado' },
      { value: PaymentStatus.NOT_APPROVED, label: 'Não Aprovado' },
      { value: PaymentStatus.WITHDRAWAL_PROCESSING, label: 'Processamento de Saque' },
      { value: PaymentStatus.REJECTED, label: 'Rejeitado' },
    ]
    .filter(opt => opt.value !== PaymentStatus.PAID)
    .filter(opt => !(payment?.transactionType !== 'static' && opt.value === PaymentStatus.RECEIPT_SENT))
    .filter(opt => opt.value !== payment?.status);

    return (
      <div className="absolute z-50 mt-1 w-60 rounded-md shadow-lg bg-card border border-border">
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2 py-1 border-b">
            Alterar status para:
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {statusOptions.length > 0 ? (
              statusOptions.map(opt => (
                <button
                  key={opt.value}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted/70 focus:outline-none focus:bg-muted transition-colors"
                  onClick={() => {
                    setStatusPopoverOpen(false);
                    handleChangeStatus(opt.value, opt.label);
                  }}
                  disabled={statusLoading || updateStatusMutation.isLoading}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground italic">
                Não há status disponíveis para alteração
              </div>
            )}
          </div>
        </div>
      </div>
    );
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

  // Função para copiar o ID
  const handleCopyId = () => {
    if (!payment?.id) return;
    navigator.clipboard.writeText(payment.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  // Função para copiar o QR Code ID
  const handleCopyQrCodeId = () => {
    if (!payment?.qrCodeId) return;
    navigator.clipboard.writeText(payment.qrCodeId);
    setCopiedQrId(true);
    setTimeout(() => setCopiedQrId(false), 1500);
  };

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
                  <div className="flex items-center gap-2">
                    <p className="font-medium break-all">{payment?.id}</p>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-muted transition-colors"
                      onClick={handleCopyId}
                      title="Copiar ID"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {copiedId && (
                      <span className="text-xs text-green-600">Copiado!</span>
                    )}
                  </div>
                </div>
                
                {payment?.qrCodeId && (
                  <div>
                    <label className="text-sm text-muted-foreground">QR Code ID</label>
                    <div className="flex items-center gap-2">
                      <p className="font-medium break-all">{payment.qrCodeId}</p>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted transition-colors"
                        onClick={handleCopyQrCodeId}
                        title="Copiar QR Code ID"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {copiedQrId && (
                        <span className="text-xs text-green-600">Copiado!</span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm text-muted-foreground">Valor</label>
                  <p className="font-medium">{formatCurrency(payment?.amount || 0)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="mt-1 relative" ref={statusPopoverRef}>
                    <StatusBadge 
                      status={payment?.status || ''} 
                      clickable={true}
                      onClick={() => setStatusPopoverOpen(!statusPopoverOpen)}
                      className="ring-2 ring-transparent hover:ring-primary/30"
                    />
                    {statusPopoverOpen && renderStatusPopoverOptions()}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tipo de Transação</label>
                  <p className="font-medium">{payment?.transactionType === 'static' ? 'QR Estático' : 'QR Dinâmico'}</p>
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
                  <p className="font-medium break-all">{(payment as any)?.userId}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Nome Completo</label>
                  <p className="font-medium">{(() => {
                    // Se houver store, mostra o nome da loja
                    if (payment?.store && payment.store.name) {
                      return payment.store.name;
                    }
                    return 'Não informado';
                  })()}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{payment?.email || 'Não informado'}</p>
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

      {/* Modal de confirmação para alteração de status */}
      {showStatusConfirm && (
        <Modal
          isOpen={!!showStatusConfirm}
          onClose={() => setShowStatusConfirm(null)}
          title="Confirmação de Alteração de Status"
          footer={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStatusConfirm(null)}
                disabled={statusLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={confirmChangeStatus}
                isLoading={statusLoading}
              >
                Confirmar
              </Button>
            </div>
          }
        >
          <div className="space-y-2">
            <div className="text-yellow-700 font-semibold">
              Atenção: você está alterando o status para <span className="font-bold">{showStatusConfirm.label}</span>.
            </div>
            <div className="text-sm text-muted-foreground">
              Tem certeza disso? Suas ações são gravadas e auditadas.
            </div>
          </div>
        </Modal>
      )}

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
 