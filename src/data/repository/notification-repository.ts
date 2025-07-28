import { apiDataSource } from '../datasource/api.datasource';
import type {
  ListNotificationsReq,
  ListNotificationsRes,
  CreateNotificationReq,
  CreateNotificationRes,
} from '../model/notification.model';

class NotificationRepository {
  async listNotifications(params?: ListNotificationsReq): Promise<ListNotificationsRes> {
    return apiDataSource.get<ListNotificationsRes>('/admin/notifications', { params });
  }

  async createNotification(storeId: string, data: CreateNotificationReq): Promise<CreateNotificationRes> {
    return apiDataSource.post<CreateNotificationRes>(`/admin/stores/${storeId}/notifications`, data);
  }
}

export default new NotificationRepository();