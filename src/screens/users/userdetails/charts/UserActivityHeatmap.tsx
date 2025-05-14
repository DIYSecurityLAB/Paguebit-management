import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HeatmapDataItem {
  day: number;
  hour: number;
  value: number;
}

interface CustomShapeProps {
  cx?: number;
  cy?: number;
  value?: number;
  [key: string]: any;
}

interface UserActivityHeatmapProps {
  activityHeatmap: HeatmapDataItem[];
}

export default function UserActivityHeatmap({ activityHeatmap }: UserActivityHeatmapProps) {
  return (
    <div className="bg-card rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Mapa de Calor de Atividade</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Este gráfico mostra os horários e dias da semana em que o usuário realiza mais transações. 
        Cada círculo representa o volume de atividade, onde círculos maiores indicam mais transações 
        naquele dia e horário específicos. Isso ajuda a identificar padrões e preferências de uso da plataforma.
      </p>
      
      <div className="h-64">
        {activityHeatmap.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 10, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                name="Hora" 
                type="number" 
                domain={[0, 23]} 
                tickCount={12} 
                label={{ value: 'Hora do dia', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                dataKey="day" 
                name="Dia" 
                type="number" 
                domain={[0, 6]} 
                tickFormatter={(value) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][value]}
                label={{ value: 'Dia da semana', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: any, name: string) => [
                  name === 'Valor' ? 
                    `${value} transações` : 
                    (name === 'Hora' ? `${value}:00` : ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][value])
                ]}
              />
              <Scatter 
                name="Atividade" 
                data={activityHeatmap} 
                fill="#8884d8" 
                shape={(props: CustomShapeProps) => {
                  const { cx = 0, cy = 0, value = 0 } = props;
                  const size = Math.min(Math.max(value * 2, 5), 20);
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={size} 
                      fill="#8884d8" 
                      opacity={0.5 + value * 0.05}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Sem dados para exibir</p>
          </div>
        )}
      </div>
    </div>
  );
}
