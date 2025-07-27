import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { User } from '../../data/models/types';

interface Props {
  users: User[];
  loading?: boolean;
  height?: number;
}

type PeriodType = 'day' | 'week' | 'month';
type MetricType = 'total' | 'new';

export default function UsersGrowthChart({ users, loading, height = 250 }: Props) {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [metric, setMetric] = useState<MetricType>('total');

  // Agrupa usuários por período usando createdAt real
  const data = useMemo(() => {
    if (!users || users.length === 0) return [];

    const byPeriod: Record<string, number> = {};
    users.forEach(u => {
      if (!u.createdAt) return;
      const date = new Date(u.createdAt);
      let key = '';
      if (period === 'day') {
        key = date.toLocaleDateString('pt-BR');
      } else if (period === 'week') {
        const year = date.getFullYear();
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        key = `${year}-S${weekNum.toString().padStart(2, '0')}`;
      } else {
        key = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      }
      byPeriod[key] = (byPeriod[key] || 0) + 1;
    });

    // Ordenar por data
    const parseKey = (key: string) => {
      if (period === 'day') {
        const [d, m, y] = key.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
      }
      if (period === 'week') {
        const [year, weekStr] = key.split('-S');
        const week = Number(weekStr);
        const simple = new Date(Number(year), 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4)
          ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
          ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        return ISOweekStart.getTime();
      }
      // mês
      const [month, year] = key.split(' ');
      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const m = months.indexOf(month.toLowerCase());
      return new Date(Number(year), m, 1).getTime();
    };

    const sorted = Object.entries(byPeriod)
      .map(([periodKey, count]) => ({
        periodKey,
        label: period === 'week' && periodKey.includes('-S')
          ? `S${periodKey.split('-S')[1]}/${periodKey.split('-S')[0]}`
          : periodKey,
        count
      }))
      .sort((a, b) => parseKey(a.periodKey) - parseKey(b.periodKey));

    if (metric === 'total') {
      let acc = 0;
      return sorted.map(item => ({
        ...item,
        value: (acc += item.count)
      }));
    } else {
      return sorted.map(item => ({
        ...item,
        value: item.count
      }));
    }
  }, [users, period, metric]);

  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  const getPeriodTitle = () => {
    switch (period) {
      case 'day': return 'por dia';
      case 'week': return 'por semana';
      case 'month': return 'por mês';
    }
  };

  const getMetricTitle = () => {
    return metric === 'total' ? 'Total acumulado' : 'Novos';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        {/* Filtros de métrica */}
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => setMetric('total')}
            className={`px-2 py-1 text-xs rounded ${
              metric === 'total'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Total acumulado
          </button>
          <button
            onClick={() => setMetric('new')}
            className={`px-2 py-1 text-xs rounded ${
              metric === 'new'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Novos
          </button>
        </div>
        {/* Filtros de período */}
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => setPeriod('day')}
            className={`px-2 py-1 text-xs rounded ${
              period === 'day'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Dia
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-2 py-1 text-xs rounded ${
              period === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-2 py-1 text-xs rounded ${
              period === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Mês
          </button>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline-block">{getMetricTitle()} {getPeriodTitle()}</span>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              fontSize={11}
              interval={period === 'day' ? 4 : 0}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              fontSize={11}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }} 
              formatter={(value) => [
                <span style={{ color: '#00C49F' }}>{`${value} usuários`}</span>, 
                metric === 'total' ? 'Total acumulado' : 'Novos usuários'
              ]}
              labelStyle={{ color: '#fff' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.2} 
              strokeWidth={2}
              name={metric === 'total' ? 'Total acumulado' : 'Novos usuários'}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
