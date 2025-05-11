import { format } from 'date-fns';
import Modal from '../../components/Modal';
import { NotifyModel } from '../../models/types';

interface NotificationModalProps {
  notification: NotifyModel;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({
  notification,
  isOpen,
  onClose,
}: NotificationModalProps) {
  // Função de formatação de data com tratamento para string vazia ou undefined
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return "Data inválida";
    }
  };

  return (
    <Modal
      title="Notification Details"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Title</label>
          <p className="font-medium">{notification.title}</p>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Message</label>
          <p className="mt-1 text-foreground whitespace-pre-wrap">{notification.message}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Type</label>
            <p className="font-medium capitalize">{notification.type}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Status</label>
            <p className={`font-medium ${notification.read ? 'text-status-completed' : 'text-status-pending'}`}>
              {notification.read ? 'Read' : 'Unread'}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Created At</label>
            <p className="font-medium">
              {formatDate(notification.createdAt)}
            </p>
          </div>
          {notification.readAt && (
            <div>
              <label className="text-sm text-muted-foreground">Read At</label>
              <p className="font-medium">
                {formatDate(notification.readAt)}
              </p>
            </div>
          )}
        </div>

        {notification.referenceId && (
          <div>
            <label className="text-sm text-muted-foreground">Reference ID</label>
            <p className="font-medium">{notification.referenceId}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}