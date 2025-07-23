import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Eye, ChevronUp, ChevronDown, ArrowDownUp, CalendarDays, DollarSign, ArrowUpDown, BarChart4, Clock, SortAsc, SortDesc, CheckCircle, AlertCircle, Loader, Filter } from 'lucide-react';
import CardItem from '../../components/CardItem';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import WithdrawalsModal from './WithdrawalsModal';
import WithdrawalNetworkSummary from '../../components/WithdrawalNetworkSummary';
import { Withdrawal } from '../../models/types';
import withdrawalRepository from '../../repository/withdrawal-repository';
import { formatCurrency } from '../../utils/format';
import { toast } from 'sonner';
import Select from '../../components/Select';

export default function WithdrawalsCard() {
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
  // Adicionar estados para ordenação (padrão: criado em ordem decrescente)
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const queryClient = useQueryClient();
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Função utilitária para validar datas
  function formatDateSafe(date: any, formatStr: string) {
    // Aceita string ISO, timestamp ou Date
    if (!date) return '-';
    if (typeof date === 'object' && Object.keys(date).length === 0) return '-';
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return format(d, formatStr);
  }

  const columns = [
    {
      header: 'Loja',
      accessor: (withdrawal: Withdrawal) => {
        if (withdrawal.store && withdrawal.store.name) {
          return withdrawal.store.name;
        }
        return withdrawal.storeId ? withdrawal.storeId.slice(0, 8) + '...' : 'Não informado';
      },
    },
    {
      header: 'ID da Loja',
      accessor: (withdrawal: Withdrawal) => withdrawal.storeId || 'Não informado',
    },
    {
      header: 'Valor',
      accessor: (withdrawal: Withdrawal) => formatCurrency(withdrawal.amount),
    },
    {
      header: 'Status',
      accessor: (withdrawal: Withdrawal) => (
        <StatusBadge status={withdrawal.status} />
      ),
    },
    {
      header: 'Tipo de Carteira',
      accessor: (withdrawal: Withdrawal) => (
        <span className="capitalize">{withdrawal.destinationWalletType}</span>
      ),
    },
    {
      header: 'Criado em',
      accessor: (withdrawal: Withdrawal) =>
        formatDateSafe(withdrawal.createdAt, 'dd/MM/yyyy HH:mm:ss'),
    },
    {
      header: 'Concluído em',
      accessor: (withdrawal: Withdrawal) =>
        formatDateSafe(withdrawal.completedAt, 'dd/MM/yyyy HH:mm:ss'),
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
  ];

  // Chamada única ao withdrawalRepository (não buscar User)
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

  // Adiciona log para depuração
  useEffect(() => {
    console.log('Estado atual dos dados no Card:', data);
    console.log('Data array:', data?.data);
    console.log('Is loading:', isLoading);
    console.log('Error:', error);
  }, [data, isLoading, error]);

  const filterOptions = [
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
  ];

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

  // Adicionar suporte para mudar ordenação
  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setOrderBy(field);
    setOrderDirection(direction);
    setCurrentPage(1); // Voltar para a primeira página
  }, []);

  // Opções para o Select de ordenação com ícones
  const sortOptions = [
    { 
      value: 'createdAt-desc', 
      label: 'Mais recentes', 
      icon: <CalendarDays className="h-4 w-4 text-purple-500" /> 
    },
    { 
      value: 'createdAt-asc', 
      label: 'Mais antigos', 
      icon: <CalendarDays className="h-4 w-4 text-blue-500" /> 
    },
    { 
      value: 'amount-desc', 
      label: 'Maior valor', 
      icon: <DollarSign className="h-4 w-4 text-green-500" /> 
    },
    { 
      value: 'amount-asc', 
      label: 'Menor valor', 
      icon: <DollarSign className="h-4 w-4 text-yellow-500" /> 
    },
    { 
      value: 'status-asc', 
      label: 'Status (A-Z)', 
      icon: <SortAsc className="h-4 w-4 text-cyan-500" /> 
    },
    { 
      value: 'status-desc', 
      label: 'Status (Z-A)', 
      icon: <SortDesc className="h-4 w-4 text-orange-500" /> 
    },
  ];

  // Opções para o status com ícones
  const statusOptions = [
    { value: '', label: 'Todos os status', icon: <Filter className="h-4 w-4 text-gray-500" /> },
    { value: 'pending', label: 'Pendente', icon: <Clock className="h-4 w-4 text-yellow-500" /> },
    { value: 'processing', label: 'Processando', icon: <Loader className="h-4 w-4 text-blue-500" /> },
    { value: 'completed', label: 'Concluído', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
    { value: 'failed', label: 'Falha', icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
  ];

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
        ) : !data?.data || !Array.isArray(data.data) || data.data.length === 0 ? (
          <div className="col-span-1 text-center p-6 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">Nenhum saque encontrado</p>
            <button 
              onClick={() => {
                console.log('Tentando recarregar saques...');
                setIsFiltering(true);
                queryClient.invalidateQueries(['withdrawals']);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          data.data.map((withdrawal) => (
            <CardItem
              key={withdrawal.id}
              title={withdrawal.store?.name || withdrawal.storeId?.slice(0, 8) || 'Saque'}
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
                  <span className="text-muted-foreground">Criado em:</span>
                  <span>
                    {formatDateSafe(withdrawal.createdAt, 'dd/MM/yyyy HH:mm:ss')}
                  </span>
                </div>
                {withdrawal.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Concluído em:</span>
                    <span>
                      {formatDateSafe(withdrawal.completedAt, 'dd/MM/yyyy HH:mm:ss')}
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
