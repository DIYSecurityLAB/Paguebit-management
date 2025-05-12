import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Eye, ArrowUp, ArrowDown, ChevronDown, ChevronUp, ArrowUpDown, CalendarDays, DollarSign, BarChart4, CheckCircle } from 'lucide-react';
import Table, { TableColumn } from '../../components/Table';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import WithdrawalsModal from './WithdrawalsModal';
import { Withdrawal } from '../../models/types';
import withdrawalRepository from '../../repository/withdrawal-repository';
import { formatCurrency } from '../../utils/format';
import { toast } from 'sonner';

export default function WithdrawalsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
    name: '',
    email: '',
    paymentId: '',
  });
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['withdrawals', currentPage, itemsPerPage, filters, orderBy, orderDirection],
    () => withdrawalRepository.getWithdrawals({
      page: currentPage,
      limit: itemsPerPage,
      ...filters,
      orderBy,
      order: orderDirection,
    }),
    {
      keepPreviousData: true,
      retry: 3,
      onError: (err) => {
        console.error('Erro ao carregar saques:', err);
        toast.error('Não foi possível carregar os saques. Tente novamente.');
      },
      onSettled: () => {
        // Finaliza o estado de filtragem quando a consulta é concluída
        setIsFiltering(false);
      }
    }
  );

  // Garantir que o estado de filtragem seja limpo após a conclusão de qualquer operação
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
        { value: 'processing', label: 'Processando' },
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
      key: 'userId',
      label: 'ID do Usuário',
      type: 'text' as const,
      placeholder: 'Buscar por ID do usuário',
    },
    {
      key: 'name',
      label: 'Nome',
      type: 'text' as const,
      placeholder: 'Buscar por nome',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text' as const,
      placeholder: 'Buscar por email',
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
      // Se já está ordenando por essa coluna, inverte a direção
      setOrderDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Se não, define a nova coluna e começa por ordem descendente
      setOrderBy(column);
      setOrderDirection('desc');
    }
    // Volta para a primeira página ao ordenar
    setCurrentPage(1);
  }, [orderBy]);

  const sortableColumns: Record<string, string> = {
    'amount': 'amount',
    'status': 'status',
    'createdAt': 'createdAt',
    'completedAt': 'completedAt',
    'destinationWalletType': 'destinationWalletType'
  };

  const renderSortIndicator = (columnKey: string) => {
    if (orderBy === columnKey) {
      return orderDirection === 'asc' 
        ? <ArrowUp className="h-4 w-4 ml-1" /> 
        : <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return null;
  };

  const columns = useMemo<TableColumn<Withdrawal>[]>(() => [
    {
      header: 'Nome',
      accessor: (withdrawal: Withdrawal) => {
        // Verificar se o withdrawal tem uma relação User
        const user = (withdrawal as any).User;
        if (user) {
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          return [firstName, lastName].filter(Boolean).join(' ') || 'Não informado';
        }
        return 'Não informado';
      },
    },
    {
      header: 'Email',
      accessor: (withdrawal: Withdrawal) => {
        // Tenta pegar o email do usuário relacionado
        const userEmail = (withdrawal as any).User?.email;
        return userEmail || 'Não informado';
      },
    },
    {
      header: 'Valor',
      accessor: (withdrawal: Withdrawal) => formatCurrency(withdrawal.amount),
      sortKey: 'amount',
      sortable: true,
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
      accessor: (withdrawal: Withdrawal) => format(new Date(withdrawal.createdAt), 'dd/MM/yyyy HH:mm'),
      sortKey: 'createdAt',
      sortable: true,
    },
    {
      header: 'Concluído em',
      accessor: (withdrawal: Withdrawal) => 
        withdrawal.completedAt 
          ? format(new Date(withdrawal.completedAt), 'dd/MM/yyyy HH:mm')
          : '-',
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

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    // Ativa o indicador de carregamento enquanto os filtros são aplicados
    setIsFiltering(true);
    
    // Se o objeto newFilters estiver vazio, resetamos todos os filtros
    if (Object.keys(newFilters).length === 0) {
      console.log("Limpando todos os filtros");
      setFilters({
        status: '',
        userId: '',
        dateFrom: '',
        dateTo: '',
        name: '',
        email: '',
        paymentId: '',
      });
      
      // Força uma nova consulta ao limpar os filtros
      // Isso garante que a consulta seja refeita como se fosse a carga inicial
      setTimeout(() => {
        queryClient.invalidateQueries(['withdrawals']);
      }, 100);
    } else {
      console.log("Aplicando filtros:", newFilters);
      // Atualizando apenas as propriedades fornecidas
      const updatedFilters = {
        status: '',
        userId: '',
        dateFrom: '',
        dateTo: '',
        name: '',
        email: '',
        paymentId: '',
      };
      
      if (newFilters.status) updatedFilters.status = newFilters.status;
      if (newFilters.userId) updatedFilters.userId = newFilters.userId;
      if (newFilters.dateRangeFrom) updatedFilters.dateFrom = newFilters.dateRangeFrom;
      if (newFilters.dateRangeTo) updatedFilters.dateTo = newFilters.dateRangeTo;
      if (newFilters.name) updatedFilters.name = newFilters.name;
      if (newFilters.email) updatedFilters.email = newFilters.email;
      if (newFilters.paymentId) updatedFilters.paymentId = newFilters.paymentId;
      
      setFilters(updatedFilters);
    }
    
    // Resetar para a primeira página quando filtrar
    setCurrentPage(1);
  }, [queryClient]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho e filtros */}
      <div className="space-y-3">
        {/* Botão para expandir/contrair filtros em dispositivos móveis */}
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

        {/* Filtros visíveis em desktop ou quando expandidos em mobile */}
        <div className={`${filtersExpanded ? 'block' : 'hidden'} sm:block`}>
          <FilterBar
            filters={filterOptions}
            onFilterChange={handleFilterChange}
            className="mb-4"
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
            <div className="relative w-full sm:w-auto">
              <select 
                className="w-full sm:w-64 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary appearance-none pl-9" 
                value={`${orderBy}-${orderDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  handleSort(field);
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
              {/* Ícone baseado na seleção atual */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                {orderBy === 'createdAt' && <CalendarDays className="h-4 w-4" />}
                {orderBy === 'amount' && <DollarSign className="h-4 w-4" />}
                {orderBy === 'status' && <BarChart4 className="h-4 w-4" />}
                {orderBy === 'completedAt' && <CheckCircle className="h-4 w-4" />}
              </div>
              {/* Indicador de direção */}
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

      {error ? (
        <div className="text-center p-6 bg-card rounded-lg border border-border">
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
      ) : (
        <Table
          data={data?.data || []}
          columns={columns}
          isLoading={isLoading || isFiltering}
          sortColumn={orderBy}
          sortDirection={orderDirection}
          onSort={handleSort}
        />
      )}

      {data && data.pagination && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.pagination.total}
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
