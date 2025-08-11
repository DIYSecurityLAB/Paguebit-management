import { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Coins, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '../utils/format';
import Select from './Select';
import { WithdrawalModel } from '../data/model/withdrawal.model';

interface WithdrawalSummaryProps {
  withdrawals: WithdrawalModel[];
  isLoading: boolean;
  onDaysFilterChange: (days: number) => void;
  selectedDays: number;
  lastUpdated: Date;
  selectedStatus: string; // NOVO
  onStatusFilterChange: (status: string) => void; // NOVO
}

export default function WithdrawalSummaryCards({ 
  withdrawals, 
  isLoading, 
  onDaysFilterChange, 
  selectedDays,
  lastUpdated,
  selectedStatus, // NOVO
  onStatusFilterChange // NOVO
}: WithdrawalSummaryProps) {
  const [summaryData, setSummaryData] = useState({
    totalWithdrawn: 0,
    totalWhitelabelNet: 0,
    totalPlatform: 0,
    totalWhitelabelCharged: 0
  });

  // Opções de filtro de dias
  const daysOptions = [
    { value: '1', label: 'Hoje' },
    { value: '2', label: 'Últimos 2 dias' },
    { value: '7', label: 'Últimos 7 dias' },
    { value: '15', label: 'Últimos 15 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' }
  ];

  // Opções de filtro de status
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendente' },
    { value: 'completed', label: 'Concluído' },
    { value: 'failed', label: 'Falha' },
  ];

  useEffect(() => {
    if (withdrawals && withdrawals.length > 0) {
      // Calcular totais
      let totalWithdrawn = 0;
      let totalWhitelabelNet = 0;
      let totalPlatform = 0;
      let totalWhitelabelCharged = 0;
      
      withdrawals.forEach(withdrawal => {
        // Valor total do saque
        totalWithdrawn += Number(withdrawal.amount || 0);
        
        // Obter os detalhes de taxas
        if (withdrawal.feesDetail && withdrawal.feesDetail.length > 0) {
          const fee = withdrawal.feesDetail[0];
          totalWhitelabelNet += Number(fee.whitelabelNet || 0);
          totalPlatform += Number(fee.platformTotal || 0);
          totalWhitelabelCharged += Number(fee.whitelabelTotal || 0);
        }
      });
      
      setSummaryData({
        totalWithdrawn,
        totalWhitelabelNet,
        totalPlatform,
        totalWhitelabelCharged
      });
    } else {
      // Reset para valores padrão
      setSummaryData({
        totalWithdrawn: 0,
        totalWhitelabelNet: 0,
        totalPlatform: 0,
        totalWhitelabelCharged: 0
      });
    }
  }, [withdrawals]);

  // Formatar a data de atualização para exibir
  const formattedLastUpdated = format(
    lastUpdated,
    "'Atualizado em' dd 'de' MMMM 'de' yyyy 'às' HH:mm",
    { locale: ptBR }
  );

  // Formatar data para exibir período do filtro
  const formattedFilterPeriod = () => {
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - selectedDays + 1);
    
    const formatStr = "dd/MM/yyyy' 00:00'";
    const startFormatted = format(startDate, formatStr);
    const endFormatted = format(endDate, formatStr);
    
    return `${startFormatted} até ${endFormatted}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {formattedFilterPeriod()}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            options={daysOptions}
            value={selectedDays.toString()}
            onChange={(value) => onDaysFilterChange(Number(value))}
            label="Período"
            className="w-40"
          />
          <Select
            options={statusOptions}
            value={selectedStatus}
            onChange={onStatusFilterChange}
            label="Status"
            className="w-40"
          />
          <div className="text-xs text-muted-foreground">
            {isLoading ? (
              <div className="flex items-center">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                Atualizando...
              </div>
            ) : (
              formattedLastUpdated
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Retirado */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
              <CircleDollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Bruto
            </span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Total Solicitado</h3>
          <div className="mt-2">
            <span className={`text-2xl font-bold text-foreground ${isLoading ? 'opacity-50' : ''}`}>
              {formatCurrency(summaryData.totalWithdrawn)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Cobrado do Whitelabel */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2">
              <ArrowDownRight className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Taxas
            </span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Total Cobrado do Whitelabel</h3>
          <div className="mt-2">
            <span className={`text-2xl font-bold text-foreground ${isLoading ? 'opacity-50' : ''}`}>
              {formatCurrency(summaryData.totalWhitelabelCharged)}
            </span>
          </div>
        </div>

        {/* Card 3: Repasse para Whitelabel */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
              <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Líquido WL
            </span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Repasse para Whitelabel</h3>
          <div className="mt-2">
            <span className={`text-2xl font-bold text-green-600 dark:text-green-400 ${isLoading ? 'opacity-50' : ''}`}>
              {formatCurrency(summaryData.totalWhitelabelNet)}
            </span>
          </div>
        </div>

        {/* Card 4: Repasse para Plataforma */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2">
              <Coins className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Plataforma
            </span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Repasse para Plataforma</h3>
          <div className="mt-2">
            <span className={`text-2xl font-bold text-purple-600 dark:text-purple-400 ${isLoading ? 'opacity-50' : ''}`}>
              {formatCurrency(summaryData.totalPlatform)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}