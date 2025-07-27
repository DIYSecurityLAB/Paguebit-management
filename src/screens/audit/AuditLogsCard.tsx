import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { 
  Eye, User, Package, CreditCard, Bell, Clock, 
  ChevronUp, ChevronDown, Info, ArrowUpDown
} from 'lucide-react';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import Select from '../../components/Select';
import { AuditLog } from '../../data/models/types';
import auditRepository, { AuditLogQueryParams } from '../../data/repository/audit-repository';
import AuditLogDetailModal from './AuditLogDetailModal';

export default function AuditLogsCard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<AuditLogQueryParams>({
    userId: '',
    paymentId: '',
    affectedUserId: '',
    withdrawalId: '',
    notificationId: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  });
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  
  const { data, isLoading, error } = useQuery(
    ['auditLogs', currentPage, itemsPerPage, filters, orderBy, orderDirection],
    () => auditRepository.listAuditLogs({
      ...filters,
      page: currentPage,
      limit: itemsPerPage,
      // @ts-expect-error: orderBy
      orderBy,
      order: orderDirection,
    }),
    {
      keepPreviousData: true,
      onSettled: () => {
        setIsFiltering(false);
      }
    }
  );

  const filterOptions = useMemo(() => [
    {
      key: 'userId',
      label: 'ID do Usuário',
      type: 'text' as const,
      placeholder: 'ID do usuário que realizou a ação',
    },
    {
      key: 'action',
      label: 'Ação',
      type: 'text' as const,
      placeholder: 'Tipo de ação realizada',
    },
    {
      key: 'paymentId',
      label: 'ID do Pagamento',
      type: 'text' as const,
      placeholder: 'ID do pagamento afetado',
    },
    {
      key: 'withdrawalId',
      label: 'ID do Saque',
      type: 'text' as const,
      placeholder: 'ID do saque afetado',
    },
    {
      key: 'affectedUserId',
      label: 'ID do Usuário Afetado',
      type: 'text' as const,
      placeholder: 'ID do usuário afetado',
    },
    {
      key: 'notificationId',
      label: 'ID da Notificação',
      type: 'text' as const,
      placeholder: 'ID da notificação',
    },
    {
      key: 'storeId',
      label: 'ID da Loja',
      type: 'text' as const,
      placeholder: 'ID da loja',
    },
    {
      key: 'performedBy',
      label: 'Realizado por',
      type: 'text' as const,
      placeholder: 'ID do usuário que realizou',
    },
    {
      key: 'id',
      label: 'ID do Log',
      type: 'text' as const,
      placeholder: 'ID do log',
    },
    {
      key: 'previousValue',
      label: 'Valor Anterior',
      type: 'text' as const,
      placeholder: 'Valor anterior (JSON)',
    },
    {
      key: 'newValue',
      label: 'Novo Valor',
      type: 'text' as const,
      placeholder: 'Novo valor (JSON)',
    },
    {
      key: 'dateRange',
      label: 'Período',
      type: 'daterange' as const,
    },
  ], []);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setIsFiltering(true);

    // Mapeia os filtros para os nomes esperados pelo backend
    const updatedFilters: AuditLogQueryParams = {
      userId: newFilters.userId || '',
      paymentId: newFilters.paymentId || '',
      affectedUserId: newFilters.affectedUserId || '',
      withdrawalId: newFilters.withdrawalId || '',
      notificationId: newFilters.notificationId || '',
      storeId: newFilters.storeId || '',
      action: newFilters.action || '',
      performedBy: newFilters.performedBy || '',
      id: newFilters.id || '',
      previousValue: newFilters.previousValue || '',
      newValue: newFilters.newValue || '',
      createdAtFrom: newFilters.dateRangeFrom || '',
      createdAtTo: newFilters.dateRangeTo || '',
      dateFrom: '',
      dateTo: '',
    };

    setFilters(updatedFilters);
    setCurrentPage(1);
  }, []);

  // Ícones para diferentes tipos de logs
  const getLogIcon = (log: AuditLog) => {
    if (log.paymentId) return <CreditCard className="h-5 w-5 text-blue-500" />;
    if (log.withdrawalId) return <Package className="h-5 w-5 text-purple-500" />;
    if (log.affectedUserId) return <User className="h-5 w-5 text-green-500" />;
    if (log.notificationId) return <Bell className="h-5 w-5 text-yellow-500" />;
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

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
      icon: <Clock className="h-4 w-4 text-purple-500" /> 
    },
    { 
      value: 'createdAt-asc', 
      label: 'Mais antigos', 
      icon: <Clock className="h-4 w-4 text-blue-500" /> 
    },
    { 
      value: 'action-asc', 
      label: 'Ação (A-Z)', 
      icon: <Info className="h-4 w-4 text-green-500" /> 
    },
    { 
      value: 'action-desc', 
      label: 'Ação (Z-A)', 
      icon: <Info className="h-4 w-4 text-red-500" /> 
    }
  ];

  // Limpar o estado de filtragem quando a operação for concluída
  useEffect(() => {
    if (!isLoading) {
      setIsFiltering(false);
    }
  }, [isLoading]);

  const tableColumns = useMemo(() => [
    // ...existing code...
  ], []);

  // Adicionar suporte para mostrar campos novos e remover os que não existem mais
  const renderLogCard = (log: AuditLog) => (
    <div
      key={log.id}
      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedLog(log)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-muted p-2 rounded-full flex-shrink-0">
            {getLogIcon(log)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">
              {log.createdAt instanceof Date
                ? format(log.createdAt, 'dd/MM/yyyy HH:mm:ss')
                : (typeof log.createdAt === 'string' && log.createdAt.length > 0
                  ? (() => { try { return format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss'); } catch { return '-'; } })()
                  : '-')}
            </div>
            <div className="font-semibold text-sm mb-1 truncate">
              {log.action}
            </div>
            <div className="mb-1">
              {log.user ? (
                <div className="flex flex-col">
                  <span className="text-sm">{log.user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{log.user.email}</span>
                </div>
              ) : (
                <span className="font-mono text-xs truncate">{log.userId}</span>
              )}
            </div>
            {/* Campos novos: storeId, whitelabelId, performedBy */}
            <div className="text-xs text-muted-foreground mb-1">
              {log.storeId && <span>Loja: {log.storeId.substring(0, 8)}... </span>}
              {log.whitelabelId && <span>Whitelabel: {log.whitelabelId.substring(0, 8)}... </span>}
              {log.performedBy && <span>Por: {log.performedBy.substring(0, 8)}... </span>}
            </div>
            {/* Alvo do log */}
            {(log.paymentId || log.withdrawalId || log.notificationId) && (
              <div className="text-xs text-muted-foreground mt-2 truncate">
                {log.paymentId && (
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    <span>Pagamento: {log.paymentId.substring(0, 8)}...</span>
                  </div>
                )}
                {log.withdrawalId && (
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>Saque: {log.withdrawalId.substring(0, 8)}...</span>
                  </div>
                )}
                {log.notificationId && (
                  <div className="flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    <span>Notificação: {log.notificationId.substring(0, 8)}...</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLog(log);
            }}
            leftIcon={<Eye className="h-4 w-4" />}
          >
            Ver
          </Button>
        </div>
      </div>
    </div>
  );

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

      {/* Cards de logs */}
      <div className="grid grid-cols-1 gap-4">
        {(isLoading || isFiltering) ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-32 bg-card rounded-lg"></div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-1 text-center p-6 bg-card rounded-lg border border-border">
            <p className="text-status-rejected">Erro ao carregar os logs. Tente novamente.</p>
          </div>
        ) : data?.data?.length ? (
          data.data.map(renderLogCard)
        ) : (
          <div className="col-span-1 text-center p-6 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">Nenhum log encontrado.</p>
          </div>
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

      {selectedLog && (
        <AuditLogDetailModal
          log={selectedLog}
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
