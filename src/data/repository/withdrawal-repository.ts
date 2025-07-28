import { apiDataSource } from "../datasource/api.datasource";
import {
  WithdrawalModel,
  AdminListWithdrawalsReq,
  AdminListWithdrawalsRes,
  AdminUpdateWithdrawalStatusReq,
  AdminUpdateWithdrawalStatusRes,
} from "../model/withdrawal.model";

export class WithdrawalRepository {
 

  async listWithdrawals(params?: AdminListWithdrawalsReq): Promise<AdminListWithdrawalsRes> {
    return await apiDataSource.get<AdminListWithdrawalsRes>('/admin/withdrawals', { params });
  }

  async getWithdrawalById(id: string): Promise<WithdrawalModel> {
    return await apiDataSource.get<WithdrawalModel>(`/admin/withdrawals/${id}`);
  }

  async updateWithdrawalStatus(id: string, data: AdminUpdateWithdrawalStatusReq): Promise<WithdrawalModel> {
    return await apiDataSource.patch<AdminUpdateWithdrawalStatusRes>(`/admin/withdrawals/${id}/status`, data);
  }
}
