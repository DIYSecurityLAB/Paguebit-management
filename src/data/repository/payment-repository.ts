import { apiDataSource } from "../datasource/api.datasource";
import type {
  PaymentModel,
  AdminListPaymentsReq,
  AdminListPaymentsRes,
  AdminUpdatePaymentStatusReq,
  AdminUpdatePaymentStatusRes,
} from "../model/payment.model";

export class PaymentRepository {
  async listPayments(params?: AdminListPaymentsReq): Promise<AdminListPaymentsRes> {
    return await apiDataSource.get<AdminListPaymentsRes>(
      '/admin/payments',
      { params }
    );
  }

  async getPaymentById(id: string): Promise<PaymentModel> {
    return await apiDataSource.get<PaymentModel>(
      `/admin/payments/${id}`
    );
  }

  async updatePaymentStatus(id: string, data: AdminUpdatePaymentStatusReq): Promise<PaymentModel> {
    return await apiDataSource.patch<AdminUpdatePaymentStatusRes>(
      `/admin/payments/${id}/status`,
      data
    );
  }
}
  