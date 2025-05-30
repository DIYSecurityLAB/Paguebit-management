import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Eye, CheckCircle, XCircle, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import Table, { TableColumn } from '../../components/Table';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import PaymentsModal from './PaymentsModal';
import { Payment, PaymentStatus } from '../../models/types';
import paymentRepository from '../../repository/payment-repository';
import { formatCurrency } from '../../utils/format';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

export default function PaymentsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    userId: '',
    name: '',
    email: '',
    id: '', // Alterado de paymentId para id
    transactionType: '', // Novo filtro adicionado
  });
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const queryClient = useQueryClient();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const { user } = useAuth(); // Adicione para pegar o usuário logado
  
  const updateStatusMutation = useMutation(
    (params: { id: string; status: PaymentStatus }) => 
      paymentRepository.updatePaymentStatus(
        params.id,
        params.status,
        undefined,
        undefined,
        user?.uid, // userId para auditoria
        data?.data.find(p => p.id === params.id)?.status // status anterior para auditoria
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('payments');
        toast.success('Status do pagamento atualizado com sucesso');
      },
      onError: () => {
        toast.error('Falha ao atualizar o status do pagamento');
      },
    }
  );

  const { data, isLoading } = useQuery(
    ['payments', currentPage, itemsPerPage, filters, orderBy, orderDirection],
    () => {
      // Remover propriedades com valores vazios do objeto filters
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      return paymentRepository.getPayments({
        page: currentPage,
        limit: itemsPerPage,
        ...cleanFilters,
        orderBy,
        order: orderDirection,
      });
    },
    {
      keepPreviousData: true,
      onSettled: () => {
        // Finaliza o estado de filtragem quando a consulta é concluída
        setIsFiltering(false);
      }
    }
  );

  // Usar useMemo para evitar recriar o array a cada renderização
  const filterOptions = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pendente' },
        { value: 'receipt_sent', label: 'Comprovante Enviado' },
        { value: 'under_review', label: 'Em Análise' },
        { value: 'approved', label: 'Aprovado' },
        { value: 'not_approved', label: 'Não Aprovado' },
        { value: 'paid', label: 'Pago' },
        { value: 'withdrawal_processing', label: 'Processamento de Saque' },
      ],
    },
    {
      key: 'transactionType',
      label: 'Tipo de Transação',
      type: 'select' as const,
      options: [
        { value: 'static', label: 'QR Estático' },
        { value: 'dynamic', label: 'QR Dinâmico' },
      ],
    },
    {
      key: 'id',
      label: 'ID do Pagamento',
      type: 'text' as const,
      placeholder: 'Buscar por ID do pagamento',
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
  ], []);

  // Handler para ordenação
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

  // Mapeia as colunas disponíveis na UI para os campos da API
  const sortableColumns: Record<string, string> = {
    'amount': 'amount',
    'status': 'status',
    'createdAt': 'createdAt',
  };

  // Função para renderizar o indicador de ordenação
  const renderSortIndicator = (columnKey: string) => {
    if (orderBy === columnKey) {
      return orderDirection === 'asc' 
        ? <ArrowUp className="h-4 w-4 ml-1" /> 
        : <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return null;
  };

  // Usar useMemo para evitar recriar a array de colunas a cada renderização
  const columns = useMemo<TableColumn<Payment>[]>(() => [
    {
      header: 'Tipo',
      accessor: (payment: Payment) => (
        <span className="capitalize">{payment.transactionType === 'static' ? 'QR Estático' : 'QR Dinâmico'}</span>
      ),
    },
    {
      header: 'Nome',
      accessor: (payment: Payment) => {
        // Verificar se o pagamento tem uma relação User
        const user = (payment as any).User;
        if (user) {
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          return <span>{[firstName, lastName].filter(Boolean).join(' ') || 'Não informado'}</span>;
        }
        return <span>Não informado</span>;
      },
    },
    {
      header: 'Email',
      accessor: (payment: Payment) => {
        // Primeiro tenta pegar o email do usuário relacionado, depois do payment
        const userEmail = (payment as any).User?.email;
        return userEmail || payment.email || 'Não informado';
      },
    },
    {
      header: 'Valor',
      accessor: (payment: Payment) => formatCurrency(payment.amount),
      sortKey: 'amount',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (payment: Payment) => (
        <StatusBadge status={payment.status} />
      ),
      sortKey: 'status',
      sortable: true,
    },
    {
      header: 'Data',
      accessor: (payment: Payment) => format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm'),
      sortKey: 'createdAt',
      sortable: true,
    },
    {
      header: 'Ações',
      accessor: (payment: Payment) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPayment(payment)}
            leftIcon={<Eye className="h-4 w-4" />}
          >
            Ver
          </Button>
          {payment.status === PaymentStatus.RECEIPT_SENT && (
            <>
              <Button
                variant="success"
                size="sm"
                // Corrigido para APPROVED e auditoria
                onClick={() => updateStatusMutation.mutate({ id: payment.id, status: PaymentStatus.APPROVED })}
                isLoading={updateStatusMutation.isLoading}
                leftIcon={<CheckCircle className="h-4 w-4" />}
              >
                Aprovar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => updateStatusMutation.mutate({ id: payment.id, status: PaymentStatus.REJECTED })}
                isLoading={updateStatusMutation.isLoading}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Rejeitar
              </Button>
            </>
          )}
        </div>
      ),
    },
  ], [handleSort, orderBy, orderDirection, sortableColumns, updateStatusMutation]);

  // Usar useCallback para evitar recriar a função a cada renderização
  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    // Ativa o indicador de carregamento enquanto os filtros são aplicados
    setIsFiltering(true);
    
    // Se o objeto newFilters estiver vazio, resetamos todos os filtros
    if (Object.keys(newFilters).length === 0) {
      console.log("Limpando todos os filtros");
      setFilters({
        status: '',
        dateFrom: '',
        dateTo: '',
        userId: '',
        name: '',
        email: '',
        id: '',
        transactionType: '',
      });
      
      // Força uma nova consulta ao limpar os filtros
      // Isso garante que a consulta seja refeita como se fosse a carga inicial
      setTimeout(() => {
        queryClient.invalidateQueries(['payments']);
      }, 100);
    } else {
      console.log("Aplicando filtros:", newFilters);
      // Inicializando com o estado padrão de filtros vazios
      const updatedFilters = {
        status: '',
        dateFrom: '',
        dateTo: '',
        userId: '',
        name: '',
        email: '',
        id: '',
        transactionType: '',
      };
      
      // Atualizando apenas as propriedades fornecidas
      if (newFilters.status) updatedFilters.status = newFilters.status;
      if (newFilters.userId) updatedFilters.userId = newFilters.userId;
      if (newFilters.dateRangeFrom) updatedFilters.dateFrom = newFilters.dateRangeFrom;
      if (newFilters.dateRangeTo) updatedFilters.dateTo = newFilters.dateRangeTo;
      if (newFilters.name) updatedFilters.name = newFilters.name;
      if (newFilters.email) updatedFilters.email = newFilters.email;
      if (newFilters.id) updatedFilters.id = newFilters.id;
      if (newFilters.transactionType) updatedFilters.transactionType = newFilters.transactionType;
      
      setFilters(updatedFilters);
    }
    
    // Resetar para a primeira página quando filtrar
    setCurrentPage(1);
  }, [queryClient]);

  // Usar useCallback para outras funções de manipulação de estado
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPayment(null);
  }, []);

  // Garantir que o estado de filtragem seja limpo após a conclusão de qualquer operação
  useEffect(() => {
    if (!isLoading) {
      setIsFiltering(false);
    }
  }, [isLoading]);

  return (
    <div className="space-y-4">
      {/* Botão para expandir/contrair filtros em dispositivos móveis */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="px-4 py-2 bg-card border border-border rounded-md text-sm text-foreground font-medium flex justify-between items-center w-full"
        >
          <span>{filtersExpanded ? "Ocultar filtros" : "Ver filtros"}</span>
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
          isLoading={isFiltering && isLoading} // Só bloqueia quando ambos estão ativos
        />
      </div>
      
      {/* Conteúdo existente da tabela */}
      <Table
        data={data?.data || []}
        columns={columns}
        isLoading={isLoading || isFiltering}
        sortColumn={orderBy}
        sortDirection={orderDirection}
        onSort={handleSort}
      />

      {data && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.pagination.total}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {selectedPayment && (
        <PaymentsModal
          payment={selectedPayment}
          isOpen={!!selectedPayment}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}