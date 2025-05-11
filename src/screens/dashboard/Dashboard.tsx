import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Users, CreditCard, Wallet, BarChart3, ChevronUp, TrendingUp, DollarSign, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import userRepository from '../../repository/user-repository';
import paymentRepository from '../../repository/payment-repository';
import withdrawalRepository from '../../repository/withdrawal-repository';
import { formatCurrency } from '../../utils/format';
import { Link } from 'react-router-dom';

// Importar componentes de gráficos
import UsersGrowthChart from '../charts/UsersGrowthChart';
import PaymentsStatusChart from '../charts/PaymentsStatusChart';
import PaymentsMonthlyChart from '../charts/PaymentsMonthlyChart';
import WithdrawalsStatusChart from '../charts/WithdrawalsStatusChart';
import TopUsersChart from '../charts/TopUsersChart';
import { User, Payment, Withdrawal } from '../../models/types';

export default function Dashboard() {
  // Buscar todos os dados necessários
  const { data: usersData, isLoading: loadingUsers } = useQuery(
    'allUsers',
    () => userRepository.getUsers({ page: 1, limit: 1000 })
  );
  const { data: paymentsData, isLoading: loadingPayments } = useQuery(
    'allPayments',
    () => paymentRepository.getPayments({ page: 1, limit: 1000 })
  );
  const { data: withdrawalsData, isLoading: loadingWithdrawals } = useQuery(
    'allWithdrawals',
    () => withdrawalRepository.getWithdrawals({ page: 1, limit: 1000 })
  );

  // Dados agregados
  const stats = useMemo(() => {
    const users = usersData?.data || [];
    const payments = paymentsData?.data || [];
    const withdrawals = withdrawalsData?.data || [];

    // Contagem de pagamentos com comprovantes enviados
    const receiptsCount = payments.filter(p => p.status === 'receipt_sent').length;
    
    // Contagem de saques em processamento ou pendentes
    const withdrawalsPendingCount = withdrawals.filter(w => w.status === 'pending').length;
    const withdrawalsProcessingCount = withdrawals.filter(w => w.status === 'processing').length;
    const withdrawalsToProcessCount = withdrawalsPendingCount + withdrawalsProcessingCount;

    // Usuários
    const totalUsers = users.length;
    const usersByMonth = processUsersByMonth(users);

    // Pagamentos
    const totalPayments = payments.length;
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
    const paidCount = payments.filter(p => p.status === 'paid').length;
    const totalRetido = payments.filter(p => ['approved', 'withdrawal_processing'].includes(p.status)).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalTransacted = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Pagamentos por status
    const paymentsByStatus = processPaymentsByStatus(payments);

    // Saques por status
    const withdrawalsByStatus = processWithdrawalsByStatus(withdrawals);

    // Top usuários
    const topUsersByAmount = processTopUsersByAmount(payments, users);
    const topUsersByCount = processTopUsersByCount(payments, users);

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
      topUsersByAmount,
      topUsersByCount,
      receiptsCount,
      withdrawalsProcessingCount,
      withdrawalsPendingCount,
      withdrawalsToProcessCount
    };
  }, [usersData, paymentsData, withdrawalsData]);

  // Verificar se há alguma tarefa pendente
  const hasPendingTasks = stats.receiptsCount > 0 || stats.withdrawalsToProcessCount > 0;

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

        {/* Avisos de comprovantes e saques (quando os dados já foram carregados) */}
        {!loadingPayments && stats.receiptsCount > 0 && (
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
        )}
        
        {!loadingWithdrawals && stats.withdrawalsToProcessCount > 0 && (
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
        )}

        {/* Mensagem de "tudo em dia" (somente quando não está carregando e não há tarefas pendentes) */}
        {!loadingPayments && !loadingWithdrawals && !hasPendingTasks && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <h3 className="font-medium text-green-500">Tudo em dia!</h3>
                <p className="text-sm text-muted-foreground">
                  Não há comprovantes para verificar ou saques para processar no momento.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cards de estatísticas (menores e mais compactos) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard 
          title="Usuários" 
          value={stats.totalUsers} 
          icon={<Users className="h-5 w-5 text-primary" />}
          linkTo="/users"
          loading={loadingUsers}
        />
        <StatCard 
          title="Total Movimentado" 
          value={formatCurrency(stats.totalTransacted)} 
          icon={<BarChart3 className="h-5 w-5 text-indigo-500" />}
          linkTo="/payments"
          loading={loadingPayments}
        />
        <StatCard 
          title="Pagamentos Pagos" 
          value={stats.paidCount} 
          subtext={formatCurrency(stats.totalPaid)}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          linkTo="/payments"
          loading={loadingPayments}
        />
        <StatCard 
          title="Pagamentos Retidos" 
          value={formatCurrency(stats.totalRetido)} 
          icon={<CreditCard className="h-5 w-5 text-orange-500" />}
          linkTo="/payments"
          loading={loadingPayments}
        />
      </div>

      {/* Gráficos - Mais compactos e responsivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Crescimento de usuários e pagamentos por status */}
        <ChartCard 
          title="Crescimento de Usuários" 
          content={<UsersGrowthChart usersByMonth={stats.usersByMonth} loading={loadingUsers} height={180} />} 
        />
        <ChartCard 
          title="Pagamentos por Status" 
          content={<PaymentsStatusChart paymentsByStatus={stats.paymentsByStatus} loading={loadingPayments} height={180} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Top usuários por valor */}
        <ChartCard 
          title="Top Usuários por Valor" 
          content={<TopUsersChart data={stats.topUsersByAmount} loading={loadingPayments} dataKey="amount" valueFormatter={formatCurrency} height={200} />} 
        />
        {/* Top usuários por quantidade */}
        <ChartCard 
          title="Top Usuários por Quantidade" 
          content={<TopUsersChart data={stats.topUsersByCount} loading={loadingPayments} dataKey="count" height={200} />} 
        />
        {/* Saques por status */}
        <ChartCard 
          title="Saques por Status" 
          content={<WithdrawalsStatusChart withdrawalsByStatus={stats.withdrawalsByStatus} loading={loadingWithdrawals} height={200} />} 
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
              {subtext && <p className="text-xs text-accent">{subtext}</p>}
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

function processTopUsersByAmount(payments: Payment[], users: User[]) {
  // Considerar apenas pagamentos com status 'paid', 'approved' ou 'withdrawal_processing'
  const validStatuses = ['paid', 'approved', 'withdrawal_processing'];
  const userAmounts: Record<string, { userId: string; amount: number; count: number }> = {};
  payments.forEach((p) => {
    if (!validStatuses.includes(p.status)) return;
    if (!userAmounts[p.userId]) userAmounts[p.userId] = { userId: p.userId, amount: 0, count: 0 };
    userAmounts[p.userId].amount += p.amount || 0;
    userAmounts[p.userId].count += 1;
  });

  const userMap: Record<string, string> = users.reduce((map, user) => {
    map[user.id] = `${user.firstName} ${user.lastName}`;
    return map;
  }, {} as Record<string, string>);

  return Object.values(userAmounts)
    .map((item) => ({
      ...item,
      name: userMap[item.userId] || `Usuário ${item.userId.slice(0, 5)}...`,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

function processTopUsersByCount(payments: Payment[], users: User[]) {
  // Considerar apenas pagamentos com status 'paid', 'approved' ou 'withdrawal_processing'
  const validStatuses = ['paid', 'approved', 'withdrawal_processing'];
  const userCounts: Record<string, { userId: string; count: number; amount: number }> = {};
  payments.forEach((p) => {
    if (!validStatuses.includes(p.status)) return;
    if (!userCounts[p.userId]) userCounts[p.userId] = { userId: p.userId, count: 0, amount: 0 };
    userCounts[p.userId].count += 1;
    userCounts[p.userId].amount += p.amount || 0;
  });

  const userMap: Record<string, string> = users.reduce((map, user) => {
    map[user.id] = `${user.firstName} ${user.lastName}`;
    return map;
  }, {} as Record<string, string>);

  return Object.values(userCounts)
    .map((item) => ({
      ...item,
      name: userMap[item.userId] || `Usuário ${item.userId.slice(0, 5)}...`,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}