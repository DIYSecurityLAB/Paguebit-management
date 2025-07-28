
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// Não precisa de import de Withdrawal, pois só recebe o objeto já processado
interface Props {
  withdrawalsByStatus: Record<string, number>;
  loading?: boolean;
  height?: number;
}

// Mapeamento de status em inglês para português
const STATUS_LABELS: Record<string, string> = {
  'pending': 'Pendente',
  'processing': 'Em Processamento',
  'completed': 'Concluído',
  'failed': 'Falhou'
};

const COLORS = {
  'pending': '#FFBB28',
  'processing': '#0088FE',
  'completed': '#00C49F',
  'failed': '#FF6666'
};

export default function WithdrawalsStatusChart({ withdrawalsByStatus, loading, height = 250 }: Props) {
  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;
  
  const data = Object.entries(withdrawalsByStatus).map(([status, count]) => ({ 
    status,
    statusLabel: STATUS_LABELS[status] || status,
    count 
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" axisLine={false} tickLine={false} fontSize={11} />
        <YAxis 
          dataKey="statusLabel" 
          type="category" 
          axisLine={false} 
          tickLine={false} 
          fontSize={11} 
          width={100}
        />
        <Tooltip 
          contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }} 
          formatter={(value) => [
            <span style={{ color: '#00C49F' }}>{`${value} saques`}</span>, 
            'Quantidade'
          ]}
          labelStyle={{ color: '#fff' }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={COLORS[entry.status as keyof typeof COLORS] || '#8884d8'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
