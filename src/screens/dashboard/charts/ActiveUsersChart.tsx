import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import { Payment } from '../../../domain/entities/Payment.entity';
import { User } from '../../../domain/entities/User.entity';
import { Store } from '../../../domain/entities/Store.entity';

// Ajustar Props para receber stores
interface Props {
  stores: Store[];
  payments: Payment[];
  loading?: boolean;
  height?: number;
}

type PeriodType = 'day' | 'week' | 'month';

// Chave do período como timestamp do início do período
function getPeriodKey(date: Date, period: PeriodType): number {
  if (period === 'day') {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dayStart.getTime();
  }
  if (period === 'week') {
    // Início da semana ISO (segunda)
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() - 3);
    // Normalize para meia-noite local
    const w = new Date(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate());
    return w.getTime();
  }
  // month
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  return monthStart.getTime();
}

// Parse simplificado: a key agora é um timestamp
function parsePeriodKey(key: string): Date {
  return new Date(Number(key));
}

// Formatar label a partir do timestamp e tipo de período
function formatLabel(period: PeriodType, ts: number) {
  const d = new Date(ts);
  if (period === 'day') {
    return d.toLocaleDateString('pt-BR');
  }
  if (period === 'week') {
    const ref = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = ref.getUTCDay() || 7;
    ref.setUTCDate(ref.getUTCDate() + 4 - dayNum);
    const isoYear = ref.getUTCFullYear();
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    const weekNum = Math.ceil((((ref.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `S${String(weekNum).padStart(2, '0')}/${isoYear}`;
  }
  return d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
}

export default function ActiveUsersChart({ stores, payments, loading, height = 220 }: Props) {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStores, setModalStores] = useState<Store[]>([]);
  const [modalPeriodLabel, setModalPeriodLabel] = useState<string>('');
  const [modalPeriodIdx, setModalPeriodIdx] = useState<number | null>(null);
  const navigate = useNavigate();

  // Filtrar pagamentos relevantes
  const relevantPayments = useMemo(() =>
    payments.filter(p => ['paid', 'approved', 'withdrawal_processing'].includes(p.status)), [payments]
  );

  // Mapear pagamentos por loja e data usando timestamp do início do período
  const storeIdsByPeriod = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    relevantPayments.forEach(p => {
      if (!p.storeId || !p.createdAt) return;
      const date = new Date(p.createdAt);
      const ts = getPeriodKey(date, period);
      const key = String(ts);
      if (!map[key]) map[key] = new Set();
      map[key].add(p.storeId);
    });
    return map;
  }, [relevantPayments, period]);

  // Mapear lojas por período
  const storesByPeriod = useMemo(() => {
    const map: Record<string, Store[]> = {};
    Object.entries(storeIdsByPeriod).forEach(([periodKey, storeIds]) => {
      map[periodKey] = stores.filter(s => storeIds.has(s.id));
    });
    return map;
  }, [storeIdsByPeriod, stores]);

  // Gerar lista de períodos ordenados (asc)
  const periodKeysSorted = useMemo(() => {
    return Object.keys(storeIdsByPeriod).sort((a, b) => Number(a) - Number(b));
  }, [storeIdsByPeriod]);

  // Filtro fixo: últimos 30 dias, 12 semanas ou 12 meses
  const filteredPeriodKeys = useMemo(() => {
    const now = new Date();
    if (period === 'day') {
      // Últimos 30 dias
      return periodKeysSorted.filter(key => {
        const d = parsePeriodKey(key);
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff < 30;
      });
    }
    if (period === 'week') {
      return periodKeysSorted.slice(-12);
    }
    return periodKeysSorted.slice(-12);
  }, [period, periodKeysSorted]);

  // Montar dados para o gráfico
  const data = useMemo(() => {
    const keys = filteredPeriodKeys;
    return keys.map(periodKey => {
      const ts = Number(periodKey);
      return {
        periodKey,
        label: formatLabel(period, ts),
        activeStores: storeIdsByPeriod[periodKey]?.size || 0
      };
    });
  }, [storeIdsByPeriod, period, filteredPeriodKeys]);

  // Calcular lojas ativas no último período
  const lastPeriodActive = data.length > 0 ? data[data.length - 1].activeStores : 0;

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
    setModalStores(storesByPeriod[entry.periodKey] || []);
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
    setModalStores(storesByPeriod[entry.periodKey] || []);
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
          Lojas ativas {getPeriodTitle()} &middot; Último: <b>{lastPeriodActive}</b>
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
                <span style={{ color: '#00C49F' }}>{`${value} lojas`}</span>,
                'Lojas ativas'
              ]}
              labelStyle={{ color: '#fff' }}
            />
            <Bar
              dataKey="activeStores"
              fill="#38bdf8"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              name="Lojas ativas"
            />
          </BarChart>
        </ResponsiveContainer>
        {/* Overlay para clique no bloco inteiro */}
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
              title={`Ver lojas ativas em ${entry.label}`}
            />
          ))}
        </div>
      </div>
      {/* MODAL DE LOJAS ATIVAS */}
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
                  Lojas ativas em <span className="text-primary">{modalPeriodLabel}</span>
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
              {modalStores.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  Nenhuma loja encontrada.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {modalStores.map(s => (
                    <li
                      key={s.id}
                      className="py-2 flex flex-col cursor-pointer rounded transition group"
                      onClick={() => {
                        setModalOpen(false);
                        navigate(`/stores/${s.id}`);
                      }}
                      title="Ver detalhes da loja"
                    >
                      <span className="font-medium text-foreground flex items-center gap-1">
                        {s.name}
                        <ArrowUpRight className="h-4 w-4 text-primary opacity-70 group-hover:opacity-100" />
                      </span>
                      <span className="text-xs text-muted-foreground">{s.id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex justify-between">
              <span>{modalStores.length} loja(s)</span>
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
   