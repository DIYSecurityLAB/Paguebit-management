import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Eye, ChevronDown, ChevronUp, ArrowUpDown, CalendarDays, DollarSign, BarChart4, CheckCircle } from 'lucide-react';
import Table, { TableColumn } from '../../components/Table';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import WithdrawalsModal from './WithdrawalsModal';
import WithdrawalNetworkSummary from '../../components/WithdrawalNetworkSummary';
import { WithdrawalRepository } from '../../data/repository/withdrawal-repository';
import { Withdrawal } from '../../domain/entities/Withdrawal.entity';
import { WithdrawalModel } from '../../data/model/withdrawal.model';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { toast } from 'sonner';

export default function WithdrawalsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    storeId: '',
    dateFrom: '',
    dateTo: '',
    paymentId: '',
    cryptoType: '',
  });
  const [orderBy, setOrderBy] = useState<'status' | 'storeId' | 'createdAt' | 'completedAt' | 'amount' | 'destinationWallet' | 'destinationWalletType' | 'txId' | 'id' | 'whitelabelId'>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const queryClient = useQueryClient();

  const withdrawalRepository = new WithdrawalRepository();

  const { data, isLoading, error } = useQuery(
    ['withdrawals', currentPage, itemsPerPage, filters, orderBy, orderDirection],
    async () => {
      const response = await withdrawalRepository.listWithdrawals({
        page: String(currentPage),
        limit: String(itemsPerPage),
        ...filters,
        orderBy,
        order: orderDirection,
      });
      return response;
    },
    {
      keepPreviousData: true,
      retry: 3,
      onError: (err) => {
        console.error('Erro ao carregar saques:', err);
        toast.error('Não foi possível carregar os saques. Tente novamente.');
      },
      onSettled: () => {
        setIsFiltering(false);
      }
    }
  );

  useEffect(() => {
    if (!isLoading) {
      setIsFiltering(false);
    }
  }, [isLoading]);

  const filterOptions = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pendente' },
        { value: 'completed', label: 'Concluído' },
        { value: 'failed', label: 'Falha' },
      ],
    },
    {
      key: 'cryptoType',
      label: 'Tipo de Crypto',
      type: 'select' as const,
      options: [
        { value: 'BTC', label: 'Bitcoin (BTC)' },
        { value: 'USDT', label: 'Tether (USDT)' },
      ],
    },
    {
      key: 'dateRange',
      label: 'Período',
      type: 'daterange' as const,
    },
    {
      key: 'storeId',
      label: 'ID da Loja',
      type: 'text' as const,
      placeholder: 'Buscar por ID da loja',
    },
    {
      key: 'paymentId',
      label: 'ID de Pagamento',
      type: 'text' as const,
      placeholder: 'Buscar por ID de pagamento',
    },
  ], []);

  const handleSort = useCallback((column: string) => {
    if (orderBy === column) {
      setOrderDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(column as typeof orderBy);
      setOrderDirection('desc');
    }
    setCurrentPage(1);
  }, [orderBy]);

  const columns = useMemo<TableColumn<Withdrawal>[]>(() => [
    {
      header: 'ID',
      accessor: (withdrawal: Withdrawal) => withdrawal.id ? `${withdrawal.id.substring(0, 10)}...` : '-',
      sortKey: 'id',
      sortable: true,
    },
    {
      header: 'ID da Loja',
      accessor: (withdrawal: Withdrawal) => withdrawal.storeId || 'Não informado',
      sortKey: 'storeId',
      sortable: true,
    },
    {
      header: 'Email do Owner',
      accessor: (withdrawal: Withdrawal) => withdrawal.ownerEmail || 'Não informado',
      sortKey: 'whitelabelId',
      sortable: true,
    },
    {
      header: 'Valor',
      accessor: (withdrawal: Withdrawal) => formatCurrency(withdrawal.amount),
      sortKey: 'amount',
      sortable: true,
    },
    {
      header: 'Crypto',
      accessor: (withdrawal: Withdrawal) => (
        withdrawal.cryptoType ? (
          <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full font-mono">
            {withdrawal.cryptoType}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )
      ),
    },
    {
      header: 'Status',
      accessor: (withdrawal: Withdrawal) => (
        <StatusBadge status={withdrawal.status} />
      ),
      sortKey: 'status',
      sortable: true,
    },
    {
      header: 'Tipo de Carteira',
      accessor: (withdrawal: Withdrawal) => (
        <span className="capitalize">{withdrawal.destinationWalletType}</span>
      ),
      sortKey: 'destinationWalletType',
      sortable: true,
    },
    {
      header: 'Criado em',
      accessor: (withdrawal: Withdrawal) =>
        withdrawal.createdAt ? formatDateTime(withdrawal.createdAt) : '-',
      sortKey: 'createdAt',
      sortable: true,
    },
    {
      header: 'Concluído em',
      accessor: (withdrawal: Withdrawal) =>
        withdrawal.completedAt ? formatDateTime(withdrawal.completedAt) : '-',
      sortKey: 'completedAt',
      sortable: true,
    },
    {
      header: 'Ações',
      accessor: (withdrawal: Withdrawal) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedWithdrawal(withdrawal)}
          leftIcon={<Eye className="h-4 w-4" />}
        >
          Ver
        </Button>
      ),
    },
  ], []);

  const handleFilterChange = useCallback((newFilters: Record<string, unknown>) => {
    setIsFiltering(true);
    if (Object.keys(newFilters).length === 0) {
      setFilters({
        status: '',
        storeId: '',
        dateFrom: '',
        dateTo: '',
        paymentId: '',
        cryptoType: '',
      });
      setTimeout(() => {
        queryClient.invalidateQueries(['withdrawals']);
      }, 100);
    } else {
      const updatedFilters = {
        status: '',
        storeId: '',
        dateFrom: '',
        dateTo: '',
        paymentId: '',
        cryptoType: '',
      };
      if (newFilters.status) updatedFilters.status = String(newFilters.status);
      if (newFilters.storeId) updatedFilters.storeId = String(newFilters.storeId);
      if (newFilters.dateRangeFrom) updatedFilters.dateFrom = String(newFilters.dateRangeFrom);
      if (newFilters.dateRangeTo) updatedFilters.dateTo = String(newFilters.dateRangeTo);
      if (newFilters.paymentId) updatedFilters.paymentId = String(newFilters.paymentId);
      if (newFilters.cryptoType) updatedFilters.cryptoType = String(newFilters.cryptoType);
      setFilters(updatedFilters);
    }
    setCurrentPage(1);
  }, [queryClient]);

  // Converte WithdrawalModel para Withdrawal entity
  const withdrawals: Withdrawal[] = Array.isArray(data?.data)
    ? data!.data.map((model: WithdrawalModel) => Withdrawal.fromModel(model))
    : [];

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-xl font-bold mb-2 text-status-rejected">Erro ao carregar saques</h2>
          <p className="text-muted-foreground mb-4">
            Ocorreu um erro ao tentar carregar os dados de saques. Tente novamente mais tarde.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="w-full">
          <FilterBar
            filters={filterOptions}
            onFilterChange={handleFilterChange}
            className="mb-4"
            isLoading={isFiltering && isLoading}
          />
        </div>
        <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-sm font-medium flex items-center whitespace-nowrap">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              Ordenar por:
            </label>
            <div className="relative w-full sm:w-auto">
              <select 
                className="w-full sm:w-64 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary appearance-none pl-9" 
                value={`${orderBy}-${orderDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setOrderBy(field as typeof orderBy);
                  setOrderDirection(direction as 'asc' | 'desc');
                  setCurrentPage(1);
                }}
              >
                <option value="createdAt-desc" className="py-2">Mais recentes</option>
                <option value="createdAt-asc" className="py-2">Mais antigos</option>
                <option value="amount-desc" className="py-2">Maior valor</option>
                <option value="amount-asc" className="py-2">Menor valor</option>
                <option value="status-asc" className="py-2">Status (A-Z)</option>
                <option value="status-desc" className="py-2">Status (Z-A)</option>
                <option value="completedAt-desc" className="py-2">Concluído - Recente</option>
                <option value="completedAt-asc" className="py-2">Concluído - Antigo</option>
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                {orderBy === 'createdAt' && <CalendarDays className="h-4 w-4" />}
                {orderBy === 'amount' && <DollarSign className="h-4 w-4" />}
                {orderBy === 'status' && <BarChart4 className="h-4 w-4" />}
                {orderBy === 'completedAt' && <CheckCircle className="h-4 w-4" />}
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                {orderDirection === 'asc' ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <WithdrawalNetworkSummary />

      <Table
        data={withdrawals}
        columns={columns}
        isLoading={isLoading || isFiltering}
        sortColumn={orderBy}
        sortDirection={orderDirection}
        onSort={handleSort}
        onRowClick={setSelectedWithdrawal}
      />

      {data && typeof data.total === 'number' && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.total}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

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