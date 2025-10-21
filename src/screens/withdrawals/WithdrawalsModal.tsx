import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, XCircle, ChevronDown, ChevronUp, Copy, Info,
  AlertTriangle, Clock, RotateCw, ChevronRight, Coins, Check,
  QrCode, X, User, Users, ExternalLink
} from 'lucide-react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Table from '../../components/Table';
import { Withdrawal } from '../../domain/entities/Withdrawal.entity';
import { Payment } from '../../domain/entities/Payment.entity';
import { WithdrawalRepository } from '../../data/repository/withdrawal-repository';
import { PaymentRepository } from '../../data/repository/payment-repository';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { toast } from 'sonner';
import PaymentsModal from '../payments/PaymentsModal';
import { QRCodeSVG } from 'qrcode.react';
import { AdminUpdateWithdrawalStatusReq } from '../../data/model/withdrawal.model';

interface WithdrawalsModalProps {
  withdrawal: Withdrawal;
  isOpen: boolean;
  onClose: () => void;
}

function formatDateSafe(date: string | number | Date | undefined, formatStr: string): string {
  if (!date || (typeof date !== 'string' && typeof date !== 'number' && !(date instanceof Date))) return '-';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return format(d, formatStr);
}

function getSafeValue<T>(val: T | null | undefined, fallback: string = '-'): T | string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object' && Object.keys(val).length === 0) return fallback;
  if (typeof val === 'string' && val.trim() === '') return fallback;
  return val;
}

