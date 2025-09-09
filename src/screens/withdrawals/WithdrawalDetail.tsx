import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, Copy, Coins, ChevronDown, ChevronUp } from 'lucide-react';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Table, { TableColumn } from '../../components/Table';
import PaymentsModal from '../payments/PaymentsModal';
import { WithdrawalRepository } from '../../data/repository/withdrawal-repository';
import { Withdrawal } from '../../domain/entities/Withdrawal.entity';
import { WithdrawalModel } from '../../data/model/withdrawal.model';
import { PaymentRepository } from '../../data/repository/payment-repository';
import { Payment } from '../../domain/entities/Payment.entity';
import { formatCurrency, formatDateTime } from '../../utils/format';

export default function WithdrawalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [copiedQrId, setCopiedQrId] = useState<string | null>(null);
  const [showDetailedFees, setShowDetailedFees] = useState(false);

  const withdrawalRepository = new WithdrawalRepository();
  const paymentRepository = new PaymentRepository();

  const { data: withdrawalModel, isLoading, error } = useQuery(
    ['withdrawal', id],
    () => withdrawalRepository.getWithdrawalById(id as string),
    {
      enabled: !!id,
      retry: 1,
      onError: () => {
        setNotFound(true);
      }
    }
  );

  // Converte WithdrawalModel para Withdrawal entity (validação e métodos)
  const withdrawal = withdrawalModel ? Withdrawal.fromModel(withdrawalModel as WithdrawalModel) : undefined;

  const { data: paymentsRaw, isLoading: isLoadingPayments } = useQuery(
    ['withdrawal-payments', withdrawal?.paymentIds],
    async () => {
      if (!withdrawal?.paymentIds?.length) return [];
      const paymentPromises = withdrawal.paymentIds.map(id => 
        paymentRepository.getPaymentById(id)
      );
      return Promise.all(paymentPromises);
    },
    {
      enabled: !!withdrawal?.paymentIds?.length,
    }
  );

  // Converte PaymentModel[] para Payment[]
  const payments = paymentsRaw ? paymentsRaw.map(p => Payment.fromModel(p)) : [];

  // Função para copiar o QR Code ID
  const handleCopyQrCodeId = (qrCodeId: string) => {
    navigator.clipboard.writeText(qrCodeId);
    setCopiedQrId(qrCodeId);
    setTimeout(() => setCopiedQrId(null), 1500);
  };

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
      header: 'Tipo',
      accessor: (payment: Payment) => (
        <span className="capitalize">{payment.transactionType === 'static' ? 'Estático' : 'Dinâmico'}</span>
      ),
    },
    {
      header: 'QR Code ID',
      accessor: (payment: Payment) => (
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs truncate max-w-[180px]">{payment.qrCodeId}</span>
          {payment.qrCodeId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyQrCodeId(payment.qrCodeId!);
              }}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Copiar QR Code ID"
            >
              <Copy className="h-3 w-3" />
              {copiedQrId === payment.qrCodeId && (
                <span className="absolute text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded -mt-8 ml-1">
                  Copiado!
                </span>
              )}
            </button>
          )}
        </div>
      ),
    },
    {
      header: 'Data de Criação',
      accessor: (payment: Payment) =>
        payment.createdAt
          ? formatDateTime(payment.createdAt)
          : '-',
    },
  ] as TableColumn<Payment>[];

  if (isLoading) return <Loading />;
  if (notFound || error) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/withdrawals')} 
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Voltar para Saques
          </Button>
        </div>
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Saque não encontrado</h2>
          <p className="text-muted-foreground">
            O saque que você está procurando não existe ou foi removido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/withdrawals')} 
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Saques
        </Button>
        <h1 className="text-2xl font-bold ml-4">Detalhes do Saque</h1>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">ID</label>
                <p className="font-medium break-all">{withdrawal?.id}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Valor</label>
                <p className="font-medium">{formatCurrency(withdrawal?.amount || 0)}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <div className="mt-1">
                  <StatusBadge status={withdrawal?.status || ''} />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Tipo de Carteira</label>
                <p className="font-medium capitalize">{withdrawal?.destinationWalletType}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Carteira de Destino</label>
                <p className="font-medium break-all">{withdrawal?.destinationWallet}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">ID da Loja</label>
                <p className="font-medium break-all">{withdrawal?.storeId}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Detalhes de Processamento</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Criado em</label>
                <p className="font-medium">
                  {withdrawal?.createdAt
                    ? formatDateTime(withdrawal.createdAt)
                    : '-'}
                </p>
              </div>
              {withdrawal?.completedAt && (
                <div>
                  <label className="text-sm text-muted-foreground">Concluído em</label>
                  <p className="font-medium">
                    {withdrawal.completedAt
                      ? formatDateTime(withdrawal.completedAt)
                      : '-'}
                  </p>
                </div>
              )}
              {withdrawal?.txId && (
                <div>
                  <label className="text-sm text-muted-foreground">ID da Transação</label>
                  <p className="font-medium break-all">{withdrawal.txId}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seção de Informações de Criptomoeda */}
        {withdrawal?.cryptoType && withdrawal?.cryptoValue && (
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Coins className="h-5 w-5 mr-2" />
              Informações de Criptomoeda
            </h2>
            {/* Valor Final para Envio (sempre visível) */}
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
                      if (!withdrawal.feesDetail || withdrawal.feesDetail.length === 0 || !withdrawal.cryptoValue || !withdrawal.amount) return '-';
                      const valorEnviarBRL = Number(withdrawal.amount) - Number(withdrawal.feesDetail[0].whitelabelTotal);
                      const rate = withdrawal.cryptoValue > 0 ? withdrawal.amount / withdrawal.cryptoValue : null;
                      if (!rate) return '-';
                      if (withdrawal.cryptoType === 'BTC') {
                        const btc = valorEnviarBRL / rate;
                        return `Envie exatamente ${Math.round(btc * 1e8).toLocaleString('pt-BR')} satoshis para a carteira de destino.`;
                      } else if (withdrawal.cryptoType === 'USDT') {
                        const usdt = valorEnviarBRL / rate;
                        return `Envie exatamente ${usdt.toFixed(6)} USDT para a carteira de destino.`;
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
                      if (!withdrawal.cryptoValue || !withdrawal.amount) return '-';
                      const rate = withdrawal.amount / withdrawal.cryptoValue;
                      if (!rate) return '-';
                      if (withdrawal.cryptoType === 'BTC') {
                        return `1 BTC = R$ ${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      } else if (withdrawal.cryptoType === 'USDT') {
                        return `1 USDT = R$ ${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
                      }
                      return '-';
                    })()}
                  </p>
                </div>
                {/* Valor original em crypto */}
                <div className="text-center p-4 bg-white/70 dark:bg-black/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{withdrawal.cryptoType === 'BTC' ? '₿' : '$'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Valor original em {withdrawal.cryptoType}</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {withdrawal.cryptoType === 'BTC' ? 
                      `${withdrawal.cryptoValue.toFixed(8)} BTC` : 
                      `${withdrawal.cryptoValue.toFixed(6)} USDT`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Equivalente a {formatCurrency(withdrawal.amount)}
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
                    {withdrawal.feesDetail && withdrawal.feesDetail.length > 0 ? formatCurrency(Number(withdrawal.amount) - Number(withdrawal.feesDetail[0].whitelabelTotal)) : '-'}
                  </p>
                  {/* Valor a enviar em crypto (BTC ou USDT) */}
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {(() => {
                      if (!withdrawal.feesDetail || withdrawal.feesDetail.length === 0) return '-';
                      const valorEnviarBRL = Number(withdrawal.amount) - Number(withdrawal.feesDetail[0].whitelabelTotal);
                      const rate = withdrawal.cryptoValue > 0 ? withdrawal.amount / withdrawal.cryptoValue : null;
                      if (!rate) return '-';
                      if (withdrawal.cryptoType === 'BTC') {
                        const btc = valorEnviarBRL / rate;
                        return `${btc.toFixed(8)} BTC`;
                      } else if (withdrawal.cryptoType === 'USDT') {
                        const usdt = valorEnviarBRL / rate;
                        return `${usdt.toFixed(6)} USDT`;
                      }
                      return '-';
                    })()}
                  </p>
                </div>
                {/* Satoshis para envio (apenas BTC) */}
                {withdrawal.cryptoType === 'BTC' && withdrawal.feesDetail && withdrawal.feesDetail.length > 0 && withdrawal.cryptoValue && withdrawal.amount && (
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">⚡</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Para envio (satoshis)</p>
                    </div>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                      {(() => {
                        const valorEnviarBRL = Number(withdrawal.amount) - Number(withdrawal.feesDetail[0].whitelabelTotal);
                        const rate = withdrawal.cryptoValue > 0 ? withdrawal.amount / withdrawal.cryptoValue : null;
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
        )}

        {withdrawal?.failedReason && (
          <div className="mt-6 p-4 bg-status-rejected/10 rounded-lg border border-status-rejected/20">
            <h2 className="text-lg font-semibold text-status-rejected mb-2">Motivo da Falha</h2>
            <p className="text-status-rejected">{withdrawal.failedReason}</p>
          </div>
        )}

        {withdrawal?.notes && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Observações</h2>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-foreground">{withdrawal.notes}</p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Pagamentos Associados</h2>
          <Table
            data={payments || []}
            columns={paymentColumns}
            isLoading={isLoadingPayments}
            onRowClick={(payment) => setSelectedPayment(payment)}
          />
        </div>
      </div>

      {selectedPayment && (
        <PaymentsModal
          payment={selectedPayment}
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}
