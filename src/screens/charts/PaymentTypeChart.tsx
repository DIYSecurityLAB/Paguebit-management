import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/format';
import { Payment } from '../../data/models/types';

interface Props {
  payments: Payment[];
  loading?: boolean;
  height?: number;
}

// Separar os tipos em duas dimensões
type MetricType = 'count' | 'amount';
type CategoryType = 'all' | 'retained' | 'paid';

export default function PaymentTypeChart({ payments, loading, height = 450 }: Props) {
  // Usar dois estados separados para permitir combinações
  const [activeMetric, setActiveMetric] = useState<MetricType>('count');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-sm text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  if (!payments?.length) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
      </div>
    );
  }

  // Filtragem baseada na categoria selecionada
  let filteredPayments = payments;
  if (activeCategory === 'retained') {
    filteredPayments = payments.filter(p => ['withdrawal_processing', 'approved'].includes(p.status));
  } else if (activeCategory === 'paid') {
    filteredPayments = payments.filter(p => p.status === 'paid');
  }

  // Processar os dados baseados na filtragem
  const staticPayments = filteredPayments.filter(p => p.transactionType === 'static');
  const dynamicPayments = filteredPayments.filter(p => p.transactionType !== 'static');

  // Processando dados para as diferentes visualizações
  const staticCount = staticPayments.length;
  const dynamicCount = dynamicPayments.length;

  const staticAmount = staticPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const dynamicAmount = dynamicPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Preparar dados para gráficos com base na métrica selecionada
  const chartData = activeMetric === 'count' 
    ? [
        { name: 'QR Estático', value: staticCount, color: '#38bdf8' },  // Azul claro
        { name: 'QR Dinâmico', value: dynamicCount, color: '#818cf8' }  // Roxo
      ]
    : [
        { name: 'QR Estático', value: staticAmount, color: '#38bdf8' },
        { name: 'QR Dinâmico', value: dynamicAmount, color: '#818cf8' }
      ];

  // Calcular totais para exibir porcentagens
  const totalValue = activeMetric === 'count' 
    ? staticCount + dynamicCount
    : staticAmount + dynamicAmount;

  // Formatar valores para exibição
  const formatValue = (value: number) => {
    if (activeMetric === 'amount') {
      return formatCurrency(value);
    }
    return `${value} ${value === 1 ? 'pagamento' : 'pagamentos'}`;
  };

  // Formatar porcentagem para exibição
  const formatPercent = (value: number) => {
    if (totalValue === 0) return '0%';
    return `${Math.round((value / totalValue) * 100)}%`;
  };

  // Adicionar um tamanho fixo para o contêiner pai
  const containerStyle = {
    minHeight: '420px', // altura mínima razoável para caber tudo
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'visible'
  };

  // Obter o título da categoria atual
  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'all': return 'Todos';
      case 'retained': return 'Retidos';
      case 'paid': return 'Pagos';
    }
  };

  // Obter o título da métrica atual
  const getMetricTitle = () => {
    return activeMetric === 'count' ? 'Quantidade' : 'Valor';
  };

  return (
    <div style={containerStyle}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        {/* Filtros de métrica */}
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => setActiveMetric('count')}
            className={`px-2 py-1 text-xs rounded ${
              activeMetric === 'count' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Quantidade
          </button>
          <button
            onClick={() => setActiveMetric('amount')}
            className={`px-2 py-1 text-xs rounded ${
              activeMetric === 'amount' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Valor
          </button>
        </div>
        {/* Filtros de categoria */}
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2 py-1 text-xs rounded ${
              activeCategory === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveCategory('retained')}
            className={`px-2 py-1 text-xs rounded ${
              activeCategory === 'retained' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Retidos
          </button>
          <button
            onClick={() => setActiveCategory('paid')}
            className={`px-2 py-1 text-xs rounded ${
              activeCategory === 'paid' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Pagos
          </button>
        </div>
      </div>

      {/* Título combinado */}
      <div className="text-center mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {getMetricTitle()} de pagamentos {getCategoryTitle().toLowerCase()}
        </h3>
      </div>

      {/* Gráfico aumentado + estatísticas juntos */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 items-center justify-center">
        {/* Gráfico com altura fixa e largura 100% */}
        <div style={{ height: 350, width: '100%', maxWidth: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius="70%"
                innerRadius="40%"
                paddingAngle={3}
                dataKey="value"
                label={({ name, value, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }}
                formatter={(value) => [
                  <span className="text-white">{formatValue(value as number)}</span>, 
                  'Valor'
                ]}
                labelStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Estatísticas lado a lado, dentro do container do gráfico */}
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:min-w-[220px]">
          {chartData.map((item, index) => (
            <div 
              key={index} 
              className={`flex flex-col items-center p-3 rounded-md shadow-sm ${
                index % 2 === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20'
              }`}
            >
              <span className="text-sm text-muted-foreground">{item.name}</span>
              <span className="font-semibold text-base">{formatValue(item.value)}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {formatPercent(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
