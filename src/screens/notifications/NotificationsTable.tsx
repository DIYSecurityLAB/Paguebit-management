import { useState } from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import Table from '../../components/Table';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import NotificationModal from './NotificationModal';
import { NotifyModel } from '../../models/types';
import notificationRepository from '../../repository/notification-repository';

export default function NotificationsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedNotification, setSelectedNotification] = useState<NotifyModel | null>(null);

  const { data, isLoading } = useQuery(
    ['notifications', currentPage, itemsPerPage],
    () => notificationRepository.getAllNotifications({
      page: currentPage,
      limit: itemsPerPage,
      orderBy: 'createdAt',
      order: 'desc',
    }),
    {
      keepPreviousData: true,
    }
  );

  const notifications = data?.notifications || [];
  const totalItems = notifications.length || 0;

  const columns = [
    {
      header: 'Title',
      accessor: (notification: NotifyModel) => notification.title || 'Sem título',
    },
    {
      header: 'Type',
      accessor: (notification: NotifyModel) => (
        <span className="capitalize">{notification.type}</span>
      ),
    },
    {
      header: 'Read',
      accessor: (notification: NotifyModel) => (
        <span className={notification.read ? 'text-status-completed' : 'text-status-pending'}>
          {notification.read ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      header: 'Created At',
      accessor: (notification: NotifyModel) => 
        notification.createdAt ? format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A',
    },
    {
      header: 'Actions',
      accessor: (notification: NotifyModel) => (
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