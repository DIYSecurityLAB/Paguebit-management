import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Payment } from '../../models/types';
import { formatCurrency } from '../../utils/format';

interface Props {
  payments: Payment[];
  loading?: boolean;
  height?: number;
}

type CategoryType = 'all' | 'retained' | 'paid';
type PeriodType = 'day' | 'week' | 'month';

export default function PaymentsMonthlyChart({ payments, loading, height = 250 }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [period, setPeriod] = useState<PeriodType>('month');

  // Filtragem baseada na categoria selecionada
  let filteredPayments = payments;
  if (activeCategory === 'retained') {
    filteredPayments = payments.filter(p => ['withdrawal_processing', 'approved'].includes(p.status));
  } else if (activeCategory === 'paid') {
    filteredPayments = payments.filter(p => p.status === 'paid');
  }

  const data = useMemo(() => {
    const byPeriod: Record<string, number> = {};
    filteredPayments.forEach(p => {
      if (p.createdAt) {
        const date = new Date(p.createdAt);
        let key = '';
        if (period === 'day') {
          key = date.toLocaleDateString('pt-BR');
        } else if (period === 'week') {
          // Semana ISO: yyyy-Www
          const year = date.getFullYear();
          const firstDayOfYear = new Date(year, 0, 1);
          const pastDaysOfYear = (date.valueOf() - firstDayOfYear.valueOf()) / 86400000;
          // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          key = `${year}-S${week.toString().padStart(2, '0')}`;
        } else {
          key = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
        }
        byPeriod[key] = (byPeriod[key] || 0) + (p.amount || 0);
      }
    });

    // Ordenar por data
    const parseKey = (key: string) => {
      if (period === 'day') {
        // dd/mm/yyyy
        const [d, m, y] = key.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
      }
      if (period === 'week') {
        // yyyy-Sww
        const [year, weekStr] = key.split('-S');
        const week = Number(weekStr);
        // ISO week to date: https://stackoverflow.com/a/16591175
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

    return Object.entries(byPeriod)
      .map(([periodKey, amount]) => ({ periodKey, amount }))
      .sort((a, b) => parseKey(a.periodKey) - parseKey(b.periodKey));
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
      <div className="flex justify-between items-center mb-4">
        {/* Filtros de categoria */}
        <div className="flex gap-1.5">
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
        <div className="flex gap-1.5">
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
        <span className="text-xs text-muted-foreground">{getCategoryTitle()} {getPeriodTitle()}</span>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="periodKey" 
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
