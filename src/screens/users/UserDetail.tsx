import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusSquare, TrendingUp, PiggyBank, AlertTriangle, TrendingDown, Copy } from 'lucide-react';
import { format, differenceInDays, differenceInMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter
} from 'recharts';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Table from '../../components/Table';
import Card from '../../components/Card';
import { User, Payment, PaymentStatus } from '../../models/types';
import userRepository from '../../repository/user-repository';
import paymentRepository from '../../repository/payment-repository';
import { formatCurrency } from '../../utils/format';
import PaymentsModal from '../payments/PaymentsModal';
import { toast } from 'sonner';

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

interface HeatmapDataItem {
  day: number;
  hour: number;
  value: number;
}

// Interface para props do shape no Scatter
interface CustomShapeProps {
  cx?: number;
  cy?: number;
  value?: number;
  [key: string]: any;
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

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

  // Dados de volume por tipo de moeda (simulado)
  const currencyData = useMemo(() => {
    const { totalTransacted } = paymentStats;
    
    // Em um caso real, isso seria calculado a partir dos dados reais
    return [
      { currency: 'Bitcoin', amount: totalTransacted * 0.4 },
      { currency: 'Lightning', amount: totalTransacted * 0.3 },
      { currency: 'Liquid', amount: totalTransacted * 0.15 },
      { currency: 'Tron', amount: totalTransacted * 0.1 },
      { currency: 'Polygon', amount: totalTransacted * 0.05 }
    ];
  }, [paymentStats]);

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

  // Valor fixo para simulação
  const userPercentile = 78; // Em um caso real, isso viria da API
  
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
  const { totalTransacted, totalPaid, totalPending, biggestTransaction, growthRate, activityHeatmap } = paymentStats;
  const { monthlyData, statusData } = chartData;
  
  // Cores para o gráfico de pizza
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Funções de formatação para os gráficos
  const formatCurrencyValue = (value: number): string => {
    return formatCurrency(value);
  };
  
