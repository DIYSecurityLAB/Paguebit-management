import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Users, CreditCard, BarChart3, DollarSign, AlertCircle, CheckCircle, Loader2, Store as StoreIcon } from 'lucide-react';
import { UserRepository } from '../../data/repository/user-repository';
import { PaymentRepository } from '../../data/repository/payment-repository';
import { WithdrawalRepository } from '../../data/repository/withdrawal-repository';
import { StoreRepository } from '../../data/repository/store-repository';
import { formatCurrency } from '../../utils/format';
import { Link } from 'react-router-dom';

// Importar componentes de gráficos existentes
import UsersGrowthChart from './charts/UsersGrowthChart';
import PaymentsStatusChart from './charts/PaymentsStatusChart';
import PaymentsMonthlyChart from './charts/PaymentsMonthlyChart';
import WithdrawalsStatusChart from './charts/WithdrawalsStatusChart';
import TopUsersChart from './charts/TopUsersChart';
import PaymentsDistributionChart from './charts/PaymentsDistributionChart';
import PaymentTypeChart from './charts/PaymentTypeChart';
import ReferralsChart from './charts/ReferralsChart';
import ActiveUsersChart from './charts/ActiveUsersChart';

// IMPORTAR TIPOS EXPLICITAMENTE
import type { User } from '../../domain/entities/User.entity';
import type { Payment } from '../../domain/entities/Payment.entity';
import type { Withdrawal } from '../../domain/entities/Withdrawal.entity';
import type { Store } from '../../domain/entities/Store.entity';

