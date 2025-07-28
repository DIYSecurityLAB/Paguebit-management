import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import { Payment } from '../../../domain/entities/Payment.entity';
import { User } from '../../../domain/entities/User.entity';

interface Props {
  users: User[];
  payments: Payment[];
  loading?: boolean;
  height?: number;
}

type PeriodType = 'day' | 'week' | 'month';

function getPeriodKey(date: Date, period: PeriodType) {
  if (period === 'day') {
    return date.toLocaleDateString('pt-BR');
  }
  if (period === 'week') {
    const year = date.getFullYear();
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return `${year}-S${weekNum.toString().padStart(2, '0')}`;
  }
  // month
  return date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
}

function parsePeriodKey(key: string, period: PeriodType): Date {
  if (period === 'day') {
    // dd/mm/yyyy
    const [d, m, y] = key.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  if (period === 'week') {
    // yyyy-Sww
    const [year, weekStr] = key.split('-S');
    const week = Number(weekStr);
    // ISO week to date: https://stackoverflow.com/a/16591175
    const simple = new Date(Number(year), 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = new Date(simple);
    if (dow <= 4)
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
  }
  // mês
  const [month, year] = key.split(' ');
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const m = months.indexOf(month.toLowerCase());
  return new Date(Number(year), m, 1);
}

export default function ActiveUsersChart({ users, payments, loading, height = 220 }: Props) {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [modalPeriodLabel, setModalPeriodLabel] = useState<string>('');
  const [modalPeriodIdx, setModalPeriodIdx] = useState<number | null>(null);
  const navigate = useNavigate();

  // Filtrar pagamentos relevantes
  const relevantPayments = useMemo(() =>
    payments.filter(p => ['paid', 'approved', 'withdrawal_processing'].includes(p.status)), [payments]
  );

  // Mapear pagamentos por loja e data, depois cruzar com usuários da loja
  const userPaymentsByPeriod = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    relevantPayments.forEach(p => {
      if (!p.storeId || !p.createdAt) return;
      const date = new Date(p.createdAt);
      const key = getPeriodKey(date, period);
      if (!map[key]) map[key] = new Set();
      // Adiciona todos os usuários da loja correspondente
      const storeUsers = users.filter(u => u.storeId === p.storeId || (u.stores && u.stores.some(s => s.id === p.storeId)));
      storeUsers.forEach(u => map[key].add(u.id));
    });
    return map;
  }, [relevantPayments, period, users]);

  // Mapear usuários por período
  const usersByPeriod = useMemo(() => {
    const map: Record<string, User[]> = {};
    Object.entries(userPaymentsByPeriod).forEach(([periodKey, userIds]) => {
      map[periodKey] = users.filter(u => userIds.has(u.id));
    });
    return map;
  }, [userPaymentsByPeriod, users]);

  // Gerar lista de períodos ordenados
  const periodKeysSorted = useMemo(() => {
    return Object.keys(userPaymentsByPeriod).sort((a, b) => {
      const da = parsePeriodKey(a, period).getTime();
      const db = parsePeriodKey(b, period).getTime();
      return da - db;
    });
  }, [userPaymentsByPeriod, period]);

  // Filtro fixo: últimos 30 dias, 12 semanas ou 12 meses
  const filteredPeriodKeys = useMemo(() => {
    const now = new Date();
    if (period === 'day') {
      // Últimos 30 dias
      return periodKeysSorted.filter(key => {
        const d = parsePeriodKey(key, 'day');
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 30;
      });
    }
    if (period === 'week') {
      // Últimas 12 semanas
      return periodKeysSorted.slice(-12);
    }
    // Últimos 12 meses
    return periodKeysSorted.slice(-12);
  }, [period, periodKeysSorted]);

  // Montar dados para o gráfico
  const data = useMemo(() => {
    const keys = filteredPeriodKeys;
    return keys.map(periodKey => ({
      periodKey,
      label: period === 'week' && periodKey.includes('-S')
        ? `S${periodKey.split('-S')[1]}/${periodKey.split('-S')[0]}`
        : periodKey,
      activeUsers: userPaymentsByPeriod[periodKey]?.size || 0
    }));
  }, [userPaymentsByPeriod, period, filteredPeriodKeys]);

  // Calcular usuários ativos no último período
  const lastPeriodActive = data.length > 0 ? data[data.length - 1].activeUsers : 0;

  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;
  if (data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
      Sem dados para exibir
    </div>
  );

  const getPeriodTitle = () => {
    switch (period) {
      case 'day': return 'por dia';
      case 'week': return 'por semana';
      case 'month': return 'por mês';
    }
  };

  // Handler para abrir modal ao clicar no bloco correto
  const handleBarBlockClick = (entry: any) => {
    const idx = data.findIndex(d => d.periodKey === entry.periodKey);
    setModalUsers(usersByPeriod[entry.periodKey] || []);
    setModalPeriodLabel(entry.label);
    setModalPeriodIdx(idx);
    setModalOpen(true);
  };

  // Navegação no modal
  const handleModalNav = (direction: -1 | 1) => {
    if (modalPeriodIdx == null) return;
    const newIdx = modalPeriodIdx + direction;
    if (newIdx < 0 || newIdx >= data.length) return;
    const entry = data[newIdx];
    setModalUsers(usersByPeriod[entry.periodKey] || []);
    setModalPeriodLabel(entry.label);
    setModalPeriodIdx(newIdx);
  };

  // Cálculo para largura e posição dos overlays de clique (corrigido para hover exato)
  const getBarRects = () => {
    const count = data.length;
    if (count === 0) return [];
    return data.map((entry, idx) => ({
      entry,
      left: `${(idx / count) * 100}%`,
      width: `${(1 / count) * 100}%`
    }));
  };

  // Ajuste de labels para melhor visualização
  let xAxisProps: any = {};
  if (period === 'day') {
    xAxisProps = {
      angle: -35,
      textAnchor: 'end',
      height: 70,
      interval: 0
    };
  } else if (period === 'week') {
    xAxisProps = {
      angle: -30,
      textAnchor: 'end',
      height: 60,
      interval: 0
    };
  } else {
    xAxisProps = {
      angle: -20,
      textAnchor: 'end',
      height: 50,
      interval: 0
    };
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2"
      >
        {/* Filtros centralizados e responsivos */}
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
        {/* Texto da direita só em telas médias para cima */}
        <span className="text-xs text-muted-foreground hidden sm:inline-block">
          Usuários ativos {getPeriodTitle()} &middot; Último: <b>{lastPeriodActive}</b>
        </span>
      </div>
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              fontSize={11}
              {...xAxisProps}
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
                'Usuários ativos'
              ]}
              labelStyle={{ color: '#fff' }}
            />
            <Bar
              dataKey="activeUsers"
              fill="#38bdf8"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              name="Usuários ativos"
            />
          </BarChart>
        </ResponsiveContainer>
        {/* Overlay para clique no bloco inteiro (sem hover visual) */}
        <div className="absolute inset-0 pointer-events-none">
          {data.map((entry, idx) => (
            <div
              key={entry.periodKey}
              style={{
                position: 'absolute',
                left: `${(idx / data.length) * 100}%`,
                width: `${(1 / data.length) * 100}%`,
                top: 0,
                bottom: 0,
                cursor: 'pointer',
                zIndex: 2,
                pointerEvents: 'auto'
              }}
              onClick={() => handleBarBlockClick(entry)}
              title={`Ver usuários ativos em ${entry.label}`}
            />
          ))}
        </div>
      </div>
      {/* MODAL DE USUÁRIOS ATIVOS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              {/* Setas de navegação */}
              <div className="flex items-center gap-2">
                <button
                  className="p-1 rounded hover:bg-muted transition disabled:opacity-30"
                  disabled={modalPeriodIdx === 0}
                  onClick={() => handleModalNav(-1)}
                  aria-label="Anterior"
                  type="button"
                >
                  <span style={{fontSize: 20, display: 'inline-block'}}>&larr;</span>
                </button>
                <h3 className="font-semibold text-base">
                  Usuários ativos em <span className="text-primary">{modalPeriodLabel}</span>
                </h3>
                <button
                  className="p-1 rounded hover:bg-muted transition disabled:opacity-30"
                  disabled={modalPeriodIdx == null || modalPeriodIdx === data.length - 1}
                  onClick={() => handleModalNav(1)}
                  aria-label="Próximo"
                  type="button"
                >
                  <span style={{fontSize: 20, display: 'inline-block'}}>&rarr;</span>
                </button>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground text-xl px-2"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-2 flex-1">
              {modalUsers.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {modalUsers.map(u => (
                    <li
                      key={u.id}
                      className="py-2 flex flex-col cursor-pointer rounded transition group"
                      onClick={() => {
                        setModalOpen(false);
                        navigate(`/users/${u.id}`);
                      }}
                      title="Ver detalhes do usuário"
                    >
                      <span className="font-medium text-foreground flex items-center gap-1">
                        {u.firstName} {u.lastName}
                        <ArrowUpRight className="h-4 w-4 text-primary opacity-70 group-hover:opacity-100" />
                      </span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex justify-between">
              <span>{modalUsers.length} usuário(s)</span>
              <button
                className="text-primary hover:underline"
                onClick={() => setModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
