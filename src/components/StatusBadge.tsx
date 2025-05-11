import { cn } from '../utils/cn';

interface StatusBadgeProps {
  status: string;
  text?: string;
  className?: string;
}

export default function StatusBadge({ status, text, className }: StatusBadgeProps) {
  const getStatusDetails = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' };
      case 'receipt_sent':
        return { color: 'bg-blue-100 text-blue-800', label: 'Comprovante Enviado' };
      case 'under_review':
        return { color: 'bg-purple-100 text-purple-800', label: 'Em Análise' };
      case 'approved':
      case 'completed':
        return { color: 'bg-green-100 text-green-800', label: 'Aprovado' };
      case 'not_approved':
      case 'failed':
        return { color: 'bg-red-100 text-red-800', label: 'Rejeitado' };
      case 'processing':
        return { color: 'bg-blue-100 text-blue-800', label: 'Processando' };
      case 'paid':
        return { color: 'bg-green-100 text-green-800', label: 'Pago' };
      case 'active':
        return { color: 'bg-green-100 text-green-800', label: 'Ativo' };
      case 'inactive':
        return { color: 'bg-gray-100 text-gray-800', label: 'Inativo' };
      case 'withdrawal_processing':
        return { color: 'bg-blue-100 text-blue-800', label: 'Saque Processando' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  const { color, label } = getStatusDetails(status);

  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', color, className)}>
      {text || label}
    </span>
  );
}