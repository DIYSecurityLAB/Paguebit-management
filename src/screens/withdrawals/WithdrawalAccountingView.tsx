import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { format, subDays, startOfDay } from 'date-fns';
import { WithdrawalRepository } from '../../data/repository/withdrawal-repository';
import { WithdrawalModel } from '../../data/model/withdrawal.model';
import WithdrawalSummaryCards from './WithdrawalSummaryCards';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { toast } from 'sonner';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import { Eye } from 'lucide-react';
import Button from '../../components/Button';
import WithdrawalsModal from './WithdrawalsModal';
import { Withdrawal } from '../../domain/entities/Withdrawal.entity';

export default function WithdrawalAccountingView() {
  const [selectedDays, setSelectedDays] = useState(7);
  const [summaryStatus, setSummaryStatus] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [filters, setFilters] = useState({
    status: '',
    storeId: '',
  });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);

  const withdrawalRepository = new WithdrawalRepository();

  // Calcular datas para o filtro do resumo financeiro
  const endDate = startOfDay(new Date());
  const startDate = startOfDay(subDays(new Date(), selectedDays - 1));

  // Busca para o resumo financeiro (apenas período + status)
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery(
    ['withdrawals-accounting-summary', selectedDays, summaryStatus], // NOVO
    async () => {
      try {
        const response = await withdrawalRepository.listWithdrawals({
          dateFrom: format(startDate, 'yyyy-MM-dd'),
          dateTo: format(new Date(), 'yyyy-MM-dd'),
          limit: '1000',
          status: summaryStatus || '', // NOVO
        });
        setLastUpdated(new Date());
        return Array.isArray(response.data)
          ? response.data.map((model: WithdrawalModel) => Withdrawal.fromModel(model))
          : [];
      } catch (error) {
        console.error('Erro ao carregar resumo financeiro:', error);
        toast.error('Falha ao carregar o resumo financeiro');
        throw error;
      }
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );

  // Busca para a tabela (paginada, igual WithdrawalsTable, sem filtro de período)
  const {
    data: tableData,
    isLoading: isTableLoading,
    refetch: refetchTable,
  } = useQuery(
    ['withdrawals-accounting-table', currentPage, itemsPerPage, filters.status, filters.storeId],
    async () => {
      try {
        const response = await withdrawalRepository.listWithdrawals({
          page: String(currentPage),
          limit: String(itemsPerPage),
          status: filters.status || '',
          storeId: filters.storeId || '',
        });
        return {
          ...response,
          data: Array.isArray(response.data)
            ? response.data.map((model: WithdrawalModel) => Withdrawal.fromModel(model))
            : [],
          total: typeof response.total === 'number' ? response.total : (Array.isArray(response.data) ? response.data.length : 0),
        };
      } catch (error) {
        console.error('Erro ao carregar dados da tabela de prestação de contas:', error);
        toast.error('Falha ao carregar os dados da tabela');
        throw error;
      }
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );

  // Definição das colunas da tabela simplificada
  const columns = [
    {
      header: 'Status',
      accessor: (withdrawal: Withdrawal) => (
        <div className="pl-2 border-r border-border h-full flex items-center">
          <StatusBadge status={withdrawal.status} />
        </div>
      ),
      sortKey: 'status',
    },
    {
      header: 'Data',
      accessor: (withdrawal: Withdrawal) => (
        <div className="pl-2 border-r border-border h-full flex items-center">
          {formatDateTime(withdrawal.createdAt)}
        </div>
      ),
      sortKey: 'createdAt',
    },
    {
      header: 'Loja',
      accessor: (withdrawal: Withdrawal) => (
        <div className="pl-2 border-r border-border h-full flex items-center max-w-[150px] truncate" title={withdrawal.store?.name || withdrawal.storeId}>
          {withdrawal.store?.name || withdrawal.storeId.substring(0, 8) + '...'}
        </div>
      ),
    },
    {
      header: 'Crypto',
      accessor: (withdrawal: Withdrawal) => (
        <div className="border-r border-border h-full flex items-center justify-center text-center">
          {withdrawal.cryptoType ? (
            <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full font-mono">
              {withdrawal.cryptoType}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Valor do Saque',
      accessor: (withdrawal: Withdrawal) => (
        <div className="border-r border-border h-full flex items-center justify-center text-center font-medium">
          {formatCurrency(Number(withdrawal.amount || 0))}
        </div>
      ),
      sortKey: 'amount',
    },
    {
      header: 'Valor Cobrado WL',
      accessor: (withdrawal: Withdrawal) => {
        const value = withdrawal.feesDetail && withdrawal.feesDetail.length > 0
          ? Number(withdrawal.feesDetail[0].whitelabelTotal || 0)
          : 0;
        return (
          <div className="border-r border-border h-full flex items-center justify-center text-center font-medium text-orange-600 dark:text-orange-400">
            {formatCurrency(value)}
          </div>
        );
      },
    },
    {
      header: 'Repasse WL',
      accessor: (withdrawal: Withdrawal) => {
        const value = withdrawal.feesDetail && withdrawal.feesDetail.length > 0
          ? Number(withdrawal.feesDetail[0].whitelabelNet || 0)
          : 0;
        return (
          <div className="border-r border-border h-full flex items-center justify-center text-center font-medium text-green-600 dark:text-green-400">
            {formatCurrency(value)}
          </div>
        );
      },
    },
    {
      header: 'Repasse Plataforma',
      accessor: (withdrawal: Withdrawal) => {
        const value = withdrawal.feesDetail && withdrawal.feesDetail.length > 0
          ? Number(withdrawal.feesDetail[0].platformTotal || 0)
          : 0;
        return (
          <div className="border-r border-border h-full flex items-center justify-center text-center font-medium text-purple-600 dark:text-purple-400">
            {formatCurrency(value)}
          </div>
        );
      },
    },
    {
      header: 'Ações',
      accessor: (withdrawal: Withdrawal) => (
        <div className="flex justify-center items-center h-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewWithdrawal(withdrawal)}
            leftIcon={<Eye className="h-4 w-4" />}
          >
            Ver
          </Button>
        </div>
      ),
    },
  ];

  // Filtros disponíveis
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'Todos' },
        { value: 'pending', label: 'Pendente' },
        { value: 'completed', label: 'Concluído' },
        { value: 'failed', label: 'Falha' },
      ],
    },
    {
      key: 'storeId',
      label: 'ID da Loja',
      type: 'text' as const,
      placeholder: 'Buscar por ID da loja',
    },
  ];

  // Função para lidar com a mudança de filtros
  const handleFilterChange = (newFilters: Record<string, unknown>) => {
    const updatedFilters = {
      status: typeof newFilters.status === 'string' ? newFilters.status : '',
      storeId: typeof newFilters.storeId === 'string' ? newFilters.storeId : '',
    };
    setFilters(updatedFilters);
    setCurrentPage(1);
  };

  // Função para garantir que selectedDays seja sempre número
  const handleDaysFilterChange = (days: number) => {
    if (selectedDays !== days) setSelectedDays(days);
  };

  // Função para garantir que summaryStatus só atualize se mudar
  const handleStatusFilterChange = (status: string) => {
    if (summaryStatus !== status) setSummaryStatus(status);
  };

  const handleViewWithdrawal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
  };

  // Lista para o resumo financeiro
  const withdrawalsSummary = summaryData || [];
  // Lista para a tabela paginada
  const withdrawalsTable = tableData?.data || [];
  // Total de itens para paginação (igual WithdrawalsTable)
  const totalItems = typeof tableData?.total === 'number' ? tableData.total : 0;

  return (
    <div className="space-y-6">
      {/* Cards de resumo com filtros */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <WithdrawalSummaryCards
              withdrawals={withdrawalsSummary}
              isLoading={isSummaryLoading}
              onDaysFilterChange={handleDaysFilterChange}
              selectedDays={selectedDays}
              lastUpdated={lastUpdated}
              selectedStatus={summaryStatus}
              onStatusFilterChange={handleStatusFilterChange}
            />
          </div>
        </div>
      </div>
      
      {/* Filtros adicionais */}
      <div className="bg-card border border-border rounded-lg p-4">
        <FilterBar
          filters={filterOptions}
          onFilterChange={handleFilterChange}
          isLoading={isTableLoading}
          className="mb-0"
        />
      </div>
      
      {/* Tabela simplificada */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-medium">Detalhamento de Saques para Prestação de Contas</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Exibindo saques paginados
          </p>
        </div>
        <Table
          data={withdrawalsTable}
          columns={columns}
          isLoading={isTableLoading}
        />
        
        {/* Paginação */}
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Modal de detalhes */}
      {selectedWithdrawal && (
        <WithdrawalsModal
          withdrawal={selectedWithdrawal}
          isOpen={!!selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
        />
      )}
    </div>
  );
}