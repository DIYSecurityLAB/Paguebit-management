import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { format, isSameMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Loading from '../../../components/Loading';
import Button from '../../../components/Button';
import { User, Payment } from '../../../models/types';
import userRepository from '../../../repository/user-repository';
import paymentRepository from '../../../repository/payment-repository';

// Importar componentes
import UserBasicInfo from './components/UserBasicInfo';
import UserWallets from './components/UserWallets';
import UserActivity from './components/UserActivity';
import UserFinancialSummary from './components/UserFinancialSummary';
import UserTransactionsChart from './charts/UserTransactionsChart';
import UserStatusDistributionChart from './charts/UserStatusDistributionChart';
import UserActivityHeatmap from './charts/UserActivityHeatmap';

// Importar utilitários
import { calculateGrowthRate, generateHeatmapData } from './utils/userChartUtils';

// Interfaces para os dados dos gráficos
interface MonthlyDataItem {
  month: string;
  amount: number;
}

interface StatusDataItem {
  status: string;
  count: number;
  amount: number;
}

interface ActivityDataItem {
  date: string;
  count: number;
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!id) return;
        setLoading(true);
        
        // Buscar usuário e pagamentos em paralelo
        const [userData, paymentsData] = await Promise.all([
          userRepository.getUserById(id),
          paymentRepository.getPayments({ 
            userId: id,
            limit: 100,
            orderBy: 'createdAt',
            order: 'desc'
          })
        ]);
        
        setUser(userData);
        setPayments(paymentsData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  // Handler para atualizar o usuário após edições
  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Dados de atividade do usuário ao longo do tempo
  const userActivityData = useMemo(() => {
    const months = 6;
    const now = new Date();
    const result: ActivityDataItem[] = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthPayments = payments.filter(p => 
        p.createdAt && isSameMonth(new Date(p.createdAt), monthDate)
      );
      
      result.push({
        date: format(monthDate, 'MMM yyyy', { locale: ptBR }),
        count: monthPayments.length
      });
    }
    
    return result;
  }, [payments]);

  // Mover todos os cálculos para useMemo hooks para evitar problemas com ordem de hooks
  const paymentStats = useMemo(() => {
    const totalTransacted = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPending = payments
      .filter(p => ['withdrawal_processing', 'approved'].includes(p.status || ''))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const biggestTransaction = payments.length > 0 
      ? Math.max(...payments.map(p => p.amount || 0)) 
      : 0;
    
    const growthRate = calculateGrowthRate(payments);
    const activityHeatmap = generateHeatmapData(payments);
    
    return {
      totalTransacted,
      totalPaid,
      totalPending,
      biggestTransaction,
      growthRate,
      activityHeatmap
    };
  }, [payments]);

  // Calculando dados para os gráficos
  const chartData = useMemo(() => {
    // Dados para gráfico de barras por mês
    const monthlyData = payments.reduce((acc: MonthlyDataItem[], payment) => {
      if (!payment.createdAt || !payment.amount) return acc;
      
      const date = new Date(payment.createdAt);
      const month = format(date, 'MMM yyyy', { locale: ptBR });
      
      const existingMonth = acc.find(item => item.month === month);
      if (existingMonth) {
        existingMonth.amount += payment.amount;
      } else {
        acc.push({ month, amount: payment.amount });
      }
      
      return acc;
    }, []).slice(-6); // Últimos 6 meses
    
    // Dados para gráfico de pizza por status
    const statusData = payments.reduce((acc: StatusDataItem[], payment) => {
      if (!payment.status) return acc;
      
      const existingStatus = acc.find(item => item.status === payment.status);
      if (existingStatus) {
        existingStatus.count += 1;
        existingStatus.amount += payment.amount || 0;
      } else {
        acc.push({ 
          status: payment.status, 
          count: 1,
          amount: payment.amount || 0
        });
      }
      
      return acc;
    }, []);

    return {
      monthlyData,
      statusData
    };
  }, [payments]);

  if (loading) return <Loading />;
  if (error) return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/users')} 
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Usuários
        </Button>
      </div>
      <div className="p-4 text-red-500">{error}</div>
    </div>
  );
  
  if (!user) return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/users')} 
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Usuários
        </Button>
      </div>
      <div className="p-4">Usuário não encontrado</div>
    </div>
  );

  // Desestruturar os dados para facilitar o uso
  const { totalTransacted, totalPaid, totalPending, biggestTransaction, activityHeatmap } = paymentStats;
  const { monthlyData, statusData } = chartData;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/users')} 
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Usuários
        </Button>
        <h1 className="text-2xl font-bold ml-4">Detalhes do Usuário</h1>
      </div>
      
      {/* Informações do usuário */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UserBasicInfo user={user} onUserUpdate={handleUserUpdate} />
          <UserWallets user={user} />
        </div>
      </div>

      {/* Atividade do usuário */}
      <UserActivity user={user} payments={payments} userActivityData={userActivityData} />

      {/* Cards de estatísticas */}
      <UserFinancialSummary 
        totalTransacted={totalTransacted}
        totalPaid={totalPaid}
        totalPending={totalPending}
        biggestTransaction={biggestTransaction}
      />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Histórico de Transações</h2>
          <UserTransactionsChart monthlyData={monthlyData} />
        </div>
        
        <div className="bg-card rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Distribuição por Status</h2>
          <UserStatusDistributionChart statusData={statusData} />
        </div>
      </div>

      {/* Mapa de calor */}
      <UserActivityHeatmap activityHeatmap={activityHeatmap} />
    </div>
  );
}