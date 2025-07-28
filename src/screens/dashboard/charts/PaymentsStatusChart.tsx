import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip,  ResponsiveContainer, Sector } from 'recharts';
import { formatCurrency } from '../../../utils/format';

// Não precisa de import de Payment, pois só recebe o objeto já processado
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
 

// Tipos para dados do gráfico


  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
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
      </div>
      {/* Gráfico em cima, legenda/descrição embaixo no mobile e desktop */}
      <div className="flex flex-col flex-1 gap-4 items-center">
        <div className="flex-1 min-w-0 flex flex-col items-center w-full">
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
                onClick={(_, idx) => setActiveIndex(idx)}
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
            </PieChart>
          </ResponsiveContainer>
          {/* Legenda/descrição abaixo do gráfico, responsiva e funcional */}
          <div className="w-full mt-4">
            <div className="flex flex-wrap justify-center gap-2">
              {data.map((entry, idx) => (
                <div
                  key={entry.status}
                  className={`flex items-center gap-1 text-xs cursor-pointer ${activeIndex === idx ? 'font-semibold' : ''}`}
                  onClick={() => setActiveIndex(activeIndex === idx ? undefined : idx)}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span>{entry.statusLabel}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({activeMetric === 'count' ? entry.count : formatCurrency(entry.amount)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
