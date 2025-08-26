import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '../../../utils/format';

import { Payment } from '../../../domain/entities/Payment.entity';

interface Props {
  payments: Payment[];
  loading?: boolean;
  height?: number;
}

type CategoryType = 'all' | 'retained' | 'paid';
type PeriodType = 'day' | 'week' | 'month';

export default function PaymentsMonthlyChart({ payments, loading, height = 250 }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [period, setPeriod] = useState<PeriodType>('week');

  // Filtragem baseada na categoria selecionada
  let filteredPayments = payments;
  if (activeCategory === 'retained') {
    filteredPayments = payments.filter(p => ['withdrawal_processing', 'approved'].includes(p.status));
  } else if (activeCategory === 'paid') {
    filteredPayments = payments.filter(p => p.status === 'paid');
  }

  const data = useMemo(() => {
    const buckets: Record<string, { ts: number; amount: number; label: string }> = {};

    const getISOWeekInfo = (date: Date) => {
      // Normaliza para UTC para cálculo ISO consistente
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7; // 1..7 (seg=1)
      d.setUTCDate(d.getUTCDate() + 4 - dayNum); // quinta-feira da semana ISO
      const isoYear = d.getUTCFullYear();
      const yearStart = new Date(Date.UTC(isoYear, 0, 1));
      const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      // início (segunda) da semana ISO em horário local (meia-noite)
      const weekStartUTC = new Date(d);
      weekStartUTC.setUTCDate(d.getUTCDate() - 3);
      const weekStart = new Date(weekStartUTC.getUTCFullYear(), weekStartUTC.getUTCMonth(), weekStartUTC.getUTCDate());
      return { isoYear, weekNum, weekStart };
    };

    filteredPayments.forEach(p => {
      if (!p.createdAt) return;
      const date = new Date(p.createdAt);

      let ts = 0;
      let label = '';

      if (period === 'day') {
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        ts = dayStart.getTime();
        label = dayStart.toLocaleDateString('pt-BR');
      } else if (period === 'week') {
        const { isoYear, weekNum, weekStart } = getISOWeekInfo(date);
        ts = weekStart.getTime();
        label = `S${String(weekNum).padStart(2, '0')}/${isoYear}`;
      } else {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        ts = monthStart.getTime();
        label = monthStart.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      }

      const key = String(ts);
      if (!buckets[key]) buckets[key] = { ts, amount: 0, label };
      buckets[key].amount += p.amount || 0;
    });

    return Object.values(buckets)
      .sort((a, b) => a.ts - b.ts)
      .map(({ ts, amount, label }) => ({
        periodKey: String(ts),
        label,
        amount
      }));
  }, [filteredPayments, period]);

  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;

  // Obter o título da categoria atual
  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'all': return 'Todos';
      case 'retained': return 'Retidos';
      case 'paid': return 'Pagos';
    }
  };

  // Obter o título do período atual
  const getPeriodTitle = () => {
    switch (period) {
      case 'day': return 'por dia';
      case 'week': return 'por semana';
      case 'month': return 'por mês';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
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
        <span className="text-xs text-muted-foreground hidden sm:inline-block">{getCategoryTitle()} {getPeriodTitle()}</span>
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
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              fontSize={11}
              tickFormatter={(value) => formatCurrency(value, { compact: true })}
            />
            <Tooltip 
              contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }} 
              formatter={(value) => [
                <span style={{ color: '#00C49F' }}>{formatCurrency(value as number)}</span>, 
                'Valor'
              ]}
              labelStyle={{ color: '#fff' }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="#00C49F" 
              fill="#00C49F" 
              fillOpacity={0.2} 
              strokeWidth={2}
              name="Valor"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
  