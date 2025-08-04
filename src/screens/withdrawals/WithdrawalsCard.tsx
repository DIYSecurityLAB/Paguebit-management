import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Eye, ChevronUp, ChevronDown, ArrowUpDown, CalendarDays, DollarSign, SortAsc, SortDesc,  } from 'lucide-react';
import CardItem from '../../components/CardItem';
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
import Select from '../../components/Select';

export default function WithdrawalsCard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    storeId: '',
    dateFrom: '',
    dateTo: '',
    paymentId: '',
  });
  const [orderBy, setOrderBy] = useState<'status' | 'storeId' | 'createdAt' | 'completedAt' | 'amount' | 'destinationWallet' | 'destinationWalletType' | 'txId' | 'id' | 'whitelabelId'>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const queryClient = useQueryClient();
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Instanciar o repository
  const withdrawalRepository = new WithdrawalRepository();

  // Buscar dados usando o repository novo
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

  // Filtros disponíveis
  const filterOptions = [
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
  ];

  const handleFilterChange = useCallback((newFilters: Record<string, unknown>) => {
    setIsFiltering(true);
    if (Object.keys(newFilters).length === 0) {
      setFilters({
        status: '',
        storeId: '',
        dateFrom: '',
        dateTo: '',
        paymentId: '',
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
      };
      if (newFilters.status) updatedFilters.status = String(newFilters.status);
      if (newFilters.storeId) updatedFilters.storeId = String(newFilters.storeId);
      if (newFilters.dateRangeFrom) updatedFilters.dateFrom = String(newFilters.dateRangeFrom);
      if (newFilters.dateRangeTo) updatedFilters.dateTo = String(newFilters.dateRangeTo);
      if (newFilters.paymentId) updatedFilters.paymentId = String(newFilters.paymentId);
      setFilters(updatedFilters);
    }
    setCurrentPage(1);
  }, [queryClient]);

  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setOrderBy(field as typeof orderBy);
    setOrderDirection(direction);
    setCurrentPage(1);
  }, []);

  const sortOptions = [
    { value: 'createdAt-desc', label: 'Mais recentes', icon: <CalendarDays className="h-4 w-4 text-purple-500" /> },
    { value: 'createdAt-asc', label: 'Mais antigos', icon: <CalendarDays className="h-4 w-4 text-blue-500" /> },
    { value: 'amount-desc', label: 'Maior valor', icon: <DollarSign className="h-4 w-4 text-green-500" /> },
    { value: 'amount-asc', label: 'Menor valor', icon: <DollarSign className="h-4 w-4 text-yellow-500" /> },
    { value: 'status-asc', label: 'Status (A-Z)', icon: <SortAsc className="h-4 w-4 text-cyan-500" /> },
    { value: 'status-desc', label: 'Status (Z-A)', icon: <SortDesc className="h-4 w-4 text-orange-500" /> },
  ];

  // Converte WithdrawalModel para Withdrawal entity para cada item
  const withdrawals: Withdrawal[] = Array.isArray(data?.data)
    ? data!.data.map((model: WithdrawalModel) => Withdrawal.fromModel(model))
    : [];

  return (
    <div className="space-y-4">
      {/* Cabeçalho e filtros */}
      <div className="space-y-3">
        {/* Botão de expansão de filtros (apenas mobile) */}
        <div className="sm:hidden">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-md text-sm font-medium flex justify-between items-center"
          >
            <span>{filtersExpanded ? "Ocultar filtros" : "Exibir filtros"}</span>
            {filtersExpanded ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </button>
        </div>
        
        {/* Filtros (visíveis em desktop ou quando expandidos em mobile) */}
        <div className={`${filtersExpanded ? 'block' : 'hidden'} sm:block w-full`}>
          <FilterBar
            filters={filterOptions}
            onFilterChange={handleFilterChange}
            isLoading={isFiltering && isLoading}
          />
        </div>

        {/* Ordenação em um card separado com design aprimorado */}
        <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-sm font-medium flex items-center whitespace-nowrap">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              Ordenar por:
            </label>
            <div className="w-full sm:w-64">
              <Select
                options={sortOptions}
                value={`${orderBy}-${orderDirection}`}
                onChange={(value) => {
                  const [field, direction] = value.split('-');
                  handleSortChange(field, direction as 'asc' | 'desc');
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Componente de resumo de saques por rede */}
      <WithdrawalNetworkSummary />

      <div className="grid grid-cols-1 gap-4">
        {(isLoading || isFiltering) ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-48 bg-card rounded-lg"></div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-1 text-center p-6 bg-card rounded-lg border border-border">
            <p className="text-status-rejected">Erro ao carregar os saques. Tente novamente.</p>
            <button 
              onClick={() => {
                setIsFiltering(true);
                queryClient.invalidateQueries(['withdrawals']);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : !withdrawals.length ? (
          <div className="col-span-1 text-center p-6 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">Nenhum saque encontrado</p>
            <button 
              onClick={() => {
                setIsFiltering(true);
                queryClient.invalidateQueries(['withdrawals']);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          withdrawals.map((withdrawal) => (
            <CardItem
              key={withdrawal.id}
              title={withdrawal.storeId?.slice(0, 8) || 'Saque'}
              onClick={() => setSelectedWithdrawal(withdrawal)}
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID da Loja:</span>
                  <span className="font-mono text-xs break-all">{withdrawal.storeId || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium">{formatCurrency(withdrawal.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo de Carteira:</span>
                  <span className="capitalize">{withdrawal.destinationWalletType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email do Owner:</span>
                  <span className="font-medium">{withdrawal.ownerEmail || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span>
                    {withdrawal.createdAt ? formatDateTime(withdrawal.createdAt) : '-'}
                  </span>
                </div>
                {withdrawal.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Concluído em:</span>
                    <span>
                      {withdrawal.completedAt ? formatDateTime(withdrawal.completedAt) : '-'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <StatusBadge status={withdrawal.status} />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  leftIcon={<Eye className="h-4 w-4" />}
                >
                  Ver Detalhes
                </Button>
              </div>
            </CardItem>
          ))
        )}
      </div>

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
    