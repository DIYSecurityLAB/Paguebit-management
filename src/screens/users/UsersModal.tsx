import { useState } from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import Modal from '../../components/Modal';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import PaymentsModal from '../payments/PaymentsModal';
import { User, Payment } from '../../models/types';
import paymentRepository from '../../repository/payment-repository';
import { formatCurrency } from '../../utils/format';

interface UsersModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function UsersModal({ user, isOpen, onClose }: UsersModalProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data: payments, isLoading } = useQuery(
    ['user-payments', user.id],
    () => paymentRepository.getPayments({ userId: user.id }),
    {
      enabled: isOpen,
    }
  );

  const columns = [
    {
      header: 'Type',
      accessor: (payment: Payment) => (
        <span className="capitalize">{payment.transactionType || <span className="text-red-500">sem informação</span>}</span>
      ),
    },
    {
      header: 'Amount',
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
      header: 'Date',
      accessor: (payment: Payment) => payment.createdAt ? 
        format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm') : 
        <span className="text-red-500">sem informação</span>,
    },
  ];

  return (
    <>
      <Modal
        title="User Details"
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Name</label>
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
              <label className="text-sm text-muted-foreground">Document</label>
              <p className="font-medium">
                {user.documentId ? 
                  `${user.documentType}: ${user.documentId}` : 
                  <span className="text-red-500">sem informação</span>}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Phone</label>
              <p className="font-medium">
                {user.phoneNumber || <span className="text-red-500">sem informação</span>}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Role</label>
              <p className="font-medium capitalize">
                {user.role || <span className="text-red-500">sem informação</span>}
              </p>
            </div>
            {user.referral && (
              <div>
                <label className="text-sm text-muted-foreground">Referral</label>
                <p className="font-medium">{user.referral}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-3">Wallets</h3>
            <div className="space-y-2">
              {Object.entries(user.wallets).map(([type, address]) => (
                address && (
                  <div key={type}>
                    <label className="text-sm text-muted-foreground">{type}</label>
                    <p className="font-medium break-all">{address}</p>
                  </div>
                )
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-3">Payments</h3>
            <Table
              data={payments?.data || []}
              columns={columns}
              isLoading={isLoading}
              onRowClick={(payment) => setSelectedPayment(payment)}
            />
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