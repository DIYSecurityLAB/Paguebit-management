import React, { useState } from 'react';
import MetricCards from '../cards/MetricCards';
import PaymentTimeSeriesChart from '../charts/PaymentTimeSeriesChart';
import PaymentStatusChart from '../charts/PaymentStatusChart';
import WithdrawalTimeSeriesChart from '../charts/WithdrawalTimeSeriesChart';
import TransactionTypeChart from '../charts/TransactionTypeChart';
import IncomeExpenseComparisonChart from '../charts/IncomeExpenseComparisonChart';
import RecentPaymentsTable from '../tables/RecentPaymentsTable';
import RecentWithdrawalsTable from '../tables/RecentWithdrawalsTable';
import StoreUsersTable from '../tables/StoreUsersTable';
import StoreWalletsTable from '../tables/StoreWalletsTable';
import { Store } from '../../../../domain/entities/Store.entity';
import { useDashboard } from './useDashboard';
import Loading from '../../../../components/Loading';

interface StoreDashboardProps {
  store: Store;
}

const StoreDashboard: React.FC<StoreDashboardProps> = ({ store }) => {
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('month');

  // Hook chamado apenas aqui, uma vez, com storeId e limit
  const { payments, withdrawals, loading } = useDashboard({
    storeId: store.id,
    limit: '10000',
  });

  // Filtros globais para o dashboard detalhado
  // const { payments, withdrawals, loading } = useDashboard({
  //   storeId: store.id,
  //   limit: '10000',
  //   // Você pode adicionar outros filtros globais aqui (dateFrom, dateTo, status, etc)
  // });

  // Cálculo das métricas
  const filteredPayments = payments.filter(p => p.storeId === store.id);
  const filteredWithdrawals = withdrawals.filter(w => w.storeId === store.id);

  const totalReceived = filteredPayments
    .filter(p => ['approved', 'paid'].includes(p.status))
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalWithdrawn = filteredWithdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  const currentBalance = totalReceived - totalWithdrawn;

  const totalPayments = filteredPayments.length;
  const totalWithdrawals = filteredWithdrawals.length;
  const totalUsers = (() => {
    // Junta todos os usuários vinculados + o owner (caso não esteja na lista)
    const users = Array.isArray(store.users) ? [...store.users] : [];
    const ownerAlreadyListed = users.some(u => u.id === store.ownerId);
    if (!ownerAlreadyListed && store.ownerId) {
      users.unshift({
        id: store.ownerId,
        email: '', // pode buscar email real se necessário
        firstName: 'Owner',
        lastName: '',
        permissions: [],
      });
    }
    return users.length;
  })();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex justify-end mb-4">
        <div className="bg-card rounded-lg shadow p-2">
          <select 
            className="bg-background border-none focus:ring-0"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as any)}
          >
            <option value="day">Por Dia</option>
            <option value="week">Por Semana</option>
            <option value="month">Por Mês</option>
          </select>
        </div>
      </div>
      
      {/* Cards de métricas */}
      <MetricCards 
        totalReceived={totalReceived}
        totalWithdrawn={totalWithdrawn}
        currentBalance={currentBalance}
        totalPayments={totalPayments}
        totalWithdrawals={totalWithdrawals}
        totalUsers={totalUsers}
      />
      
      {/* Gráficos principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Faturamento ao Longo do Tempo</h3>
          {/* Passa os dados já carregados como props */}
          <PaymentTimeSeriesChart payments={filteredPayments} timeFrame={timeFrame} />
        </div>
        <div className="bg-card rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Pagamentos por Status</h3>
          <PaymentStatusChart payments={filteredPayments} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Volume de Saques</h3>
          <WithdrawalTimeSeriesChart withdrawals={filteredWithdrawals} timeFrame={timeFrame} />
        </div>
        <div className="bg-card rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Pagamentos por Tipo</h3>
          <TransactionTypeChart payments={filteredPayments} />
        </div>
      </div>
      
      <div className="bg-card rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium mb-4">Comparativo de Entradas e Saídas</h3>
        <IncomeExpenseComparisonChart 
          payments={filteredPayments} 
          withdrawals={filteredWithdrawals}
          timeFrame={timeFrame}
        />
      </div>
      
      {/* Tabelas de dados */}
      <div className="bg-card rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium mb-4">Pagamentos Recentes</h3>
        <RecentPaymentsTable payments={filteredPayments} />
      </div>
      
      <div className="bg-card rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium mb-4">Saques Recentes</h3>
        <RecentWithdrawalsTable withdrawals={filteredWithdrawals} />
      </div>
      
      <div className="bg-card rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium mb-4">Usuários Vinculados</h3>
        <StoreUsersTable
          users={
            (() => {
              // Junta todos os usuários vinculados + o owner (caso não esteja na lista)
              const users = Array.isArray(store.users) ? [...store.users] : [];
              const ownerAlreadyListed = users.some(u => u.id === store.ownerId);
              if (!ownerAlreadyListed && store.ownerId) {
                users.unshift({
                  id: store.ownerId,
                  email: '', // pode buscar email real se necessário
                  firstName: 'Owner',
                  lastName: '',
                  permissions: [],
                  name: 'Owner',
                  whitelabelId: store.whitelabelId,
                });
              }
              return users;
            })()
          }
        />
      </div>
      
      <div className="bg-card rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium mb-4">Carteiras Cadastradas</h3>
        <StoreWalletsTable wallets={store.wallets || []} />
      </div>
    </div>
  );
};

export default StoreDashboard;
