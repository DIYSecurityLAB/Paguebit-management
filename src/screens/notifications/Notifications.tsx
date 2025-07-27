import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Bell, 
  Filter, 
  ChevronDown, 
  Search, 
  LayoutGrid, 
  Table as TableIcon, 
  PlusCircle, 
  AlertCircle,
  Calendar,
  Clock,
  History,
  Send
} from 'lucide-react';
import { NotifyModel } from '../../data/models/types';
import NotificationsTable from './NotificationsTable';
import NotificationModal from './NotificationModal';
import notificationRepository from '../../data/repository/notification-repository';
import Button from '../../components/Button';
import SendNotification from './SendNotification';

type TabType = 'history' | 'send';

export default function Notifications() {
  // Estado para controlar as abas
  const [activeTab, setActiveTab] = useState<TabType>('history');
  
  // Estados para controle da interface
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotifyModel | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    storeId: undefined as string | undefined,
    type: undefined as string | undefined,
    read: undefined as boolean | undefined,
    search: undefined as string | undefined
  });

  // Carregar notificações
  const { data, isLoading, refetch } = useQuery(
    ['notifications', filters],
    () => notificationRepository.getAllNotifications(filters),
    {
      keepPreviousData: true,
      enabled: activeTab === 'history',
    }
  );

  const notifications = data?.notifications || [];
  
  // Função para aplicar filtros
  const applyFilters = (newFilters: typeof filters) => {
    setFilters({
      ...filters,
      ...newFilters,
      page: 1 // Retorna para a primeira página ao aplicar filtros
    });
    setShowFilters(false);
  };

  // Função para redefinir filtros
  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      storeId: undefined,
      type: undefined,
      read: undefined,
      search: undefined
    });
    setShowFilters(false);
  };

  // Função para trocar de página
  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil((notifications.length || 0) / filters.limit);
    if (newPage < 1 || (totalPages > 0 && newPage > totalPages)) return;
    
    setFilters({
      ...filters,
      page: newPage
    });
  };

  // Função para formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };

  // Função para visualizar detalhes da notificação
  const handleViewNotificationDetails = (notification: NotifyModel) => {
    setSelectedNotification(notification);
    setIsDetailModalOpen(true);
  };

  // Renderização do componente grid de notificações
  const renderNotificationGrid = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64 bg-card rounded-lg border border-border">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!notifications || notifications.length === 0) {
      return (
        <div className="p-8 text-center bg-card rounded-lg border border-border">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-background">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-foreground">Nenhuma notificação encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Não existem notificações com os filtros selecionados.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className="bg-card border border-border rounded-lg shadow-sm overflow-hidden hover:border-primary transition-colors"
            onClick={() => handleViewNotificationDetails(notification)}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-foreground line-clamp-1">{notification.title}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  notification.read
                    ? "bg-muted text-muted-foreground"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {notification.read ? "Lida" : "Não lida"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{notification.message}</p>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="capitalize">{notification.type}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(notification.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderização do histórico de notificações
  const renderNotificationsHistory = () => {
    return (
      <>
        {/* Ferramentas e filtros */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg ${
                viewMode === 'table' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <TableIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="h-4 w-4" />}
                rightIcon={<ChevronDown className="h-4 w-4" />}
              >
                Filtros
              </Button>

              {/* Dropdown de filtros */}
              {showFilters && (
                <div className="absolute left-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-lg z-10 p-4">
                  <h3 className="font-medium text-foreground mb-3">Filtrar Notificações</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Tipo</label>
                      <select
                        value={filters.type || ""}
                        onChange={(e) => setFilters(prev => ({...prev, type: e.target.value || undefined }))}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md"
                      >
                        <option value="">Todos os tipos</option>
                        <option value="info">Informação</option>
                        <option value="alert">Alerta</option>
                        <option value="warning">Aviso</option>
                        <option value="success">Sucesso</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Status de leitura</label>
                      <select
                        value={filters.read === undefined ? "" : String(filters.read)}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFilters(prev => ({
                            ...prev,
                            read: value === "" ? undefined : value === "true"
                          }));
                        }}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md"
                      >
                        <option value="">Todos</option>
                        <option value="true">Lidas</option>
                        <option value="false">Não lidas</option>
                      </select>
                    </div>

                    <div className="flex justify-between pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                      >
                        Resetar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => applyFilters(filters)}
                      >
                        Aplicar Filtros
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar notificação..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-background border border-input rounded-lg"
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({
                  ...prev,
                  search: value.trim() === "" ? undefined : value
                }));
              }}
            />
          </div>
        </div>

        {/* Conteúdo principal - Tabela ou Grid */}
        {viewMode === 'table' ? (
          <NotificationsTable />
        ) : (
          renderNotificationGrid()
        )}

        {/* Paginação para modo grid */}
        {viewMode === 'grid' && notifications.length > 0 && (
          <div className="mt-6 bg-card rounded-lg overflow-hidden border border-border">
            <div className="px-4 py-4 flex flex-wrap items-center justify-between">
              <div className="flex justify-between w-full sm:w-auto mb-2 sm:mb-0">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page * filters.limit >= notifications.length}
                  className="ml-2"
                >
                  Próximo
                </Button>
              </div>
              <div className="w-full sm:w-auto text-center sm:text-left">
                <p className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium">{Math.min((filters.page - 1) * filters.limit + 1, notifications.length)}</span> a{" "}
                  <span className="font-medium">{Math.min(filters.page * filters.limit, notifications.length)}</span> de{" "}
                  <span className="font-medium">{notifications.length}</span> resultados
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-6">Notificações</h1>
        
        {/* Abas de navegação */}
        <div className="border-b border-border mb-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2 font-medium text-base flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground transition-colors'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico de Notificações
            </button>
            <button
              onClick={() => setActiveTab('send')}
              className={`pb-2 font-medium text-base flex items-center gap-2 ${
                activeTab === 'send'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground transition-colors'
              }`}
            >
              <Send className="w-4 h-4" />
              Enviar Notificação
            </button>
          </div>
        </div>
        
        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'history' ? (
          renderNotificationsHistory()
        ) : (
          <SendNotification />
        )}
      </div>

      {/* Modal de detalhes da notificação */}
      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
}