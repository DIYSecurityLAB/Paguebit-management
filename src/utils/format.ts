import { format, formatDistanceToNow } from 'date-fns';

// Função de formatação de moeda que também suporta formatação compacta
export const formatCurrency = (value?: number, options?: { compact?: boolean }): string => {
  if (value === undefined || value === null) return 'R$ 0,00';
  
  const { compact } = options || {};
  
  if (compact) {
    // Formato compacto para valores grandes
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    }
  }
  
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const formatDateTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM dd, yyyy • HH:mm');
};

export const formatTimeAgo = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};