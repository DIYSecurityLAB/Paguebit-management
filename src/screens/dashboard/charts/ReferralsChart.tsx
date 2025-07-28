import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Modal from '../../../components/Modal';
import { ArrowUpRight } from 'lucide-react';

import { User } from '../../../domain/entities/User.entity';

interface Props {
  users: User[];
  loading?: boolean;
  height?: number;
  limit?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Mapeamento de nomes similares para um nome padronizado
const NAME_MAPPINGS: Record<string, string> = {
  'elidio': 'elidio',
  'elídio': 'elidio',
  'ilidio': 'elidio',
  'elidiosegundo': 'elidio',
  'elídio segundo': 'elidio',
  'elidio segundo': 'elidio',
  'elidio blindado': 'elidio',
  'elídio blindado': 'elidio',
  'elidio (cupom blindado)': 'elidio',
  'elidio (blindado)': 'elidio',
  'blindado': 'elidio',
  'blindado10': 'elidio',
  'vinicius brito': 'vinicius brito',
  'vinicius silva brito': 'vinicius brito',
};

// Função para normalizar nomes de referência
function normalizeReferralName(referral: string): string {
  const normalized = referral.toLowerCase().trim();
  if (NAME_MAPPINGS[normalized]) {
    return NAME_MAPPINGS[normalized];
  }
  return normalized;
}

export default function ReferralsChart({ users, loading, height = 250, limit = 5 }: Props) {
  // HOOKS DEVEM SER SEMPRE CHAMADOS NA MESMA ORDEM!
  // 1. useState
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReferral, setModalReferral] = useState<string | null>(null);
  const [modalReferralIdx, setModalReferralIdx] = useState<number | null>(null);

  // 2. useMemo para processar dados
  const { data, totalSources, usersByReferral } = useMemo(() => {
    // Processar e agrupar os dados de indicação
    const referralCounts: Record<string, number> = {};
    let noReferralCount = 0;

    users.forEach(user => {
      if (user.referral) {
        const normalizedReferral = normalizeReferralName(user.referral);
        if (normalizedReferral) {
          referralCounts[normalizedReferral] = (referralCounts[normalizedReferral] || 0) + 1;
        } else {
          noReferralCount++;
        }
      } else {
        noReferralCount++;
      }
    });

    // Adicionar contagem sem indicação
    referralCounts['sem_indicacao'] = noReferralCount;

    // Converter para array e ordenar (sem limite quando expandido)
    const dataArr = Object.entries(referralCounts)
      .map(([source, count]) => ({
        name: source === 'sem_indicacao' ? 'Sem Indicação' : source,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, expanded ? undefined : limit);

    const totalSources = Object.keys(referralCounts).length;

    // Mapear usuários por indicação
    const usersByReferral: Record<string, User[]> = {};
    users.forEach(user => {
      const ref = user.referral ? normalizeReferralName(user.referral) : 'sem_indicacao';
      if (!usersByReferral[ref]) usersByReferral[ref] = [];
      usersByReferral[ref].push(user);
    });

    return { data: dataArr, totalSources, usersByReferral };
  }, [users, expanded, limit]);

  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;

  if (!users?.length) return (
    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
      Sem dados disponíveis
    </div>
  );

  // Handler para abrir modal e setar índice
  const handleBarClick = (_: any, idx: number) => {
    const ref = data[idx].name === 'Sem Indicação' ? 'sem_indicacao' : data[idx].name;
    setModalReferral(ref);
    setModalReferralIdx(idx);
    setModalOpen(true);
  };

  // Navegação no modal
  const handleModalNav = (direction: -1 | 1) => {
    if (modalReferralIdx == null) return;
    const newIdx = modalReferralIdx + direction;
    if (newIdx < 0 || newIdx >= data.length) return;
    const ref = data[newIdx].name === 'Sem Indicação' ? 'sem_indicacao' : data[newIdx].name;
    setModalReferral(ref);
    setModalReferralIdx(newIdx);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
        <div className="text-xs text-muted-foreground text-center sm:text-left">
          Mostrando {data.length} de {totalSources} fontes
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground hover:bg-muted/80"
          >
            {expanded ? 'Mostrar menos' : 'Ver todas'}
          </button>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
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
              label={{ 
                value: 'Número de Usuários', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip 
              contentStyle={{ background: '#18181b', color: '#fff', border: 'none' }}
              formatter={(value) => [
                <span style={{ color: '#00C49F' }}>{`${value} usuários`}</span>, 
                'Quantidade'
              ]}
              labelStyle={{ color: '#fff' }}
            />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]}
              maxBarSize={35}
              onClick={handleBarClick}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* MODAL DE USUÁRIOS POR INDICAÇÃO */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            {/* Setas de navegação */}
            <button
              className="p-1 rounded hover:bg-muted transition disabled:opacity-30"
              disabled={modalReferralIdx === 0}
              onClick={() => handleModalNav(-1)}
              aria-label="Anterior"
              type="button"
            >
              <span style={{fontSize: 20, display: 'inline-block'}}>&larr;</span>
            </button>
            <span>
              {modalReferral === 'sem_indicacao'
                ? 'Usuários sem indicação'
                : `vindos de "${modalReferral}"`}
            </span>
            <button
              className="p-1 rounded hover:bg-muted transition disabled:opacity-30"
              disabled={modalReferralIdx == null || modalReferralIdx === data.length - 1}
              onClick={() => handleModalNav(1)}
              aria-label="Próximo"
              type="button"
            >
              <span style={{fontSize: 20, display: 'inline-block'}}>&rarr;</span>
            </button>
          </div>
        }
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {modalReferral && usersByReferral[modalReferral] && usersByReferral[modalReferral].length > 0 ? (
            <ul className="divide-y divide-border">
              {usersByReferral[modalReferral].map(u => (
                <li
                  key={u.id}
                  className="py-2 flex flex-col cursor-pointer rounded transition group"
                  onClick={() => {
                    setModalOpen(false);
                    window.location.href = `/users/${u.id}`;
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
          ) : (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
