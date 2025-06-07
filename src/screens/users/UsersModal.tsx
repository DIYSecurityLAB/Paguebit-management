import { useState } from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { Copy } from 'lucide-react';
import Modal from '../../components/Modal';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import PaymentsModal from '../payments/PaymentsModal';
import { User, Payment } from '../../models/types';
import paymentRepository from '../../repository/payment-repository';
import { formatCurrency } from '../../utils/format';
import { toast } from 'sonner';

interface UsersModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function UsersModal({ user, isOpen, onClose }: UsersModalProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  const { data: payments, isLoading } = useQuery(
    ['user-payments', user.id],
    () => paymentRepository.getPayments({ userId: user.id }),
    {
      enabled: isOpen,
    }
  );

  const columns = [
    {
      header: 'Tipo',
      accessor: (payment: Payment) => (
        <span className="capitalize">{payment.transactionType || <span className="text-red-500">sem informação</span>}</span>
      ),
    },
    {
      header: 'Valor',
      accessor: (payment: Payment) => payment.amount !== undefined ? 
        formatCurrency(payment.amount) : 
        <span className="text-red-500">sem informação</span>,
    },
    {
      header: 'Status',
      accessor: (payment: Payment) => (
        payment.status ? 
          <StatusBadge status={payment.status} /> : 
          <span className="text-red-500">sem informação</span>
      ),
    },
    {
      header: 'Data',
      accessor: (payment: Payment) => payment.createdAt ? 
        format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm') : 
        <span className="text-red-500">sem informação</span>,
    },
  ];

  // Função para copiar o endereço da carteira
  const handleCopyWallet = (walletType: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedWallet(walletType);
    toast.success('Endereço copiado com sucesso!');
    
    // Limpar a mensagem de copiado após alguns segundos
    setTimeout(() => {
      setCopiedWallet(null);
    }, 1500);
  };

  return (
    <>
      <Modal
        title="Detalhes do Usuário"
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Nome</label>
              <p className="font-medium">
                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                  <span className="text-red-500">sem informação</span>}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="font-medium">
                {user.email || <span className="text-red-500">sem informação</span>}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Documento</label>
              <p className="font-medium">
                {user.documentId ? 
                  `${user.documentType}: ${user.documentId}` : 
                  <span className="text-red-500">sem informação</span>}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Telefone</label>
              <p className="font-medium">
                {user.phoneNumber || <span className="text-red-500">sem informação</span>}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Função</label>
              <p className="font-medium capitalize">
                {user.role || <span className="text-red-500">sem informação</span>}
              </p>
            </div>
            {user.referral && (
              <div>
                <label className="text-sm text-muted-foreground">Indicação</label>
                <p className="font-medium">{user.referral}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground">Planeja transacionar mensalmente</label>
              <p className="font-medium">
                R$ {user.monthlyVolume !== undefined && user.monthlyVolume !== null
                  ? formatCurrency(user.monthlyVolume)
                  : <span className="text-red-500">sem informação</span>}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-3">Carteiras</h3>
            <div className="space-y-2">
              {Object.entries(user.wallets).map(([type, address]) => (
                address && (
                  <div key={type}>
                    <label className="text-sm text-muted-foreground">{type}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium break-all flex-1">{address}</p>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                        onClick={() => handleCopyWallet(type, address)}
                        title="Copiar endereço da carteira"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {copiedWallet === type && (
                        <span className="text-xs text-green-600 ml-1">Copiado!</span>
                      )}
                    </div>
                  </div>
                )
              ))}
              {!Object.values(user.wallets).some(Boolean) && (
                <p className="text-sm text-muted-foreground">Nenhuma carteira configurada</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-3">Pagamentos</h3>
            {payments?.data?.length ? (
              <Table
                data={payments.data || []}
                columns={columns}
                isLoading={isLoading}
                onRowClick={(payment) => setSelectedPayment(payment)}
              />
            ) : isLoading ? (
              <div className="h-20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Carregando pagamentos...</p>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhum pagamento encontrado</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {selectedPayment && (
        <PaymentsModal
          payment={selectedPayment}
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </>
  );
}