// Buscar todos os dados necessários (agora incluindo stores)
export default function Dashboard() {
  const userRepository = new UserRepository();
  const paymentRepository = new PaymentRepository();
  const withdrawalRepository = new WithdrawalRepository();
  const storeRepository = new StoreRepository();

  const { data: usersData, isLoading: loadingUsers } = useQuery(
    'allUsers',
    () => userRepository.listAllUsers({ page: '1', limit: '10000' })
  );
  const { data: paymentsData, isLoading: loadingPayments } = useQuery(
    'allPayments',
    () => paymentRepository.listPayments({ page: '1', limit: '100000' })
  );
  const { data: withdrawalsData, isLoading: loadingWithdrawals } = useQuery(
    'allWithdrawals',
    () => withdrawalRepository.listWithdrawals({ page: '1', limit: '10000' })
  );
  const { data: storesData, isLoading: loadingStores } = useQuery(
    'allStores',
    () => storeRepository.listStores({ page: '1', limit: '10000' })
  );

  // Dados agregados (agora por loja)
  const stats = useMemo(() => {
    const users = usersData?.data || [];
    const payments = paymentsData?.data || [];
    const withdrawals = withdrawalsData?.data || [];
    const stores = storesData?.data || [];

    // Contagem de pagamentos com comprovantes enviados
    const receiptsCount = payments.filter(p => p.status === 'receipt_sent').length;

    // Contagem de saques em processamento ou pendentes
    const withdrawalsPendingCount = withdrawals.filter(w => w.status === 'pending').length;
    const withdrawalsProcessingCount = withdrawals.filter(w => w.status === 'processing').length;
    const withdrawalsToProcessCount = withdrawalsPendingCount + withdrawalsProcessingCount;

    // Usuários
    const totalUsers = users.length;
    const usersByMonth = processUsersByMonth(users);

    // Lojas
    const totalStores = stores.length;

    // Pagamentos por loja
    const totalPayments = payments.length;
    const paymentsPaid = payments.filter(p => p.status === 'paid');
    const totalPaid = paymentsPaid.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paidCount = paymentsPaid.length;
    const paymentsRetidos = payments.filter(p => ['approved', 'withdrawal_processing'].includes(p.status));
    const totalRetido = paymentsRetidos.reduce((sum, p) => sum + (p.amount || 0), 0);
    const retidoCount = paymentsRetidos.length;
    // Total transacionado por loja (pagamentos + saques)
    const totalTransacted = payments.reduce((sum, p) => sum + (p.amount || 0), 0) +
      withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const totalPaymentsAndWithdrawalsCount = payments.length + withdrawals.length;

    // Valor total de saques concluídos por loja
    const withdrawalsCompleted = withdrawals.filter(w => w.status === 'completed');
    const totalWithdrawalsCompleted = withdrawalsCompleted.reduce((sum, w) => sum + (w.amount || 0), 0);
    const withdrawalsCompletedCount = withdrawalsCompleted.length;

    // Pagamentos por status
    const paymentsByStatus = processPaymentsByStatus(payments);

    // Saques por status
    const withdrawalsByStatus = processWithdrawalsByStatus(withdrawals);

    // Top lojas por volume de pagamentos
    const topStoresByAmount = processTopStoresByAmount(payments, stores);

    return {
      totalUsers,
      usersByMonth,
      totalPayments,
      totalPaid,
      paidCount,
      totalRetido,
      totalTransacted,
      paymentsByStatus,
      withdrawalsByStatus,
      topStoresByAmount,
      receiptsCount,
      withdrawalsProcessingCount,
      withdrawalsPendingCount,
      withdrawalsToProcessCount,
      totalWithdrawalsCompleted,
      withdrawalsCompletedCount,
      totalPaymentsCount: payments.length,
      totalWithdrawalsCount: withdrawals.length,
      totalPaymentsAndWithdrawalsCount,
      retidoCount,
      totalStores
    };
  }, [usersData, paymentsData, withdrawalsData, storesData]);

  // Verificar se há alguma tarefa pendente
  const hasReceiptPendingTasks = stats.receiptsCount > 0;
  const hasWithdrawalPendingTasks = stats.withdrawalsToProcessCount > 0;
  const hasPendingTasks = hasReceiptPendingTasks || hasWithdrawalPendingTasks;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
          })}
        </p>
      </div>

      {/* Avisos importantes para ações manuais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        {/* Loading de comprovantes */}
        {loadingPayments && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
              <div>
                <h3 className="font-medium text-amber-500">Verificando comprovantes...</h3>
                <p className="text-sm text-muted-foreground">
                  Carregando informações de pagamentos
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading de saques */}
        {loadingWithdrawals && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              <div>
                <h3 className="font-medium text-blue-500">Verificando saques...</h3>
                <p className="text-sm text-muted-foreground">
                  Carregando informações de saques pendentes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Avisos de comprovantes (quando os dados já foram carregados) */}
        {!loadingPayments && (
          <>
            {stats.receiptsCount > 0 ? (
              <Link to="/payments?status=receipt_sent" className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 hover:bg-amber-500/20 transition-colors">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="font-medium text-amber-500">Comprovantes para verificar</h3>
                    <p className="text-sm text-muted-foreground">
                      <strong>{stats.receiptsCount}</strong> pagamento(s) com comprovante enviado aguardando verificação
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <h3 className="font-medium text-green-500">Sem comprovantes pendentes</h3>
                    <p className="text-sm text-muted-foreground">
                      Não há comprovantes para verificar no momento.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Avisos de saques (quando os dados já foram carregados) */}
        {!loadingWithdrawals && (
          <>
            {stats.withdrawalsToProcessCount > 0 ? (
              <Link to="/withdrawals?status=pending,processing" className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 hover:bg-blue-500/20 transition-colors">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <div>
                    <h3 className="font-medium text-blue-500">Saques para processar</h3>
                    <p className="text-sm text-muted-foreground">
                      <strong>{stats.withdrawalsToProcessCount}</strong> saque(s) aguardando processamento
                      {stats.withdrawalsPendingCount > 0 && stats.withdrawalsProcessingCount > 0 && (
                        <span> ({stats.withdrawalsPendingCount} pendentes e {stats.withdrawalsProcessingCount} em processamento)</span>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <h3 className="font-medium text-green-500">Sem saques pendentes</h3>
                    <p className="text-sm text-muted-foreground">
                      Não há saques para processar no momento.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Removemos a mensagem geral de "tudo em dia" pois agora mostramos mensagens específicas */}
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard 
          title="Usuários" 
          value={stats.totalUsers} 
          icon={<Users className="h-5 w-5 text-primary" />}
          linkTo="/users"
          loading={loadingUsers}
        />
        <StatCard 
          title="Lojas" 
          value={stats.totalStores} 
          icon={<StoreIcon className="h-5 w-5 text-blue-500" />}
          linkTo="/stores"
          loading={loadingStores}
        />
        <StatCard 
          title="Total Movimentado" 
          value={formatCurrency(stats.totalTransacted)} 
          subtext={
            <span className="text-muted-foreground">
              {stats.totalPaymentsAndWithdrawalsCount} movim. 
              <span className="ml-1">({stats.totalPaymentsCount} pag., {stats.totalWithdrawalsCount} saq.)</span>
            </span>
          }
          icon={<BarChart3 className="h-5 w-5 text-indigo-500" />}
          linkTo="/payments"
          loading={loadingPayments || loadingWithdrawals}
        />
        <StatCard 
          title="Saques Concluídos" 
          value={formatCurrency(stats.totalWithdrawalsCompleted)} 
          subtext={
            <span className="text-muted-foreground">
              {stats.paidCount} pag. pagos, {stats.withdrawalsCompletedCount} saq. concluídos
            </span>
          }
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          linkTo="/withdrawals?status=completed"
          loading={loadingWithdrawals || loadingPayments}
        />
        <StatCard 
          title="Pagamentos Retidos" 
          value={formatCurrency(stats.totalRetido)} 
          subtext={
            <span className="text-muted-foreground">
              {stats.retidoCount} pag. retidos
              {stats.withdrawalsPendingCount > 0 && (
                <> &middot; {stats.withdrawalsPendingCount} saq. pendentes</>
              )}
            </span>
          }
          icon={<CreditCard className="h-5 w-5 text-orange-500" />}
          linkTo="/payments"
          loading={loadingPayments || loadingWithdrawals}
        />
      </div>

      {/* Principais Fontes e Tipos de Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCard 
          title="Tipos de Pagamento" 
          content={<PaymentTypeChart payments={paymentsData?.data || []} loading={loadingPayments} height={420} />} 
        />
        <ChartCard 
          title="Principais Fontes de Indicação" 
          content={<ReferralsChart users={usersData?.data || []} loading={loadingUsers} height={420} limit={10} />} 
        />
      </div>

      {/* Top Lojas e Pagamentos por Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCard 
          title="Top Lojas" 
          content={
            <TopUsersChart 
              data={stats.topStoresByAmount} 
              loading={loadingPayments} 
              valueFormatter={formatCurrency} 
              height={420}
            />
          } 
        />
        <ChartCard 
          title="Pagamentos por Status" 
          content={<PaymentsStatusChart paymentsByStatus={stats.paymentsByStatus} loading={loadingPayments} height={420} />} 
        />
      </div>

      {/* Crescimento, Distribuição e Saques */}
      <div className="grid grid-cols-1 gap-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ChartCard 
            title="Distribuição por Valor" 
            content={<PaymentsDistributionChart payments={paymentsData?.data || []} loading={loadingPayments} height={220} />} 
          />
          <ChartCard 
            title="Saques por Status" 
            content={<WithdrawalsStatusChart withdrawalsByStatus={stats.withdrawalsByStatus} loading={loadingWithdrawals} height={220} />} 
          />
        </div>
        <ChartCard 
          title="Crescimento de Usuários" 
          content={<UsersGrowthChart users={usersData?.data || []} loading={loadingUsers} height={220} />} 
        />
        {/* Lojas Ativas pode ser mantido, mas agora não depende de pagamentos/saques diretamente */}
        <ChartCard 
          title="Lojas Ativas (pagamento retido ou pago)" 
          content={
            <ActiveUsersChart 
              stores={storesData?.data || []} 
              payments={paymentsData?.data || []} 
              loading={loadingStores || loadingPayments} 
              height={220}
            />
          }
        />
      </div>
      {/* Pagamentos mensais */}
      <ChartCard 
        title="Pagamentos Mensais" 
        content={<PaymentsMonthlyChart payments={paymentsData?.data || []} loading={loadingPayments} height={200} />} 
      />
    </div>
  );
}

// Componentes auxiliares para melhorar a organização
import type { ReactNode } from 'react';

function StatCard({
  title,
  value,
  subtext,
  icon,
  linkTo = "#",
  loading = false
}: {
  title: string;
  value: ReactNode;
  subtext?: ReactNode;
  icon: ReactNode;
  linkTo?: string;
  loading?: boolean;
}) {
  return (
    <Link to={linkTo} className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs text-muted-foreground font-medium">{title}</h3>
          {loading ? (
            <div className="mt-1 flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Carregando...</span>
            </div>
          ) : (
            <>
              <p className="text-lg font-bold text-foreground mt-1">{value}</p>
              {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            </>
          )}
        </div>
        <div className="bg-primary/10 p-2 rounded-full">{icon}</div>
      </div>
    </Link>
  );
}

function ChartCard({
  title,
  content
}: {
  title: string;
  content: ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <h2 className="font-medium text-sm text-foreground mb-2">{title}</h2>
      {content}
    </div>
  );
}

// Funções auxiliares para processamento de dados
function processUsersByMonth(users: User[]): Record<string, number> {
  const usersByMonth: Record<string, number> = {};
  users.forEach((u) => {
    if (u.createdAt) {
      const month = new Date(u.createdAt).toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      usersByMonth[month] = (usersByMonth[month] || 0) + 1;
    }
  });
  return usersByMonth;
}

function processPaymentsByStatus(payments: Payment[]): Record<string, { count: number; amount: number }> {
  const paymentsByStatus: Record<string, { count: number; amount: number }> = {};
  payments.forEach((p) => {
    const status = p.status || 'unknown';
    if (!paymentsByStatus[status]) paymentsByStatus[status] = { count: 0, amount: 0 };
    paymentsByStatus[status].count += 1;
    paymentsByStatus[status].amount += p.amount || 0;
  });
  return paymentsByStatus;
}

function processWithdrawalsByStatus(withdrawals: Withdrawal[]): Record<string, number> {
  const withdrawalsByStatus: Record<string, number> = {};
  withdrawals.forEach((w) => {
    const status = w.status || 'unknown';
    withdrawalsByStatus[status] = (withdrawalsByStatus[status] || 0) + 1;
  });
  return withdrawalsByStatus;
}

// Novo: Top lojas por volume de pagamentos
function processTopStoresByAmount(payments: Payment[], stores: Store[]) {
  const validStatuses = ['paid', 'approved', 'withdrawal_processing'];
  const storeAmounts: Record<string, { storeId: string; amount: number; count: number }> = {};

  payments.forEach((p) => {
    if (!validStatuses.includes(p.status)) return;
    if (!storeAmounts[p.storeId]) {
      storeAmounts[p.storeId] = { storeId: p.storeId, amount: 0, count: 0 };
    }
    storeAmounts[p.storeId].amount += p.amount || 0;
    storeAmounts[p.storeId].count += 1;
  });

  const storeMap: Record<string, string> = stores.reduce((map, store) => {
    map[store.id] = store.name;
    return map;
  }, {} as Record<string, string>);

  return Object.values(storeAmounts)
    .map((item) => ({
      ...item,
      name: storeMap[item.storeId] || `Loja ${item.storeId.slice(0, 5)}...`,
    }))
    .sort((a, b) => b.amount - a.amount);
}