import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Eye, CheckCircle, XCircle, ChevronUp, ChevronDown } from 'lucide-react';
import CardItem from '../../components/CardItem';
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
 
export default function PaymentsCard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    id: '',
    transactionType: '',
    noreceipt: '',
    storeId: '',
    qrCodeId: '',
    payerName: '',
    observation: '',
    notes: '',
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
    { key: 'id', label: 'ID do Pagamento', type: 'text', placeholder: 'Buscar por ID do pagamento' },
    { key: 'storeId', label: 'ID da Loja', type: 'text', placeholder: 'Buscar por ID da loja' },
    { key: 'payerName', label: 'Nome do Pagador', type: 'text', placeholder: 'Buscar por nome do pagador' },
    { key: 'qrCodeId', label: 'ID do QR Code', type: 'text', placeholder: 'Buscar por ID do QR Code' },
    { key: 'observation', label: 'Observação', type: 'text', placeholder: 'Buscar por observação' },
    { key: 'notes', label: 'Notas', type: 'text', placeholder: 'Buscar por notas' },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
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
      type: 'select',
      options: [
        { value: 'static', label: 'QR Estático' },
        { value: 'dynamic', label: 'QR Dinâmico' },
      ],
    },
    {
      key: 'noreceipt',
      label: 'Sem Comprovante',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'true', label: 'Apenas sem comprovante' },
        { value: 'false', label: 'Apenas com comprovante' },
      ],
    },
    {
      key: 'dateRange',
      label: 'Período',
      type: 'daterange',
    },
  ], []);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setIsFiltering(true);
    const updatedFilters = {
      status: '',
      dateFrom: '',
      dateTo: '',
      id: '',
      transactionType: '',
      noreceipt: '',
      storeId: '',
      qrCodeId: '',
      payerName: '',
      observation: '',
      notes: '',
    };
    Object.keys(updatedFilters).forEach(key => {
      if (newFilters[key]) updatedFilters[key] = newFilters[key];
    });
    if (newFilters.dateRangeFrom) updatedFilters.dateFrom = newFilters.dateRangeFrom;
    if (newFilters.dateRangeTo) updatedFilters.dateTo = newFilters.dateRangeTo;
    setFilters(updatedFilters);
    setCurrentPage(1);
    if (Object.keys(newFilters).length === 0) {
      setTimeout(() => {
        queryClient.invalidateQueries(['payments']);
      }, 100);
    }
  }, [queryClient]);

  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setOrderBy(field);
    setOrderDirection(direction);
    setCurrentPage(1);
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

        {/* Ordenação em um card separado */}
        <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex items-center">
            <label className="text-sm font-medium mr-3 whitespace-nowrap">Ordenar por:</label>
            <select 
              className="flex-grow px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary appearance-none" 
              value={`${orderBy}-${orderDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                handleSortChange(field, direction as 'asc' | 'desc');
              }}
            >
              <option value="createdAt-desc">Mais recentes</option>
              <option value="createdAt-asc">Mais antigos</option>
              <option value="amount-desc">Maior valor</option>
              <option value="amount-asc">Menor valor</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="status-desc">Status (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {(isLoading || isFiltering) ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-48 bg-card rounded-lg"></div>
            </div>
          ))
        ) : !payments.length ? (
          <div className="col-span-full flex items-center justify-center p-8 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground">Nenhum pagamento encontrado.</p>
          </div>
        ) : (
          payments.map((payment) => (
            <CardItem
              key={payment.id}
              title={`Pagamento #${payment.id}`}
              onClick={() => setSelectedPayment(payment)}
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="capitalize">{payment.transactionType === 'static' ? 'QR Estático' : 'QR Dinâmico'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID da Loja:</span>
                  <span className="font-mono text-xs break-all">
                    {payment.storeId ? `${payment.storeId.slice(0, 8)}...` : <span className="text-red-500">sem informação</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span>{format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <StatusBadge status={payment.status} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  leftIcon={<Eye className="h-4 w-4" />}
                >
                  Ver Detalhes
                </Button>
                {payment.status === PaymentStatus.RECEIPT_SENT && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatusMutation.mutate({ id: payment.id, status: PaymentStatus.APPROVED });
                      }}
                      isLoading={updateStatusMutation.isLoading}
                      leftIcon={<CheckCircle className="h-4 w-4" />}
                    >
                      Aprovar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatusMutation.mutate({ id: payment.id, status: PaymentStatus.REJECTED });
                      }}
                      isLoading={updateStatusMutation.isLoading}
                      leftIcon={<XCircle className="h-4 w-4" />}
                    >
                      Rejeitar
                    </Button>
                  </>
                )}
              </div>
            </CardItem>
          ))
        )}
      </div>

      {data && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.total}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {selectedPayment && (
        <PaymentsModal
          payment={selectedPayment}
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}