  const formatAxisTick = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };
  
  // Função para renderizar o rótulo do gráfico de pizza
  const renderPieLabel = (entry: { status: string }): string => {
    return entry.status;
  };

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
          <div>
            <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <p className="text-foreground">{`${user.firstName} ${user.lastName}`}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="text-foreground">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Documento</label>
                <p className="text-foreground">{`${user.documentType}: ${user.documentId}`}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Telefone</label>
                <p className="text-foreground">{user.phoneNumber}</p>
              </div>
              {/* NOVO: Indicação */}
              <div>
                <label className="text-sm text-muted-foreground">Indicação</label>
                <p className="text-foreground">{user.referral || <span className="text-muted-foreground">Não informado</span>}</p>
              </div>
              {/* NOVO: Data de criação */}
              <div>
                <label className="text-sm text-muted-foreground">Criado em</label>
                <p className="text-foreground">
                  {user.createdAt
                    ? format(new Date(user.createdAt), 'dd/MM/yyyy HH:mm')
                    : <span className="text-muted-foreground">Não informado</span>
                  }
                </p>
              </div>
              {/* NOVO: Role */}
              <div>
                <label className="text-sm text-muted-foreground">Tipo de Usuário</label>
                <p className="text-foreground">{user.role}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Carteiras</h2>
            <div className="space-y-4">
              {Object.entries(user.wallets).map(([type, address]) => (
                address && (
                  <div key={type}>
                    <label className="text-sm text-muted-foreground">{type}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-foreground break-all flex-1">{address}</p>
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
        </div>
      </div>

      {/* Atividade do usuário */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Atividade do Usuário</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Substituindo propriedades que não existem com simulação ou dados alternativos */}
            <div className="p-4 border rounded-md">
              <span className="text-sm text-muted-foreground">Cliente desde</span>
              <p className="text-lg font-semibold">
                {user.createdAt ? 
                  format(new Date(user.createdAt), 'dd/MM/yyyy') : 
                  'Não disponível'}
              </p>
            </div>
            <div className="p-4 border rounded-md">
              <span className="text-sm text-muted-foreground">Última transação</span>
              <p className="text-lg font-semibold">
                {payments.length > 0 && payments[0].createdAt ? 
                  format(new Date(payments[0].createdAt), 'dd/MM/yyyy HH:mm') : 
                  'Não disponível'}
              </p>
            </div>
            <div className="p-4 border rounded-md">
              <span className="text-sm text-muted-foreground">Total de transações</span>
              <p className="text-lg font-semibold">{payments.length}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium mb-2">Frequência de transações</h3>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas - Movido para antes dos gráficos */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-md">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Movimentado</p>
                <h3 className="text-xl font-bold">{formatCurrency(totalTransacted)}</h3>
                <p className="text-xs text-muted-foreground">Valor total de todas as transações</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-md">
                <PlusSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <h3 className="text-xl font-bold">{formatCurrency(totalPaid)}</h3>
                <p className="text-xs text-muted-foreground">Transações com status "pago"</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-md">
                <PiggyBank className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Retido</p>
                <h3 className="text-xl font-bold">{formatCurrency(totalPending)}</h3>
                <p className="text-xs text-muted-foreground">Transações em processamento</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-md">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maior Transação</p>
                <h3 className="text-xl font-bold">{formatCurrency(biggestTransaction)}</h3>
                <p className="text-xs text-muted-foreground">Valor da maior transação</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Histórico de Transações</h2>
          <div className="h-64">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={formatAxisTick}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrencyValue(value)}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Valor" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Sem dados para exibir</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Distribuição por Status</h2>
          <div className="h-64">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="amount"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={renderPieLabel}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrencyValue(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Sem dados para exibir</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mapa de calor com explicação melhorada */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Mapa de Calor de Atividade</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Este gráfico mostra os horários e dias da semana em que o usuário realiza mais transações. 
          Cada círculo representa o volume de atividade, onde círculos maiores indicam mais transações 
          naquele dia e horário específicos. Isso ajuda a identificar padrões e preferências de uso da plataforma.
        </p>
        
        <div className="h-64">
          {activityHeatmap.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 10, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  name="Hora" 
                  type="number" 
                  domain={[0, 23]} 
                  tickCount={12} 
                  label={{ value: 'Hora do dia', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="day" 
                  name="Dia" 
                  type="number" 
                  domain={[0, 6]} 
                  tickFormatter={(value) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][value]}
                  label={{ value: 'Dia da semana', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: any, name: string) => [
                    name === 'Valor' ? 
                      `${value} transações` : 
                      (name === 'Hora' ? `${value}:00` : ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][value])
                  ]}
                />
                <Scatter 
                  name="Atividade" 
                  data={activityHeatmap} 
                  fill="#8884d8" 
                  shape={(props: CustomShapeProps) => {
                    const { cx = 0, cy = 0, value = 0 } = props;
                    const size = Math.min(Math.max(value * 2, 5), 20);
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={size} 
                        fill="#8884d8" 
                        opacity={0.5 + value * 0.05}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Sem dados para exibir</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Funções auxiliares para novos componentes
const calculateGrowthRate = (payments: Payment[]): number => {
  if (payments.length === 0) return 0;
  const now = new Date();
  const threeMonthsAgo = subMonths(now, 3);
  const sixMonthsAgo = subMonths(now, 6);
  
  const recentPayments = payments.filter(p => 
    p.createdAt && new Date(p.createdAt) >= threeMonthsAgo
  );
  const olderPayments = payments.filter(p => 
    p.createdAt && new Date(p.createdAt) >= sixMonthsAgo && new Date(p.createdAt) < threeMonthsAgo
  );
  
  const recentSum = recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const olderSum = olderPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  if (olderSum === 0) return recentSum > 0 ? 100 : 0;
  return ((recentSum - olderSum) / olderSum) * 100;
};

const generateHeatmapData = (payments: Payment[]): HeatmapDataItem[] => {
  const heatmap: HeatmapDataItem[] = [];
  if (payments.length === 0) return heatmap;
  
  // Inicializar matriz de contagem
  const activityCount = Array(7).fill(0).map(() => Array(24).fill(0));
  
  // Preencher contagem de atividades
  payments.forEach(payment => {
    if (payment.createdAt) {
      const date = new Date(payment.createdAt);
      const day = date.getDay(); // 0-6, Domingo-Sábado
      const hour = date.getHours(); // 0-23
      activityCount[day][hour]++;
    }
  });
  
  // Converter para formato de dados do gráfico
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      if (activityCount[day][hour] > 0) {
        heatmap.push({
          day,
          hour,
          value: activityCount[day][hour]
        });
      }
    }
  };
  
  return heatmap;
};