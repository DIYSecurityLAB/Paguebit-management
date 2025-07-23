import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
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
import { Withdrawal, Payment } from '../../models/types';
import withdrawalRepository from '../../repository/withdrawal-repository';
import paymentRepository from '../../repository/payment-repository';
import { formatCurrency } from '../../utils/format';
import { toast } from 'sonner';
import { useWithdrawalFees } from '../../hooks/useWithdrawalFees';
import PaymentsModal from '../payments/PaymentsModal';
import { QRCodeSVG } from 'qrcode.react';

interface WithdrawalsModalProps {
  withdrawal: Withdrawal;
  isOpen: boolean;
  onClose: () => void;
}

function formatDateSafe(date: any, formatStr: string) {
  if (!date || (typeof date !== 'string' && typeof date !== 'number')) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return format(d, formatStr);
}

function getSafeValue(val: any, fallback: string = '-') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object' && Object.keys(val).length === 0) return fallback;
  if (typeof val === 'string' && val.trim() === '') return fallback;
  return val;
}

export default function WithdrawalsModal({ withdrawal, isOpen, onClose }: WithdrawalsModalProps) {
  const [txId, setTxId] = useState('');
  const [notes, setNotes] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showDetailedFees, setShowDetailedFees] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [failedReason, setFailedReason] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyTxIdSuccess, setCopyTxIdSuccess] = useState(false);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  // Novo estado para controlar a exibição do QR code
  const [showQrCode, setShowQrCode] = useState(false);
  
  const queryClient = useQueryClient();

  // Calculador de taxas
  const fees = useWithdrawalFees(
    withdrawal?.amount || 0,
    withdrawal?.destinationWalletType || "",
    false
  );

  // Cálculo de satoshis (1 BTC = 100,000,000 satoshis)
  const satoshiValue = fees.isBitcoinWallet ? 
    Math.round(parseFloat(fees.expectedAmountBTC) * 100000000) : 0;

  // Debug log para verificar os dados do withdrawal
  useEffect(() => {
    if (withdrawal) {
      console.log('Withdrawal recebido no modal:', withdrawal);
    }
  }, [withdrawal]);

  // Remover busca de pagamentos pelo paymentRepository, pois agora já vem em withdrawal.payments
  const payments = withdrawal?.payments || [];

  const updateStatusMutation = useMutation(
    (status: 'pending' | 'processing' | 'completed' | 'failed') =>
      withdrawalRepository.updateWithdrawalStatus({
        id: withdrawal.id,
        status,
        failedReason: status === 'failed' ? failedReason : undefined,
        txId: status === 'completed' ? txId : undefined
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('withdrawals');
        toast.success('Status do saque atualizado com sucesso');
        setShowStatusForm(false);
        setSelectedStatus(null);
        setFailedReason('');
        setTxId(''); // Limpar txId ao concluir
        onClose();
      },
      onError: () => {
        toast.error('Falha ao atualizar status do saque');
      },
    }
  );

  const completeWithdrawalMutation = useMutation(
    () =>
      withdrawalRepository.completeWithdrawal({
        id: withdrawal.id,
        txId,
        notes,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('withdrawals');
        toast.success('Saque concluído com sucesso');
        setShowCompleteForm(false);
        setTxId('');
        setNotes('');
        onClose();
      },
      onError: () => {
        toast.error('Falha ao concluir o saque');
      },
    }
  );

  const togglePaymentExpansion = (paymentId: string) => {
    setExpandedPaymentId(expandedPaymentId === paymentId ? null : paymentId);
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    await updateStatusMutation.mutateAsync(selectedStatus);
  };

  const handleComplete = async () => {
    if (!txId.trim()) {
      toast.error('ID da transação é obrigatório');
      return;
    }
    await completeWithdrawalMutation.mutateAsync();
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

  const walletTypeMap: Record<string, { name: string; icon: string }> = {
    "OnChainAddress": { name: "Bitcoin OnChain", icon: "₿" },
    "LightningAddress": { name: "Bitcoin Lightning", icon: "⚡" },
    "LiquidAddress": { name: "Liquid", icon: "💧" },
    "TronAddress": { name: "Tron", icon: "🔷" },
    "PolygonAddress": { name: "Polygon", icon: "⬡" },
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
          ? formatDateSafe(payment.createdAt, 'dd/MM/yyyy HH:mm:ss')
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
            <p className="text-sm text-muted-foreground">Modo de Recebimento</p>
            <p className="font-medium text-foreground">{payment.receivingMode === 'now' ? 'Imediato' : 'Armazenado'}</p>
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
                setSelectedStatus(status as any);
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

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-card max-w-md w-full p-6 rounded-xl shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">QR Code da Carteira</h3>
            <button 
              onClick={() => setShowQrCode(false)}
              className="p-1 hover:bg-muted rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg mb-4">
              {withdrawal.destinationWallet && (
                <QRCodeSVG 
                  value={withdrawal.destinationWallet}
                  size={220}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                  includeMargin={false}
                />
              )}
            </div>
            <p className="text-sm text-center text-muted-foreground mb-2">
              Escaneie este código para acessar a carteira
            </p>
            <div className="text-xs bg-muted px-3 py-2 rounded-md max-w-full overflow-hidden text-center">
              <span className="font-mono break-all">{withdrawal.destinationWallet}</span>
            </div>
            <button
              onClick={() => withdrawal.destinationWallet && handleCopyWallet(withdrawal.destinationWallet)}
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
                  <span>Copiar endereço</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

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
              {getSafeValue(withdrawal.store?.name, withdrawal.storeId ? withdrawal.storeId.slice(0, 8) : 'Loja não identificada')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getSafeValue(withdrawal.store?.id, withdrawal.storeId || '-')}
            </p>
          </div>
          {withdrawal.store?.id && (
            <Link 
              to={`/stores/${withdrawal.store.id}`} 
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
          <StatusBadge status={withdrawal.status} />
        </div>

        <div className="bg-muted/30 rounded-lg p-4 mb-4 border border-border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ID do Saque</p>
              <p className="font-medium text-foreground break-all">{getSafeValue(withdrawal.id)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Solicitação</p>
              <p className="font-medium text-foreground">
                {formatDateSafe(withdrawal.createdAt, 'dd/MM/yyyy HH:mm:ss')}
              </p>
            </div>
            {withdrawal.completedAt && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Data de Conclusão</p>
                <p className="font-medium text-foreground">
                  {formatDateSafe(withdrawal.completedAt, 'dd/MM/yyyy HH:mm:ss')}
                </p>
              </div>
            )}
            
            {/* Exibir o Hash da Transação caso exista */}
            {withdrawal.txId && (
              <div className="col-span-2 flex justify-between items-start mt-2">
                <div className="flex-1 pr-2">
                  <p className="text-sm text-muted-foreground">Hash da Transação</p>
                  <p className="font-medium text-foreground break-all">{withdrawal.txId}</p>
                </div>
                <button
                  onClick={() => handleCopyTxId(withdrawal.txId || '')}
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
                    {formatCurrency(Number(getSafeValue(withdrawal.amount, 0)))}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">ID da Loja</p>
                  <p className="text-sm text-muted-foreground break-all">
                    {getSafeValue(withdrawal.store?.id, withdrawal.storeId || '-')}
                  </p>
                </div>
                {withdrawal.store?.id && (
                  <Link 
                    to={`/stores/${withdrawal.store.id}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-2 hover:bg-muted rounded-full transition-colors"
                    title="Ver detalhes da loja (nova aba)"
                  >
                    <ExternalLink className="h-4 w-4 text-primary" />
                  </Link>
                )}
              </div>
            </div>
            
            {/* Corrigir seção de referral para usar o campo correto */}
            {(withdrawal as any).User?.referral && (
              <div className="px-4 py-4 border-b border-border">
                <div className="flex items-start">
                  <Users className="h-4 w-4 text-primary mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Referral</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {(withdrawal as any).User?.referral}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="px-4 py-4 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 mr-4">
                  <div className="text-xl mr-3">
                    {getWalletInfo(getSafeValue(withdrawal.destinationWalletType)).icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Carteira de Destino</p>
                    <p className="text-sm text-muted-foreground">
                      {getWalletInfo(getSafeValue(withdrawal.destinationWalletType)).name}
                    </p>
                    <p className="text-sm text-foreground break-all pr-2">
                      {getSafeValue(withdrawal.destinationWallet)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => withdrawal.destinationWallet && handleCopyWallet(withdrawal.destinationWallet)}
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
              
              {/* Botão para exibir QR Code */}
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowQrCode(true)}
                  leftIcon={<QrCode className="h-4 w-4" />}
                >
                  Exibir QR Code
                </Button>
              </div>
            </div>
          </div>
        </div>

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
          
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-4 border-b border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Valor do Saque</span>
                <span className="font-semibold">{formatCurrency(withdrawal.amount)}</span>
              </div>
              
              {showDetailedFees && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Taxa da Plataforma ({(fees.alfredFeeRate * 100).toFixed(2)}%)</span>
                  <span className="text-red-600 font-medium">- {formatCurrency(fees.alfredFee)}</span>
                </div>
              )}
              
              {showDetailedFees && fees.isBitcoinWallet && withdrawal.destinationWalletType === "OnChainAddress" && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Taxa de Mineração (estimada)</span>
                  <span className="text-red-600 font-medium">~ {formatCurrency(10)}</span>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Valor Final (BRL)</span>
                  <span className="font-bold">{formatCurrency(fees.finalAmountBRL)}</span>
                </div>
              </div>
            </div>
      
            {(fees.isBitcoinWallet || fees.isUsdtWallet) && (
              <div className="px-4 py-4 bg-primary/10 border-t border-primary/20">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-primary mr-2 mt-0 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      Valor estimado a ser recebido em {fees.isBitcoinWallet ? "Bitcoin" : "USDT"}:
                    </p>
                    <p className="text-base font-mono font-bold mt-1">
                      {fees.isBitcoinWallet
                        ? `${fees.expectedAmountBTC} BTC`
                        : `${fees.expectedAmountUSDT} USDT`}
                    </p>
                    
                    {/* Adicionar valor em satoshis para Bitcoin */}
                    {fees.isBitcoinWallet && (
                      <p className="text-sm font-mono text-muted-foreground mt-1">
                        {satoshiValue.toLocaleString()} satoshis
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {showDetailedFees && (
              <div className="px-4 py-4 bg-muted border-t border-border">
                <h5 className="text-sm font-medium text-foreground mb-3">Conversão para Criptomoeda</h5>
                
                {fees.loading ? (
                  <div className="text-center py-2">
                    <span className="animate-pulse text-muted-foreground">Carregando taxas...</span>
                  </div>
                ) : fees.error ? (
                  <div className="text-center py-2">
                    <span className="text-red-500 text-sm">{fees.error}</span>
                  </div>
                ) : (
                  <>
                    {fees.isBitcoinWallet && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">Cotação Bitcoin (com ágio {(fees.btcSpreadRate * 100).toFixed(1)}%)</span>
                          <span>{formatCurrency(fees.btcToBrl || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Valor Aproximado em Bitcoin</span>
                          <span className="font-mono font-medium">₿ {fees.expectedAmountBTC}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm font-medium">Valor em Satoshis</span>
                          <span className="font-mono font-medium">{satoshiValue.toLocaleString()} sats</span>
                        </div>
                      </div>
                    )}
                    
                    {fees.isUsdtWallet && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">Cotação USDT (com ágio {(fees.usdtSpreadRate * 100).toFixed(1)}%)</span>
                          <span>{formatCurrency(fees.usdtToBrl || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Valor Aproximado em USDT</span>
                          <span className="font-mono font-medium">$ {fees.expectedAmountUSDT}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {withdrawal.failedReason && (
          <div className="mb-4 p-4 bg-status-rejected/10 rounded-lg border border-status-rejected/20">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-status-rejected mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-status-rejected">Motivo da Falha</h4>
                <p className="mt-1 text-sm text-status-rejected">{withdrawal.failedReason}</p>
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
              isLoading={false}
            />
            {expandedPaymentId && renderExpandedPaymentDetails(expandedPaymentId)}
          </div>
        </div>

        {renderStatusActions()}

        {showStatusForm && (
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="font-medium text-lg mb-3">Atualizar Status</h3>
            
            {selectedStatus === 'failed' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Motivo da Falha <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  rows={3}
                  placeholder="Explique o motivo da falha"
                  required
                />
              </div>
            )}

            {selectedStatus === 'completed' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Hash da Transação <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  placeholder="Hash da transação no blockchain"
                  required
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStatusForm(false)}
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
              >
                {updateStatusMutation.isLoading 
                  ? 'Processando...' 
                  : `Atualizar para ${statusLabels[selectedStatus || 'pending']}`}
              </Button>
            </div>
          </div>
        )}

        {!showStatusForm && !showCompleteForm && (
          <div className="flex justify-center mt-4 pt-4 border-t border-border">
            <Button
              variant="default"
              onClick={() => {
                setShowCompleteForm(true);
                setShowStatusForm(false);
              }}
              disabled={withdrawal.status === 'completed'}
              leftIcon={<CheckCircle className="h-4 w-4" />}
            >
              Concluir Saque
            </Button>
          </div>
        )}

        {showCompleteForm && (
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="font-medium text-lg mb-3">Concluir Saque</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1">
                ID da Transação <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                placeholder="ID da transação no blockchain"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                rows={3}
                placeholder="Informações adicionais sobre o saque"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCompleteForm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={handleComplete}
                isLoading={completeWithdrawalMutation.isLoading}
                disabled={!txId.trim() || completeWithdrawalMutation.isLoading}
                leftIcon={<CheckCircle className="h-4 w-4" />}
              >
                {completeWithdrawalMutation.isLoading 
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