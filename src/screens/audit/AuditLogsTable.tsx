import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { Eye, User, Package, CreditCard, Bell, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import Table, { TableColumn } from '../../components/Table';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import { AuditLog } from '../../data/models/types';
import auditRepository, { AuditLogQueryParams } from '../../data/repository/audit-repository';
import AuditLogDetailModal from './AuditLogDetailModal';

export default function AuditLogsTable() {
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
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const { data, isLoading } = useQuery(
    ['auditLogs', currentPage, itemsPerPage, filters],
    () => auditRepository.listAuditLogs({
      ...filters,
      page: currentPage,
      limit: itemsPerPage,
      orderBy: 'createdAt' as 'createdAt', // Especificar tipo explicitamente
      order: 'desc',
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
    if (log.paymentId) return <CreditCard className="h-4 w-4 text-blue-500" />;
    if (log.withdrawalId) return <Package className="h-4 w-4 text-purple-500" />;
    if (log.affectedUserId) return <User className="h-4 w-4 text-green-500" />;
    if (log.notificationId) return <Bell className="h-4 w-4 text-yellow-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const tableColumns = useMemo<TableColumn<AuditLog>[]>(() => [
    {
      header: 'Tipo',
      accessor: (log) => (
        <div className="flex items-center justify-center">
          {getLogIcon(log)}
        </div>
      ),
    },
    {
      header: 'Data/Hora',
      accessor: (log) => {
        // Aceita Date, string ou null
        if (log.createdAt instanceof Date) {
          return format(log.createdAt, 'dd/MM/yyyy HH:mm:ss');
        }
        if (typeof log.createdAt === 'string' && log.createdAt.length > 0) {
          try {
            return format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss');
          } catch {
            return '-';
          }
        }
        return '-';
      },
    },
    {
      header: 'Usuário',
      accessor: (log) => (
        <div className="flex flex-col">
          {log.user ? (
            <>
              <span className="font-medium">{log.user.name}</span>
              <span className="text-xs text-muted-foreground">{log.user.email}</span>
            </>
          ) : (
            <span className="font-mono text-xs">{log.userId}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Ação',
      accessor: (log) => (
        <span className="font-medium">{log.action}</span>
      ),
    },
    {
      header: 'Alvo',
      accessor: (log) => {
        if (log.paymentId) return `Pagamento: ${log.paymentId.substring(0, 8)}...`;
        if (log.withdrawalId) return `Saque: ${log.withdrawalId.substring(0, 8)}...`;
        if (log.affectedUserId) {
          return log.affectedUser 
            ? `${log.affectedUser.name} (${log.affectedUser.email})`
            : `Usuário: ${log.affectedUserId.substring(0, 8)}...`;
        }
        if (log.notificationId) return `Notificação: ${log.notificationId.substring(0, 8)}...`;
        return '-';
      },
    },
    {
      header: 'Ações',
      accessor: (log) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedLog(log)}
          leftIcon={<Eye className="h-4 w-4" />}
        >
          Detalhes
        </Button>
      ),
    },
  ], []);

  // Limpar o estado de filtragem quando a operação for concluída
  useEffect(() => {
    if (!isLoading) {
      setIsFiltering(false);
    }
  }, [isLoading]);

  return (
    <div className="space-y-4">
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

      <Table
        data={data?.data || []}
        columns={tableColumns}
        isLoading={isLoading || isFiltering}
      />

      {/* Corrige erro de leitura de total quando não há dados */}
      {data && data.pagination && typeof data.pagination.total === 'number' ? (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.pagination.total}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      ) : (
        <div className="text-center text-muted-foreground py-4">
          Nenhum log encontrado.
        </div>
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