export default function WithdrawalsModal({ withdrawal, isOpen, onClose }: WithdrawalsModalProps) {
  const [txId, setTxId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showDetailedFees, setShowDetailedFees] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [failedReason, setFailedReason] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyTxIdSuccess, setCopyTxIdSuccess] = useState(false);
  const [copyIdSuccess, setCopyIdSuccess] = useState(false);
  const [copyStoreIdSuccess, setCopyStoreIdSuccess] = useState(false);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);

  const queryClient = useQueryClient();
  const withdrawalRepository = useMemo(() => new WithdrawalRepository(), []);
  const paymentRepository = useMemo(() => new PaymentRepository(), []);

  // Buscar pagamentos se necessário (caso não venha em withdrawal.payments)
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchPayments() {
      if (!isOpen) return; // Só busca se o modal estiver aberto
      if (withdrawal?.payments && withdrawal.payments.length > 0) {
        setPayments(withdrawal.payments.map(p => Payment.fromModel(p)));
      } else if (withdrawal?.paymentIds && withdrawal.paymentIds.length > 0) {
        setPaymentsLoading(true);
        try {
          const paymentModels = await Promise.all(
            withdrawal.paymentIds.map((id: string) => paymentRepository.getPaymentById(id))
          );
          if (!ignore) {
            setPayments(paymentModels.map(p => Payment.fromModel(p)));
          }
        } catch {
          if (!ignore) setPayments([]);
        } finally {
          if (!ignore) setPaymentsLoading(false);
        }
      } else {
        setPayments([]);
      }
    }
    fetchPayments();
    return () => { ignore = true; };
  }, [withdrawal, paymentRepository, isOpen]);

  const updateStatusMutation = useMutation(
    (status: 'pending' | 'processing' | 'completed' | 'failed') => {
      const data: AdminUpdateWithdrawalStatusReq = {
        status,
        failedReason: status === 'failed' ? failedReason : undefined,
        txId: status === 'completed' ? txId : undefined
      };
      return withdrawalRepository.updateWithdrawalStatus(withdrawal.id, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('withdrawals');
        toast.success('Status do saque atualizado com sucesso');
        setShowStatusForm(false);
        setSelectedStatus(null);
        setFailedReason('');
        setTxId('');
        onClose();
      },
      onError: () => {
        toast.error('Falha ao atualizar status do saque');
      },
    }
  );

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    await updateStatusMutation.mutateAsync(selectedStatus);
  };

  const handleComplete = async () => {
    if (!txId.trim()) {
      toast.error('ID da transação é obrigatório');
      return;
    }
    // O endpoint correto para concluir saque é updateWithdrawalStatus para 'completed'
    await updateStatusMutation.mutateAsync('completed');
  };

  const togglePaymentExpansion = (paymentId: string) => {
    setExpandedPaymentId(expandedPaymentId === paymentId ? null : paymentId);
  };

  const handleCopyWallet = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast.success('Endereço copiado com sucesso');
    } catch (err) {
      console.error('Falha ao copiar texto:', err);
      toast.error('Falha ao copiar endereço');
    }
  };

  const handleCopyTxId = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyTxIdSuccess(true);
      setTimeout(() => setCopyTxIdSuccess(false), 2000);
      toast.success('Hash da transação copiado com sucesso');
    } catch (err) {
      console.error('Falha ao copiar texto:', err);
      toast.error('Falha ao copiar hash');
    }
  };

  const handleCopyId = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyIdSuccess(true);
      setTimeout(() => setCopyIdSuccess(false), 2000);
      toast.success('ID copiado com sucesso');
    } catch (err) {
      console.error('Falha ao copiar texto:', err);
      toast.error('Falha ao copiar ID');
    }
  };

  const handleCopyStoreId = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStoreIdSuccess(true);
      setTimeout(() => setCopyStoreIdSuccess(false), 2000);
      toast.success('ID da loja copiado com sucesso');
    } catch (err) {
      console.error('Falha ao copiar texto:', err);
      toast.error('Falha ao copiar ID da loja');
    }
  };

  const walletTypeMap: Record<string, { name: string; icon: string }> = {
    "OnChainAddress": { name: "Bitcoin OnChain", icon: "₿" },
    "OnChain": { name: "Bitcoin OnChain", icon: "₿" },
    "LightningAddress": { name: "Bitcoin Lightning", icon: "⚡" },
    "Lightning": { name: "Bitcoin Lightning", icon: "⚡" },
    "LiquidAddress": { name: "Liquid", icon: "💧" },
    "Liquid": { name: "Liquid", icon: "💧" },
    "TronAddress": { name: "Tron (TRC20)", icon: "🔷" },
    "Tron": { name: "Tron (TRC20)", icon: "🔷" },
    "PolygonAddress": { name: "Polygon", icon: "⬡" },
    "Polygon": { name: "Polygon", icon: "⬡" },
    "Pix": { name: "PIX (BRL)", icon: "🇧🇷" },
    "Bank_EUR": { name: "Transferência Bancária (EUR)", icon: "🇪🇺" },
    "Bank_USD": { name: "Transferência Bancária (USD)", icon: "🇺🇸" },
  };

  const getWalletInfo = (type?: string) => {
    if (!type || !walletTypeMap[type]) {
      return walletTypeMap["OnChainAddress"];
    }
    return walletTypeMap[type];
  };

  // Modificação da tabela de pagamentos para incluir a visualização expandida
  const paymentColumns = [
    {
      header: 'Valor',
      accessor: (payment: Payment) => formatCurrency(payment.amount),
    },
    {
      header: 'Status',
      accessor: (payment: Payment) => (
        <StatusBadge status={payment.status} />
      ),
    },
    {
      header: 'Criado em',
      accessor: (payment: Payment) =>
        payment.createdAt
          ? formatDateTime(payment.createdAt)
          : '-',
    },
    {
      header: 'Ações',
      accessor: (payment: Payment) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => togglePaymentExpansion(payment.id)}
          leftIcon={expandedPaymentId === payment.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        >
          {expandedPaymentId === payment.id ? 'Ocultar' : 'Detalhes'}
        </Button>
      ),
    },
  ];

  // Adicionar o componente de detalhes expandidos do pagamento
  const renderExpandedPaymentDetails = (paymentId: string) => {
    const payment = payments?.find(p => p.id === paymentId);
    
    if (!payment) return null;
    
    return (
      <div className="bg-muted/30 p-4 rounded-lg mt-2 mb-4 border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">ID do Pagamento</p>
            <p className="font-medium text-foreground break-all">{payment.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium text-foreground">{payment.email || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Criado em</p>
            <p className="font-medium text-foreground">
              {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm:ss')}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Atualizado em</p>
            <p className="font-medium text-foreground">
              {payment.updatedAt
                ? formatDateSafe(payment.updatedAt, 'dd/MM/yyyy HH:mm:ss')
                : '-'}
            </p>
          </div>
          {payment.observation && (
            <div className="col-span-1 sm:col-span-2">
              <p className="text-sm text-muted-foreground">Observação</p>
              <p className="font-medium text-foreground">{payment.observation}</p>
            </div>
          )}
        </div>
        
        {payment.receipt && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Comprovante</p>
            <div className="border border-border rounded-lg overflow-hidden max-h-[200px] flex items-center justify-center bg-background">
              <img 
                src={payment.receipt.startsWith('data:') ? payment.receipt : `data:image/jpeg;base64,${payment.receipt}`}
                alt="Comprovante" 
                className="object-contain max-h-[200px]"
              />
            </div>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPayment(payment)}
          >
            Ver Detalhes Completos
          </Button>
        </div>
      </div>
    );
  };

  const statusIcons = {
    'pending': <Clock className="h-4 w-4" />,
    'processing': <RotateCw className="h-4 w-4" />,
    'completed': <CheckCircle className="h-4 w-4" />,
    'failed': <XCircle className="h-4 w-4" />
  };

  const statusLabels = {
    'pending': 'Pendente',
    'processing': 'Processando',
    'completed': 'Concluído',
    'failed': 'Falha'
  };

  const renderStatusActions = () => {
    if (withdrawal.status === 'completed') return null;

    return (
      <div className="space-y-4 border-t border-border pt-4 mt-4">
        <h3 className="font-medium text-foreground">Atualizar Status</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusLabels).map(([status, label]) => (
            <Button
              key={status}
              variant={status === 'completed' ? 'success' : status === 'failed' ? 'danger' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedStatus(status as 'pending' | 'processing' | 'completed' | 'failed');
                setShowStatusForm(true);
                setShowCompleteForm(false);
              }}
              disabled={status === withdrawal.status}
              leftIcon={statusIcons[status as keyof typeof statusIcons]}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Componente QR Code em overlay
  const renderQrCodeOverlay = () => {
    if (!showQrCode) return null;

    // Para saques BRL/PIX com Lightning invoice, exibe o invoice
    const hasLightningInvoice = w.cryptoType === 'BRL' && w.destinationWalletType === 'Pix' && w.lightningInvoice;
    const qrValue = hasLightningInvoice ? w.lightningInvoice : withdrawal.destinationWallet;
    const qrTitle = hasLightningInvoice ? 'QR Code Lightning Invoice' : 'QR Code da Carteira';
    const qrDescription = hasLightningInvoice 
      ? 'Escaneie este código com sua carteira Lightning para efetuar o depósito BRL/PIX' 
      : 'Escaneie este código para acessar a carteira';

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-card max-w-md w-full p-6 rounded-xl shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{qrTitle}</h3>
            <button 
              onClick={() => setShowQrCode(false)}
              className="p-1 hover:bg-muted rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg mb-4">
              {qrValue && (
                <QRCodeSVG 
                  value={qrValue}
                  size={220}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                  includeMargin={false}
                />
              )}
            </div>
            
            {hasLightningInvoice && w.lightningExpiresAt && (
              <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md w-full">
                <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                  ⏰ Expira em: {format(new Date(w.lightningExpiresAt), 'dd/MM/yyyy HH:mm:ss')}
                </p>
              </div>
            )}
            
            <p className="text-sm text-center text-muted-foreground mb-2">
              {qrDescription}
            </p>
            <div className="text-xs bg-muted px-3 py-2 rounded-md max-w-full overflow-hidden text-center">
              <span className="font-mono break-all">{qrValue}</span>
            </div>
            <button
              onClick={() => qrValue && handleCopyWallet(qrValue)}
              className="mt-3 px-3 py-1.5 flex items-center text-sm border border-border rounded-md hover:bg-muted transition-colors"
            >
              {copySuccess ? (
                <>
                  <Check className="h-4 w-4 mr-1.5 text-green-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1.5" />
                  <span>{hasLightningInvoice ? 'Copiar Invoice' : 'Copiar endereço'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
 

  // Novo estado para o saque detalhado
  const [detailedWithdrawal, setDetailedWithdrawal] = useState<Withdrawal | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && withdrawal?.id) {
      setLoadingDetails(true);
      withdrawalRepository.getWithdrawalById(withdrawal.id)
        .then((model) => {
          setDetailedWithdrawal(Withdrawal.fromModel(model));
        })
        .catch(() => {
          setDetailedWithdrawal(null);
        })
        .finally(() => setLoadingDetails(false));
    } else {
      setDetailedWithdrawal(null);
    }
  }, [isOpen, withdrawal?.id, withdrawalRepository]);

  if (loadingDetails) {
    return (
      <Modal title="Detalhes do Saque" isOpen={isOpen} onClose={onClose} size="lg">
        <div className="p-8 text-center text-muted-foreground">Carregando detalhes do saque...</div>
      </Modal>
    );
  }

  const w = detailedWithdrawal || withdrawal;

  return (
    <Modal
      title="Detalhes do Saque"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-6">
        {/* Banner de informação da loja (substitui usuário) */}
        <div className="flex items-center p-3 bg-primary/10 border border-primary/20 rounded-md">
          <User className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
          <div className="flex-grow min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {getSafeValue(w.store?.name, w.storeId ? w.storeId.slice(0, 8) : 'Loja não identificada')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getSafeValue(w.store?.id, w.storeId || '-')}
            </p>
          </div>
          {w.store?.id && (
            <Link 
              to={`/stores/${w.store.id}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-md flex items-center hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver Loja
            </Link>
          )}
        </div>

        <div className="flex justify-center mb-4">
          <StatusBadge status={w.status} />
        </div>

        <div className="bg-muted/30 rounded-lg p-4 mb-4 border border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-2">
                <p className="text-sm text-muted-foreground">ID do Saque</p>
                <p className="font-medium text-foreground break-all">{getSafeValue(w.id)}</p>
              </div>
              <button
                onClick={() => handleCopyId(w.id || '')}
                className="flex items-center justify-center p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0 mt-1"
                title="Copiar ID do saque"
              >
                {copyIdSuccess ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Solicitação</p>
              <p className="font-medium text-foreground">
                {formatDateSafe(w.createdAt, 'dd/MM/yyyy HH:mm:ss')}
              </p>
            </div>
            {w.completedAt && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Data de Conclusão</p>
                <p className="font-medium text-foreground">
                  {formatDateSafe(w.completedAt, 'dd/MM/yyyy HH:mm:ss')}
                </p>
              </div>
            )}
            
            {/* Exibir o Hash da Transação caso exista */}
            {w.txId && (
              <div className="col-span-2 flex justify-between items-start mt-2">
                <div className="flex-1 pr-2">
                  <p className="text-sm text-muted-foreground">Hash da Transação</p>
                  <p className="font-medium text-foreground break-all">{w.txId}</p>
                </div>
                <button
                  onClick={() => handleCopyTxId(w.txId || '')}
                  className="flex items-center justify-center p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0 mt-1"
                  title="Copiar hash da transação"
                >
                  {copyTxIdSuccess ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informações do Saque */}
        <div className="mb-4">
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-3">Informações do Saque</h4>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 text-green-600 text-xl">💰</div>
                <div>
                  <p className="text-sm font-medium text-foreground">Valor</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(Number(getSafeValue(w.amount, '0')))}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-4 border-b border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Valor do Saque</span>
                <span className="font-semibold">{formatCurrency(Number(getSafeValue(w.amount, '0')))}</span>
              </div>
              {/* Valores detalhados */}
              {w.feesDetail && w.feesDetail.length > 0 && (
                <>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Valor a Enviar</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        Number(getSafeValue(w.amount, '0')) - Number(w.feesDetail[0].whitelabelTotal)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium text-foreground">Valor Líquido Whitelabel</span>
                    <span className="font-bold text-green-700">
                      {formatCurrency(Number(w.feesDetail[0].whitelabelNet))}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-2">
                  <p className="text-sm font-medium text-foreground">ID da Loja</p>
                  <p className="text-sm text-muted-foreground break-all">
                    {getSafeValue(w.store?.id, w.storeId || '-')}
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => handleCopyStoreId(w.store?.id || w.storeId || '')}
                    className="flex items-center justify-center p-2 hover:bg-muted rounded-full transition-colors mr-1"
                    title="Copiar ID da loja"
                  >
                    {copyStoreIdSuccess ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {w.store?.id && (
                    <Link 
                      to={`/stores/${w.store.id}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-muted rounded-full transition-colors"
                      title="Ver detalhes da loja (nova aba)"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
            
            {/* Corrigir seção de referral para usar o campo correto */}
            {(w as any).User?.referral && (
              <div className="px-4 py-4 border-b border-border">
                <div className="flex items-start">
                  <Users className="h-4 w-4 text-primary mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Referral</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {(w as any).User?.referral}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="px-4 py-4 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 mr-4">
                  <div className="text-xl mr-3">
                    {getWalletInfo(getSafeValue(w.destinationWalletType)).icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Carteira de Destino</p>
                    <p className="text-sm text-muted-foreground">
                      {getWalletInfo(getSafeValue(w.destinationWalletType)).name}
                    </p>
                    <p className="text-sm text-foreground break-all pr-2">
                      {getSafeValue(w.destinationWallet)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => w.destinationWallet && handleCopyWallet(w.destinationWallet)}
                  className="flex items-center justify-center p-2 hover:bg-muted rounded-full transition-colors"
                  title="Copiar endereço"
                >
                  {copySuccess ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
              
              {/* Alerta de Lightning Invoice disponível */}
              {w.cryptoType === 'BRL' && w.destinationWalletType === 'Pix' && w.lightningInvoice && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">⚡</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Lightning Invoice Disponível
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Para este saque BRL/PIX, um invoice Lightning foi gerado. Use o botão abaixo para visualizar e pagar via Lightning Network.
                      </p>
                      {w.lightningExpiresAt && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          ⏰ Expira em: {format(new Date(w.lightningExpiresAt), 'dd/MM/yyyy HH:mm:ss')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Botão para exibir QR Code */}
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowQrCode(true)}
                  leftIcon={<QrCode className="h-4 w-4" />}
                >
                  {w.cryptoType === 'BRL' && w.destinationWalletType === 'Pix' && w.lightningInvoice 
                    ? 'Exibir QR Code Lightning' 
                    : 'Exibir QR Code'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Informações de Criptomoeda */}
        {w.cryptoType && w.cryptoValue && (
          <div className="mb-4">
            <h4 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center">
              <Coins className="h-4 w-4 mr-2" />
              Informações de Criptomoeda
            </h4>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              {/* Valor Final para Envio (sempre visível) */}
              <div className="p-6">
                <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">!</span>
                    </div>
                    <div>
                      <h6 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Valor Final para Envio
                      </h6>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        {(() => {
                          if (!w.feesDetail || w.feesDetail.length === 0 || !w.cryptoValue || !w.amount) return '-';
                          const valorEnviarBRL = Number(getSafeValue(w.amount, '0')) - Number(w.feesDetail[0].whitelabelTotal);
                          const rate = w.cryptoValue > 0 ? w.amount / w.cryptoValue : null;
                          if (!rate) return '-';
                          if (w.cryptoType === 'BTC') {
                            const btc = valorEnviarBRL / rate;
                            return `Envie exatamente ${Math.round(btc * 1e8).toLocaleString('pt-BR')} satoshis para a carteira de destino.`;
                          } else if (w.cryptoType === 'USDT') {
                            const usdt = valorEnviarBRL / rate;
                            return `Envie exatamente ${usdt.toFixed(6)} USDT para a carteira de destino.`;
                          } else if (w.cryptoType === 'EUR') {
                            return `Transfira exatamente € ${valorEnviarBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} via transferência bancária.`;
                          } else if (w.cryptoType === 'USD') {
                            return `Transfira exatamente $ ${valorEnviarBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} via transferência bancária.`;
                          } else if (w.cryptoType === 'BRL') {
                            return `Transfira exatamente R$ ${valorEnviarBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} via PIX.`;
                          }
                          return '-';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Botão para ver detalhes da cotação */}
                <div className="flex justify-end mt-2">
                  <button
                    className="text-sm text-primary hover:text-primary/80 flex items-center transition-colors"
                    onClick={() => setShowDetailedFees(!showDetailedFees)}
                  >
                    {showDetailedFees ? (
                      <>
                        <span>Ocultar Detalhes</span>
                        <ChevronUp className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      <>
                        <span>Ver Detalhes</span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
                {/* Detalhes da cotação (apenas se expandido) */}
                {showDetailedFees && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cotação no momento */}
                    <div className="text-center p-4 bg-white/70 dark:bg-black/30 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">₹</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Cotação no momento do saque</p>
                      </div>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {(() => {
                          if (!w.cryptoValue || !w.amount) return '-';
                          const rate = w.amount / w.cryptoValue;
                          if (!rate) return '-';
                          if (w.cryptoType === 'BTC') {
                            return `1 BTC = R$ ${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          } else if (w.cryptoType === 'USDT') {
                            return `1 USDT = R$ ${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
                          } else if (w.cryptoType === 'EUR') {
                            return `1 EUR = R$ ${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          } else if (w.cryptoType === 'USD') {
                            return `1 USD = R$ ${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          }
                          return '-';
                        })()}
                      </p>
                    </div>
                    {/* Valor original em crypto */}
                    <div className="text-center p-4 bg-white/70 dark:bg-black/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{w.cryptoType === 'BTC' ? '₿' : '$'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Valor original em {w.cryptoType}</p>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {w.cryptoType === 'BTC' ? 
                          `${w.cryptoValue.toFixed(8)} BTC` : 
                          w.cryptoType === 'USDT' ?
                          `${w.cryptoValue.toFixed(6)} USDT` :
                          w.cryptoType === 'EUR' ?
                          `€ ${w.cryptoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                          w.cryptoType === 'USD' ?
                          `$ ${w.cryptoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                          `R$ ${w.cryptoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Equivalente a {formatCurrency(w.amount)}
                      </p>
                    </div>
                    {/* Valor final após taxas (em BRL e em crypto) */}
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-center mb-2">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">✓</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Valor final após taxas</p>
                      </div>
                      {/* Valor a enviar em BRL */}
                      <p className="text-base font-semibold text-green-700 mb-1">
                        {w.feesDetail && w.feesDetail.length > 0 ? formatCurrency(Number(getSafeValue(w.amount, '0')) - Number(w.feesDetail[0].whitelabelTotal)) : '-'}
                      </p>
                      {/* Valor a enviar em crypto (BTC, USDT ou BRL) */}
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {(() => {
                          if (!w.feesDetail || w.feesDetail.length === 0) return '-';
                          const valorEnviarBRL = Number(getSafeValue(w.amount, '0')) - Number(w.feesDetail[0].whitelabelTotal);
                          
                          // BRL não precisa de conversão
                          if (w.cryptoType === 'BRL') {
                            return formatCurrency(valorEnviarBRL);
                          }
                          
                          const rate = w.cryptoValue > 0 ? w.amount / w.cryptoValue : null;
                          if (!rate) return '-';
                          if (w.cryptoType === 'BTC') {
                            const btc = valorEnviarBRL / rate;
                            return `${btc.toFixed(8)} BTC`;
                          } else if (w.cryptoType === 'USDT') {
                            const usdt = valorEnviarBRL / rate;
                            return `${usdt.toFixed(6)} USDT`;
                          } else if (w.cryptoType === 'EUR') {
                            return `€ ${valorEnviarBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          } else if (w.cryptoType === 'USD') {
                            return `$ ${valorEnviarBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          }
                          return '-';
                        })()}
                      </p>
                    </div>
                    {/* Satoshis para envio (apenas BTC) */}
                    {w.cryptoType === 'BTC' && w.feesDetail && w.feesDetail.length > 0 && w.cryptoValue && w.amount && (
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">⚡</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Para envio (satoshis)</p>
                        </div>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                          {(() => {
                            const valorEnviarBRL = Number(getSafeValue(w.amount, '0')) - Number(w.feesDetail[0].whitelabelTotal);
                            const rate = w.cryptoValue > 0 ? w.amount / w.cryptoValue : null;
                            if (!rate) return '-';
                            const btc = valorEnviarBRL / rate;
                            return Math.round(btc * 1e8).toLocaleString('pt-BR');
                          })()}
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                          satoshis
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Seção de Taxas e Valores */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm uppercase tracking-wider text-muted-foreground font-medium flex items-center">
              <Coins className="h-4 w-4 mr-2" />
              Taxas e Valores
            </h4>
            <button 
              onClick={() => setShowDetailedFees(!showDetailedFees)}
              className="text-sm text-primary hover:text-primary/80 flex items-center transition-colors"
            >
              {showDetailedFees ? (
                <>
                  <span>Ocultar Detalhes</span>
                  <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  <span>Ver Detalhes</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </div>
          
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {/* Seção principal de valores */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Valor do Saque */}
                <div className="text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl mb-2">💰</div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Valor Solicitado</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(Number(getSafeValue(w.amount, '0')))}
                    </p>
                  </div>
                </div>

                {/* Valor a Enviar */}
                {w.feesDetail && w.feesDetail.length > 0 && (
                  <>
                    <div className="text-center">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="text-2xl mb-2">📤</div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Valor a Enviar</p>
                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          {formatCurrency(
                            Number(getSafeValue(w.amount, '0')) - Number(w.feesDetail[0].whitelabelTotal)
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="text-2xl mb-2">💎</div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">Valor Líquido</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(Number(w.feesDetail[0].whitelabelNet))}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Detalhamento das taxas */}
            {showDetailedFees && w.feesDetail && w.feesDetail.length > 0 && (
              <div className="border-t border-border">
                {w.feesDetail.map((fee, idx) => (
                  <div key={fee.id} className="p-6 border-b border-border last:border-b-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-primary">{idx + 1}</span>
                        </div>
                        <div>
                          <h5 className="font-medium text-foreground">Detalhamento de Taxas</h5>
                          <p className="text-xs text-muted-foreground">
                            {formatDateSafe(fee.createdAt, 'dd/MM/yyyy \'às\' HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Taxa de Serviço */}
                      <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs text-red-600 dark:text-red-400">%</span>
                          </div>
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">Taxa de Serviço</span>
                        </div>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(Number(fee.feeAmount))}
                        </p>
                        {fee.feeType === 'PERCENT' && (
                          <p className="text-xs text-red-600/70 dark:text-red-400/70">
                            {Number(fee.feeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </p>
                        )}
                      </div>

                      {/* Spread */}
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">📊</span>
                          </div>
                          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Spread</span>
                        </div>
                        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          {formatCurrency(Number(fee.spreadAmount))}
                        </p>
                        {fee.spreadPercent && Number(fee.spreadPercent) > 0 && (
                          <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">
                            {Number(fee.spreadPercent).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </p>
                        )}
                      </div>

                      {/* Total Plataforma */}
                      <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs text-purple-600 dark:text-purple-400">🏢</span>
                          </div>
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Plataforma</span>
                        </div>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(Number(fee.platformTotal ?? 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Caso não haja detalhamento */}
            {showDetailedFees && (!w.feesDetail || w.feesDetail.length === 0) && (
              <div className="p-6 text-center border-t border-border">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Info className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhum detalhamento de taxas disponível para este saque.
                </p>
              </div>
            )}
          </div>
        </div>

        {w.failedReason && (
          <div className="mb-4 p-4 bg-status-rejected/10 rounded-lg border border-status-rejected/20">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-status-rejected mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-status-rejected">Motivo da Falha</h4>
                <p className="mt-1 text-sm text-status-rejected">{w.failedReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pagamentos Associados */}
        <div>
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-3">Pagamentos Associados</h3>
          <div className="space-y-4">
            <Table
              data={payments}
              columns={paymentColumns}
              isLoading={paymentsLoading}
            />
            {expandedPaymentId && renderExpandedPaymentDetails(expandedPaymentId)}
          </div>
        </div>

        {renderStatusActions()}

        {showStatusForm && (
          <div className="mt-6 border-t border-border pt-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  {statusIcons[selectedStatus as keyof typeof statusIcons]}
                </div>
                Atualizar Status para {statusLabels[selectedStatus || 'pending']}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedStatus === 'completed' && 'Marque este saque como concluído fornecendo o hash da transação.'}
                {selectedStatus === 'failed' && 'Informe o motivo da falha para registrar no sistema.'}
                {selectedStatus === 'processing' && 'Marque este saque como em processamento.'}
              </p>
            </div>
            
            {selectedStatus === 'failed' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    Motivo da Falha <span className="text-red-500">*</span>
                  </div>
                </label>
                <textarea
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  rows={4}
                  placeholder="Descreva detalhadamente o motivo da falha do saque..."
                  required
                />
              </div>
            )}

            {selectedStatus === 'completed' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Hash da Transação <span className="text-red-500">*</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 font-mono"
                  placeholder="Cole aqui o hash da transação no blockchain..."
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  O hash da transação confirma que o pagamento foi processado na blockchain.
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowStatusForm(false)}
                className="order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                variant={selectedStatus === 'failed' ? 'danger' : selectedStatus === 'completed' ? 'success' : 'default'}
                onClick={async () => {
                  if (selectedStatus === 'completed' && !txId.trim()) {
                    toast.error('Hash da transação é obrigatório');
                    return;
                  }
                  if (selectedStatus === 'failed' && !failedReason) {
                    toast.error('Motivo da falha é obrigatório');
                    return;
                  }
                  await handleStatusUpdate();
                }}
                isLoading={updateStatusMutation.isLoading}
                disabled={
                  (selectedStatus === 'failed' && !failedReason) ||
                  (selectedStatus === 'completed' && !txId.trim()) ||
                  updateStatusMutation.isLoading
                }
                rightIcon={<ChevronRight className="h-4 w-4" />}
                className="order-1 sm:order-2"
              >
                {updateStatusMutation.isLoading 
                  ? 'Processando...' 
                  : `Confirmar ${statusLabels[selectedStatus || 'pending']}`}
              </Button>
            </div>
          </div>
        )}

        {showCompleteForm && (
          <div className="mt-6 border-t border-border pt-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                Concluir Saque
              </h3>
              <p className="text-sm text-muted-foreground">
                Confirme a conclusão do saque fornecendo as informações da transação.
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Hash da Transação <span className="text-red-500">*</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 font-mono"
                  placeholder="Cole aqui o hash da transação no blockchain..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center">
                    <Info className="h-4 w-4 text-blue-500 mr-2" />
                    Observações
                  </div>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  rows={3}
                  placeholder="Adicione observações sobre o processamento do saque (opcional)..."
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCompleteForm(false)}
                className="order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={handleComplete}
                isLoading={updateStatusMutation.isLoading}
                disabled={!txId.trim() || updateStatusMutation.isLoading}
                leftIcon={<CheckCircle className="h-4 w-4" />}
                className="order-1 sm:order-2"
              >
                {updateStatusMutation.isLoading 
                  ? 'Processando...' 
                  : 'Confirmar Conclusão'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de QR Code */}
      {renderQrCodeOverlay()}

      {/* Adicionar o modal de detalhes do pagamento */}
      {selectedPayment && (
        <PaymentsModal
          payment={selectedPayment}
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </Modal>
  );
}