import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Table, { TableColumn } from '../../components/Table';
import PaymentsModal from '../payments/PaymentsModal';
import { Withdrawal, Payment } from '../../models/types';
import withdrawalRepository from '../../repository/withdrawal-repository';
import paymentRepository from '../../repository/payment-repository';
import { formatCurrency } from '../../utils/format';

export default function WithdrawalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data: withdrawal, isLoading, error } = useQuery(
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

  const { data: payments, isLoading: isLoadingPayments } = useQuery(
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
      header: 'Data de Criação',
      accessor: (payment: Payment) => format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm'),
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
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Detalhes de Processamento</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">ID do Usuário</label>
                <p className="font-medium break-all">{withdrawal?.userId}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Criado em</label>
                <p className="font-medium">
                  {withdrawal?.createdAt ? format(new Date(withdrawal.createdAt), 'dd/MM/yyyy HH:mm:ss') : '-'}
                </p>
              </div>
              {withdrawal?.completedAt && (
                <div>
                  <label className="text-sm text-muted-foreground">Concluído em</label>
                  <p className="font-medium">
                    {format(new Date(withdrawal.completedAt), 'dd/MM/yyyy HH:mm:ss')}
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
