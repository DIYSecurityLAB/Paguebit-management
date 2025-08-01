import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../../utils/format';

import { Payment } from '../../../domain/entities/Payment.entity';

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

  // LOGS DE DEPURAÇÃO
  console.log('🔍 === DEBUG PaymentTypeChart ===');
  console.log('Total de payments recebidos:', payments.length);
  console.log('Categoria ativa:', activeCategory);
  console.log('Métrica ativa:', activeMetric);
  
  const staticAll = payments.filter(p => p.transactionType === 'static');
  const dynamicAll = payments.filter(p => p.transactionType === 'dynamic');
  const emptyTypeAll = payments.filter(p => p.transactionType === '');
  const otherTypeAll = payments.filter(
    p => p.transactionType !== 'static' && p.transactionType !== 'dynamic' && p.transactionType !== ''
  );
  
  console.log('📊 Distribuição ANTES dos filtros de categoria:');
  console.log('  Pagamentos static (todos):', staticAll.length);
  console.log('  Pagamentos dynamic (todos):', dynamicAll.length);
  console.log('  Pagamentos sem tipo:', emptyTypeAll.length);
  console.log('  Pagamentos com outro tipo:', otherTypeAll.length, otherTypeAll.map(p => p.transactionType));

  // Análise dos status dos pagamentos
  const statusCounts = payments.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('📈 Status dos pagamentos:', statusCounts);

  // Filtragem baseada na categoria selecionada
  let filteredPayments = payments;
  if (activeCategory === 'retained') {
    filteredPayments = payments.filter(p => ['withdrawal_processing', 'approved'].includes(p.status));
    console.log('🔄 Filtrando para RETIDOS (withdrawal_processing + approved)');
  } else if (activeCategory === 'paid') {
    filteredPayments = payments.filter(p => p.status === 'paid');
    console.log('💰 Filtrando para PAGOS (paid)');
  } else {
    console.log('🌟 Usando TODOS os pagamentos');
  }
  console.log('Após filtro de categoria:', filteredPayments.length);

  // Filtrar apenas pagamentos com tipo válido
  // Corrigido: não compare tipos incompatíveis, só filtre explicitamente pelos dois tipos válidos
  const validPayments = filteredPayments.filter(
    p => p.transactionType === 'static' || p.transactionType === 'dynamic'
  );
  console.log('✅ Pagamentos válidos para gráfico:', validPayments.length);

  // Contar e somar por tipo
  const staticPayments = validPayments.filter(p => p.transactionType === 'static');
  const dynamicPayments = validPayments.filter(p => p.transactionType === 'dynamic');
  
  console.log('📊 Distribuição FINAL após todos os filtros:');
  console.log('  Pagamentos static (finais):', staticPayments.length);
  console.log('  Pagamentos dynamic (finais):', dynamicPayments.length);
  
  // Debug dos primeiros pagamentos para entender os dados
  if (staticPayments.length > 0) {
    console.log('🔍 Exemplo de pagamento static:', {
      id: staticPayments[0].id,
      status: staticPayments[0].status,
      amount: staticPayments[0].amount,
      transactionType: staticPayments[0].transactionType
    });
  }
  if (dynamicPayments.length > 0) {
    console.log('🔍 Exemplo de pagamento dynamic:', {
      id: dynamicPayments[0].id,
      status: dynamicPayments[0].status,
      amount: dynamicPayments[0].amount,
      transactionType: dynamicPayments[0].transactionType
    });
  }

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
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
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