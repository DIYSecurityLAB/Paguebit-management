export interface AuditLogModel {
  id: string;
  action: string;
  userId?: string;
  paymentId?: string;
  withdrawalId?: string;
  notificationId?: string;
  affectedUserId?: string;
  storeId?: string;
  whitelabelId?: string;
  performedBy?: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string | Date;
  // Relacionamentos opcionais
  user?: {
    id: string;
    name: string;
    email: string;
  };
  affectedUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminListAuditLogsReq {
  userId?: string;
  paymentId?: string;
  withdrawalId?: string;
  notificationId?: string;
  affectedUserId?: string;
  storeId?: string;
  whitelabelId?: string;
  performedBy?: string;
  id?: string;
  previousValue?: string;
  newValue?: string;
  action?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  page?: number | string;
  limit?: number | string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface AdminListAuditLogsRes {
  data: AuditLogModel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
