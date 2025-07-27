import { subMonths } from 'date-fns';
import { Payment } from '../../../../data/models/types';

export interface HeatmapDataItem {
  day: number;
  hour: number;
  value: number;
}

export const calculateGrowthRate = (payments: Payment[]): number => {
  if (payments.length === 0) return 0;
  const now = new Date();
  const threeMonthsAgo = subMonths(now, 3);
  const sixMonthsAgo = subMonths(now, 6);
  
  const recentPayments = payments.filter(p => 
    p.createdAt && new Date(p.createdAt) >= threeMonthsAgo
  );
  const olderPayments = payments.filter(p => 
    p.createdAt && new Date(p.createdAt) >= sixMonthsAgo && new Date(p.createdAt) < threeMonthsAgo
  );
  
  const recentSum = recentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const olderSum = olderPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  if (olderSum === 0) return recentSum > 0 ? 100 : 0;
  return ((recentSum - olderSum) / olderSum) * 100;
};

export const generateHeatmapData = (payments: Payment[]): HeatmapDataItem[] => {
  const heatmap: HeatmapDataItem[] = [];
  if (payments.length === 0) return heatmap;
  
  // Inicializar matriz de contagem
  const activityCount = Array(7).fill(0).map(() => Array(24).fill(0));
  
  // Preencher contagem de atividades
  payments.forEach(payment => {
    if (payment.createdAt) {
      const date = new Date(payment.createdAt);
      const day = date.getDay(); // 0-6, Domingo-Sábado
      const hour = date.getHours(); // 0-23
      activityCount[day][hour]++;
    }
  });
  
  // Converter para formato de dados do gráfico
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      if (activityCount[day][hour] > 0) {
        heatmap.push({
          day,
          hour,
          value: activityCount[day][hour]
        });
      }
    }
  };
  
  return heatmap;
};
