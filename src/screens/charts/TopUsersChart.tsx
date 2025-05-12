import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface UserData {
  userId: string;
  name: string;
  amount: number;
  count: number;
}

interface Props {
  data: UserData[];
  loading?: boolean;
  valueFormatter?: (value: number) => string;
  height?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TopUsersChart({ data, loading, valueFormatter, height = 250 }: Props) {
  const [activeMetric, setActiveMetric] = useState<'amount' | 'count'>('amount');
  const [limit, setLimit] = useState(5);
  
  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;
  
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
      Sem dados disponíveis
    </div>
  );

  // Ordenar dados com base na métrica ativa
  const sortedData = [...data].sort((a, b) => 
    activeMetric === 'amount' ? b.amount - a.amount : b.count - a.count
  ).slice(0, limit);

  const totalUsers = data.length;

  // Formatar o valor para exibição no Tooltip
  const formatTooltipValue = (value: number) => {
    if (activeMetric === 'amount' && valueFormatter) {
      return valueFormatter(value);
    }
    return activeMetric === 'count' ? `${value} transações` : `${value}`;
  };

  // Determinar o título para o Tooltip com base no activeMetric
  const tooltipTitle = activeMetric === 'count' ? 'Transações' : 'Valor';

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1.5">
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
        </div>

        {/* Seletor de limite (direita) */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Mostrando {sortedData.length} de {totalUsers}
          </span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground hover:bg-muted/80 border-0"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={20}>Top 20</option>
            <option value={30}>Top 30</option>
          </select>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={sortedData}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 30, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} />
            <XAxis 
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={70}
              interval={0}
            />
            <YAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              fontSize={11}
              tickFormatter={value => 
                activeMetric === 'amount' && valueFormatter 
                  ? valueFormatter(value) 
                  : value.toString()
              }
              label={{ 
                value: activeMetric === 'amount' ? 'Valor Total' : 'Número de Transações', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip 
              contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }}
              formatter={(value, name, props) => {
                if (activeMetric === 'amount') {
                  return [
                    <div className="text-white">
                      {valueFormatter?.(value as number)} <span className="text-xs text-gray-300">({props.payload.count} transações)</span>
                    </div>,
                    name
                  ];
                }
                return [
                  <div className="text-white">
                    {`${value} transações`} <span className="text-xs text-gray-300">({valueFormatter?.(props.payload.amount)})</span>
                  </div>,
                  name
                ];
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar 
              dataKey={activeMetric}
              radius={[4, 4, 0, 0]}
              maxBarSize={35}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
