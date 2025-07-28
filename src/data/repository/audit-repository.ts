import { apiDataSource } from "../datasource/api.datasource";
import type {
  AuditLogModel,
  AdminListAuditLogsReq,
  AdminListAuditLogsRes,
} from "../model/audit.model";

export type AuditLogQueryParams = AdminListAuditLogsReq;

const auditRepository = {
  async listAuditLogs(params?: AdminListAuditLogsReq): Promise<AdminListAuditLogsRes> {
    return await apiDataSource.get<AdminListAuditLogsRes>(
      '/admin/audit-logs',
      { params }
    );
  },

  async getAuditLogById(id: string): Promise<AuditLogModel> {
    return await apiDataSource.get<AuditLogModel>(
      `/admin/audit-logs/${id}`
    );
  }
};

export default auditRepository;
