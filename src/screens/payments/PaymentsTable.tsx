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
import { Payment } from '../../domain/entities/Payment.entity';
import { PaymentStatus } from '../../data/model/payment.model';
import { PaymentRepository } from '../../data/repository/payment-repository';
import { formatCurrency } from '../../utils/format';
import { toast } from 'sonner';
 
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
    id: '',
    transactionType: '',
  });
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const queryClient = useQueryClient();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
 
  const paymentRepository = useMemo(() => new PaymentRepository(), []);

  const updateStatusMutation = useMutation(
    (params: { id: string; status: PaymentStatus }) => 
      paymentRepository.updatePaymentStatus(
        params.id,
        { status: params.status }
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
    async () => {
      // Remove propriedades com valores vazios do objeto filters
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      const res = await paymentRepository.listPayments({
        page: String(currentPage),
        limit: String(itemsPerPage),
        ...cleanFilters,
        orderBy,
        order: orderDirection,
      });
      return res;
    },
    {
      keepPreviousData: true,
      onSettled: () => {
        setIsFiltering(false);
      }
    }
  );

  const filterOptions = useMemo(() => [
    {
      key: 'id',
      label: 'ID do Pagamento',
      type: 'text' as const,
      placeholder: 'Buscar por ID do pagamento',
    },
    {
      key: 'storeId',
      label: 'ID da Loja',
      type: 'text' as const,
      placeholder: 'Buscar por ID da loja',
    },
    {
      key: 'userId',
      label: 'ID do Usuário',
      type: 'text' as const,
      placeholder: 'Buscar por ID do usuário',
    },
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
        { value: 'completed', label: 'Concluído' },
        { value: 'rejected', label: 'Rejeitado' },
      ],
    },
    {
      key: 'transactionType',
      label: 'Tipo de Transação',
      type: 'select' as const,
      options: [
        { value: 'static', label: 'QR Estático' },
        { value: 'dinamic', label: 'QR Dinâmico' },
      ],
    },
    {
      key: 'noreceipt',
      label: 'Sem Comprovante',
      type: 'select' as const,
      options: [
        { value: '', label: 'Todos' },
        { value: 'true', label: 'Apenas sem comprovante' },
        { value: 'false', label: 'Apenas com comprovante' },
      ],
    },
    {
      key: 'dateRange',
      label: 'Período',
      type: 'daterange' as const,
    },
  ], []);

  const handleSort = useCallback((column: string) => {
    if (orderBy === column) {
      setOrderDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(column);
      setOrderDirection('desc');
    }
    setCurrentPage(1);
  }, [orderBy]);

  // Mapeia as colunas disponíveis na UI para os campos da API
  const sortableColumns: Record<string, string> = {
    'amount': 'amount',
    'status': 'status',
    'createdAt': 'createdAt',
    'storeId': 'storeId',
    'whitelabelId': 'whitelabelId',
    'userId': 'userId',
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
    // Mostra só o começo do ID da Loja
    {
      header: 'ID da Loja',
      accessor: (payment: Payment) => (
        <span className="font-mono text-xs break-all">
          {payment.storeId ? `${payment.storeId.slice(0, 8)}...` : <span className="text-red-500">sem informação</span>}
        </span>
      ),
    },
    {
      header: 'Nome',
      accessor: (payment: Payment) => {
        // Se houver store, mostra o nome da loja
        if (payment.store && payment.store.name) {
          return <span>{payment.store.name}</span>;
        }
        return <span>Não informado</span>;
      },
    },
    {
      header: 'Email',
      accessor: (payment: Payment) => payment.email || 'Não informado',
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
  ], [updateStatusMutation]);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setIsFiltering(true);
    if (Object.keys(newFilters).length === 0) {
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
      setTimeout(() => {
        queryClient.invalidateQueries(['payments']);
      }, 100);
    } else {
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
    setCurrentPage(1);
  }, [queryClient]);

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

  useEffect(() => {
    if (!isLoading) {
      setIsFiltering(false);
    }
  }, [isLoading]);

  // Converte PaymentModel para Payment entity
  const payments: Payment[] = Array.isArray(data?.data)
    ? data!.data.map((model: any) => Payment.fromModel(model))
    : [];

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
        data={payments}
        columns={columns}
        isLoading={isLoading || isFiltering}
        sortColumn={orderBy}
        sortDirection={orderDirection}
        onSort={handleSort}
      />

      {data && typeof data.total === 'number' && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.total}
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