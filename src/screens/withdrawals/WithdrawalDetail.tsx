import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, Copy } from 'lucide-react';
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
 