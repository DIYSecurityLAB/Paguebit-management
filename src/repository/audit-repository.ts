import apiClient from '../datasource/api-client';
import { AuditLog, AuditLogInput } from '../models/types';

export interface AuditLogQueryParams {
  userId?: string;
  paymentId?: string;
  affectedUserId?: string;
  withdrawalId?: string;
  notificationId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt';
  order?: 'asc' | 'desc';
}

class AuditRepository {
  async createAuditLog(data: AuditLogInput): Promise<any> {
    return apiClient.post('/audit', data);
  }

  async listAuditLogs(params?: AuditLogQueryParams): Promise<{ data: AuditLog[]; pagination: { total: number; page: number; limit: number } }> {
    // Remove filtros vazios
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== '' && v !== undefined && v !== null))
      : {};
    return apiClient.get('/audit', { params: cleanParams });
  }
}

export default new AuditRepository();
