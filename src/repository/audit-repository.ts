import apiClient from '../datasource/api-client';
import { AuditLog } from '../models/types';

export interface AuditLogQueryParams {
  userId?: string;
  paymentId?: string;
  affectedUserId?: string;
  withdrawalId?: string;
  notificationId?: string;
  storeId?: string;
  action?: string;
  performedBy?: string;
  id?: string;
  previousValue?: string;
  newValue?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt';
  order?: 'asc' | 'desc';
}

class AuditRepository {
  async listAuditLogs(params?: AuditLogQueryParams): Promise<{ data: AuditLog[]; pagination: { total: number; page: number; limit: number } }> {
    // Remove filtros vazios ou string vazia
    const cleanParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(([_, v]) =>
            v !== undefined && v !== null && v !== ''
          )
        )
      : {};
    // GET na rota /admin/audit-logs
    const { data } = await apiClient.get<{ data: AuditLog[]; pagination: { total: number; page: number; limit: number } }>('/admin/audit-logs', { params: cleanParams });
    return data;
  }

  async getAuditLogById(id: string): Promise<AuditLog> {
    // GET na rota /admin/audit-logs/:id
    const { data } = await apiClient.get<AuditLog>(`/admin/audit-logs/${id}`);
    return data;
  }
}

export default new AuditRepository();
