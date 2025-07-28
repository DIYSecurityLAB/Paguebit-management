import React from 'react';
import { DollarSign, Wallet, BarChart2, Users, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendValue 
}) => {
  return (
    <div className="bg-card rounded-lg shadow-md p-5 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-primary/10 rounded text-primary">
          {icon}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold">{value}</span>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {trend && (
        <div className={`mt-2 flex items-center text-xs ${
          trend === 'up' ? 'text-green-500' : 
          trend === 'down' ? 'text-red-500' : 
          'text-gray-500'
        }`}>
          {trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-1" />}
          {trend === 'down' && <ArrowDownLeft className="h-3 w-3 mr-1" />}
          {trendValue}
        </div>
      )}
    </div>
  );
};

interface MetricCardsProps {
  totalReceived: number;
  totalWithdrawn: number;
  currentBalance: number;
  totalPayments: number;
  totalWithdrawals: number;
  totalUsers: number;
}

const MetricCards: React.FC<MetricCardsProps> = ({
  totalReceived,
  totalWithdrawn,
  currentBalance,
  totalPayments,
  totalWithdrawals,
  totalUsers
}) => {
  // Formatador de moeda
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Corrige saldo negativo: saldo nunca deve ser menor que zero (opcional, depende da regra de negócio)
  // Se quiser mostrar o saldo real, remova a linha abaixo.
  // const safeBalance = Math.max(currentBalance, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <MetricCard 
        title="Total Recebido" 
        value={formatter.format(totalReceived)} 
        icon={<DollarSign className="h-4 w-4" />} 
      />
      
      <MetricCard 
        title="Total Sacado" 
        value={formatter.format(totalWithdrawn)} 
        icon={<Wallet className="h-4 w-4" />} 
      />
      
      <MetricCard 
        title="Saldo Atual" 
        value={formatter.format(currentBalance)} 
        icon={<BarChart2 className="h-4 w-4" />} 
        trend={currentBalance >= 0 ? 'up' : 'down'}
        trendValue={`${currentBalance >= 0 ? 'Positivo' : 'Negativo'}`}
      />
      
      <MetricCard 
        title="Número de Pagamentos" 
        value={totalPayments} 
        icon={<ArrowDownLeft className="h-4 w-4" />} 
      />
      
      <MetricCard 
        title="Número de Saques" 
        value={totalWithdrawals} 
        icon={<ArrowUpRight className="h-4 w-4" />} 
      />
      
      <MetricCard 
        title="Quantidade de Usuários" 
        value={totalUsers} 
        icon={<Users className="h-4 w-4" />} 
      />
    </div>
  );
};

export default MetricCards;
