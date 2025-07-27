 
export type NotificationModel = {
  id: string;
  storeId?: string;
  whitelabelId?: string;
  title: string;
  content: string;
  type: string;
  referenceId?: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type ListNotificationsReq = {
  storeId?: string;
  whitelabelId?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
};

export type ListNotificationsRes = {
  data: NotificationModel[];
  total: number;
  page: number;
  limit: number;
};

export type CreateNotificationReq = {
  title: string;
  content: string;
  type: string;
  referenceId?: string;
};

export type CreateNotificationRes = NotificationModel;