import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { formatCurrency } from '../../utils/format';

interface Props {
  paymentsByStatus: Record<string, { count: number; amount: number }>;
  loading?: boolean;
  height?: number;
}

// Mapeamento de status em inglês para português
const STATUS_LABELS: Record<string, string> = {
  'pending': 'Pendente',
  'receipt_sent': 'Comprovante Enviado',
  'under_review': 'Em Análise',
  'approved': 'Aprovado',
  'not_approved': 'Não Aprovado',
  'paid': 'Pago',
  'withdrawal_processing': 'Em Processamento',
  'unknown': 'Desconhecido'
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6666', '#66CC99'];

// Componente renderizador de setor ativo (para destacar quando selecionado)
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

export default function PaymentsStatusChart({ paymentsByStatus, loading, height = 250 }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [activeMetric, setActiveMetric] = useState<'amount' | 'count'>('amount');

  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;
  
  const data = Object.entries(paymentsByStatus).map(([status, { amount, count }]) => ({
    status,
    statusLabel: STATUS_LABELS[status] || status,
    amount,
    count
  }));

  // Determinar o título com base na métrica ativa
  const metricTitle = activeMetric === 'amount' ? 'Valor' : 'Quantidade';

  // Função para manipular o clique na legenda
  const handleLegendClick = (data: any, index: number) => {
    setActiveIndex(activeIndex === index ? undefined : index);
  };

  // Renderizador personalizado para a legenda
  const renderCustomizedLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="pl-0 flex flex-col gap-1 text-xs">
        {payload.map((entry: any, index: number) => (
          <li 
            key={`item-${index}`}
            className={`flex items-center cursor-pointer hover:opacity-80 transition-opacity ${activeIndex === index ? 'font-semibold' : ''}`}
            onClick={() => handleLegendClick(entry, index)}
          >
            <div 
              className="h-3 w-3 mr-2 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
            {activeIndex === index && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({paymentsByStatus[data[index].status].count})
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1.5">
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
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              dataKey={activeMetric}
              nameKey="statusLabel"
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              innerRadius={height / 6}
              paddingAngle={2}
            >
              {data.map((entry, idx) => (
                <Cell key={entry.status} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => {
                if (activeMetric === 'amount') {
                  return [
                    <div className="text-white">
                      {formatCurrency(value as number)} <span className="text-xs text-gray-300">({props.payload.count} transações)</span>
                    </div>,
                    name
                  ];
                }
                return [
                  <div className="text-white">
                    {value} transações <span className="text-xs text-gray-300">({formatCurrency(props.payload.amount)})</span>
                  </div>,
                  name
                ];
              }}
              contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right" 
              content={renderCustomizedLegend}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
