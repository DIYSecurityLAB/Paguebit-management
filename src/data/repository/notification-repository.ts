import apiClient from '../datasource/api.datasource';
import type {
  ListNotificationsReq,
  ListNotificationsRes,
  CreateNotificationReq,
  CreateNotificationRes
} from '../model/notification.model';

class NotificationRepository {
  async listNotifications(params?: ListNotificationsReq): Promise<ListNotificationsRes> {
    return apiClient.get<ListNotificationsRes>('/admin/notifications', { params });
  }

  async createNotification(storeId: string, data: CreateNotificationReq): Promise<CreateNotificationRes> {
    return apiClient.post<CreateNotificationRes>(`/admin/stores/${storeId}/notifications`, data);
  }
}

export default new NotificationRepository();