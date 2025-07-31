import React from 'react';
import { cn } from '../utils/cn';
import { 
  Clock, 
  FileCheck, 
  Search, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Loader,
  AlertCircle,
  ChevronDown 
} from 'lucide-react';

type StatusType = string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export default function StatusBadge({ status, className, onClick, clickable }: StatusBadgeProps) {
  // Função para determinação do estilo baseado no status
  const getStatusConfig = (statusType: StatusType) => {
    switch (statusType) {
      case 'pending':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/30',
          text: 'text-yellow-700 dark:text-yellow-300',
          border: 'border-yellow-200 dark:border-yellow-800/50',
          label: 'Pendente',
          icon: <Clock className="h-3.5 w-3.5 flex-shrink-0" />
        };
      case 'receipt_sent':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800/50',
          label: 'Comprovante Enviado',
          icon: <FileCheck className="h-3.5 w-3.5 flex-shrink-0" />
        };
      case 'under_review':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/30',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-200 dark:border-purple-800/50',
          label: 'Em Análise',
          icon: <Search className="h-3.5 w-3.5 flex-shrink-0" />
        };
      case 'review':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/30',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-200 dark:border-purple-800/50',
          label: 'Em Análise',
          icon: <Search className="h-3.5 w-3.5 flex-shrink-0" />
        };
      case 'approved':
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-200 dark:border-green-800/50',
          label: 'Aprovado',
          icon: <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
        };
      case 'not_approved':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-200 dark:border-red-800/50',
          label: 'Não Aprovado',
          icon: <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
        };
      case 'rejected':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-200 dark:border-red-800/50',
          label: 'Rejeitado',
          icon: <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
        };
      case 'paid':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800/50',
          label: 'Pago',
          icon: <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
        };
      case 'withdrawal_processing':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/30',
          text: 'text-indigo-700 dark:text-indigo-300',
          border: 'border-indigo-200 dark:border-indigo-800/50',
          label: 'Em Processamento',
          icon: <Loader className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
        };
      case 'processing':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          text: 'text-blue-700 dark:text-blue-300',
          border: 'border-blue-200 dark:border-blue-800/50',
          label: 'Processando',
          icon: <Loader className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
        };
      case 'completed':
        return {
          bg: 'bg-green-50 dark:bg-green-950/30',
          text: 'text-green-700 dark:text-green-300',
          border: 'border-green-200 dark:border-green-800/50',
          label: 'Concluído',
          icon: <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
        };
      case 'failed':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          text: 'text-red-700 dark:text-red-300',
          border: 'border-red-200 dark:border-red-800/50',
          label: 'Falha',
          icon: <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800/50',
          text: 'text-gray-700 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-700/50',
          label: status,
          icon: null
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div 
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        config.bg,
        config.text,
        config.border,
        clickable && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="flex items-center gap-1.5">
        {config.icon}
        <span>{config.label}</span>
        {clickable && <ChevronDown className="h-3 w-3 ml-0.5" />}
      </div>
    </div>
  );
}