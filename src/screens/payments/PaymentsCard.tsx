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
import { Payment, PaymentStatus } from '../../models/types';
import paymentRepository from '../../repository/payment-repository';
import { formatCurrency } from '../../utils/format';
import { toast } from 'sonner';

export default function PaymentsCard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    userId: '',
    name: '',
    email: '',
  });
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const queryClient = useQueryClient();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  const updateStatusMutation = useMutation(
    (params: { id: string; status: PaymentStatus }) => 
      paymentRepository.updatePaymentStatus(params.id, params.status),
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

  // Função estável com useCallback para evitar recriar em cada renderização
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
      };
      
      // Atualizando apenas as propriedades fornecidas
      if (newFilters.status) updatedFilters.status = newFilters.status;
      if (newFilters.userId) updatedFilters.userId = newFilters.userId;
      if (newFilters.dateRangeFrom) updatedFilters.dateFrom = newFilters.dateRangeFrom;
      if (newFilters.dateRangeTo) updatedFilters.dateTo = newFilters.dateRangeTo;
      if (newFilters.name) updatedFilters.name = newFilters.name;
      if (newFilters.email) updatedFilters.email = newFilters.email;
      
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

  // Garantir que o estado de filtragem seja limpo após a conclusão de qualquer operação
  useEffect(() => {
    if (!isLoading) {
      setIsFiltering(false);
    }
  }, [isLoading]);

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
        ) : data?.data.length === 0 ? (
          <div className="col-span-full flex items-center justify-center p-8 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground">Nenhum pagamento encontrado.</p>
          </div>
        ) : (
          data?.data.map((payment) => (
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
                  <span className="text-muted-foreground">Nome:</span>
                  <span>{(() => {
                    const user = (payment as any).User;
                    if (user) {
                      const firstName = user.firstName || '';
                      const lastName = user.lastName || '';
                      return [firstName, lastName].filter(Boolean).join(' ') || 'Não informado';
                    }
                    return 'Não informado';
                  })()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{(payment as any).User?.email || payment.email || 'Não informado'}</span>
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
                        updateStatusMutation.mutate({ id: payment.id, status: PaymentStatus.COMPLETED });
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
          totalItems={data.pagination.total}
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