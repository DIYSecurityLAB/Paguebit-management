import { useState } from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import Table from '../../components/Table';
 import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import NotificationModal from './NotificationModal';
import { NotificationModel } from '../../data/model/notification.model';
import { StoreModel } from '../../data/model/store.model';
import notificationRepository from '../../data/repository/notification-repository';
import { StoreRepository } from '../../data/repository/store-repository';

export default function NotificationsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedNotification, setSelectedNotification] = useState<NotificationModel | null>(null);

  const { data, isLoading } = useQuery(
    ['notifications', currentPage, itemsPerPage],
    () => notificationRepository.listNotifications({
      page: currentPage,
      limit: itemsPerPage,
      orderBy: 'createdAt',
      order: 'desc',
    }),
    {
      keepPreviousData: true,
    }
  );

  // Buscar todas as lojas para montar o mapa id->nome usando o novo StoreRepository
  const { data: storesData } = useQuery(
    ['stores', 'all'],
    () => new StoreRepository().listStores({ limit: String(100) }),
    { staleTime: 60000 }
  );
  const stores = Array.isArray(storesData?.data) ? storesData.data : [];
  const storeMap = stores.reduce<Record<string, string>>((acc, store: StoreModel) => {
    acc[store.id] = store.name || store.id;
    return acc;
  }, {});

  const notifications = data?.data || [];
  const totalItems = data?.total || 0;

  const columns = [
    {
      header: 'Title',
      accessor: (notification: NotificationModel) => notification.title || 'Sem título',
    },
    {
      header: 'Type',
      accessor: (notification: NotificationModel) => (
        <span className="capitalize">{notification.type}</span>
      ),
    },
    {
      header: 'Store',
      accessor: (notification: NotificationModel) =>
        storeMap[notification.storeId ?? ''] || notification.storeId || 'N/A',
    },
    {
      header: 'Read',
      accessor: (notification: NotificationModel) => (
        <span className={notification.read ? 'text-status-completed' : 'text-status-pending'}>
          {notification.read ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      header: 'Created At',
      accessor: (notification: NotificationModel) => 
        notification.createdAt ? format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A',
    },
    {
      header: 'Actions',
      accessor: (notification: NotificationModel) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedNotification(notification)}
          leftIcon={<Eye className="h-4 w-4" />}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Table
        data={notifications}
        columns={columns}
        isLoading={isLoading}
      />

      {notifications.length > 0 && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          isOpen={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </div>
  );
}