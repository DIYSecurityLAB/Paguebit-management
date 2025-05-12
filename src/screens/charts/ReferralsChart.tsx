import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { User } from '../../models/types';

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
  // Converter para minúsculo e remover espaços extras
  const normalized = referral.toLowerCase().trim();
  
  // Verificar se existe um mapeamento direto
  if (NAME_MAPPINGS[normalized]) {
    return NAME_MAPPINGS[normalized];
  }

  // Se não houver mapeamento direto, retornar o nome normalizado
  return normalized;
}

export default function ReferralsChart({ users, loading, height = 250, limit = 5 }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  if (loading) return <div className="flex items-center justify-center h-32">Carregando...</div>;
  
  if (!users?.length) return (
    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
      Sem dados disponíveis
    </div>
  );

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
  const data = Object.entries(referralCounts)
    .map(([source, count]) => ({ 
      name: source === 'sem_indicacao' ? 'Sem Indicação' : source,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, expanded ? undefined : limit); // Aplicar limite apenas quando não expandido

  const totalSources = Object.keys(referralCounts).length;

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
            layout="horizontal" // Mudado para horizontal
            margin={{ top: 5, right: 30, left: 30, bottom: 40 }} // Ajustado margens
          >
            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} />
            <XAxis 
              dataKey="name" 
              type="category"
              axisLine={false}
              tickLine={false}
              fontSize={11}
              angle={-45} // Rotacionar labels para melhor legibilidade
              textAnchor="end" // Alinhar texto ao final
              height={70} // Dar mais espaço para os labels
              interval={0} // Mostrar todos os labels
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
              radius={[4, 4, 0, 0]} // Ajustado para layout horizontal
              maxBarSize={35} // Barras mais grossas
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
