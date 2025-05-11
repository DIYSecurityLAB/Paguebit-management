import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface UserData {
  userId: string;
  name: string;
  amount?: number;
  count?: number;
}

interface Props {
  data: UserData[];
  loading?: boolean;
  dataKey: 'amount' | 'count';
  valueFormatter?: (value: number) => string;
  height?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TopUsersChart({ data, loading, dataKey, valueFormatter, height = 250 }: Props) {
  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;
  
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
      Sem dados disponíveis
    </div>
  );

  // Formatar o valor para exibição no Tooltip
  const formatTooltipValue = (value: number) => {
    if (valueFormatter) return valueFormatter(value);
    return dataKey === 'count' ? `${value} transações` : `${value}`;
  };

  // Determinar o título para o Tooltip com base no dataKey
  const tooltipTitle = dataKey === 'count' ? 'Transações' : 'Valor';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis 
          type="number" 
          axisLine={false} 
          tickLine={false} 
          fontSize={11}
          tickFormatter={value => 
            valueFormatter ? valueFormatter(value) : value.toString()
          }
        />
        <YAxis 
          dataKey="name" 
          type="category" 
          axisLine={false} 
          tickLine={false} 
          width={80}
          fontSize={11}
          tickFormatter={value => 
            value.length > 12 ? `${value.substring(0, 10)}...` : value
          }
        />
        <Tooltip 
          contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }}
          formatter={(value) => [
            <span style={{ color: '#00C49F' }}>{formatTooltipValue(value as number)}</span>, 
            tooltipTitle
          ]}
          labelStyle={{ color: '#fff' }}
        />
        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
