import apiClient from '../datasource/api-client';
import { PaginatedResponse, PaymentQueryParams, Payment, PaymentStatus } from '../models/types';

class PaymentRepository {
  async getPayments(params?: PaymentQueryParams): Promise<PaginatedResponse<Payment>> {
    // Garantir que o parâmetro é um objeto
    const safeParams = params || {};
    
    // Remover propriedades vazias ou indefinidas dos parâmetros
    const cleanParams = Object.fromEntries(
      Object.entries(safeParams).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );
    
    console.log("Parâmetros da requisição de pagamentos:", cleanParams);
    
    // Garantir que sempre incluímos paginação básica mesmo que os filtros estejam vazios
    if (!cleanParams.page) {
      cleanParams.page = 1;
    }
    
    if (!cleanParams.limit) {
      cleanParams.limit = 10;
    }
    
    if (!cleanParams.orderBy) {
      cleanParams.orderBy = 'createdAt';
      cleanParams.order = 'desc';
    }
    
    return apiClient.get<PaginatedResponse<Payment>>('/payments', { 
      params: cleanParams 
    });
  }

  async getPaymentById(id: string): Promise<Payment> {
    return apiClient.get<Payment>(`/payments/${id}`);
  }

  async updatePaymentStatus(id: string, status: PaymentStatus, notes?: string): Promise<Payment> {
    return apiClient.put<Payment>(`/payments/${id}/status`, { status, notes });
  }

  async uploadReceipt(id: string, receipt: string): Promise<Payment> {
    return apiClient.post<Payment>(`/payments/${id}/receipt`, { receipt });
  }

  async checkQrStatus(qrCodeId: string): Promise<{ status: string; updatedAt: string }> {
    return apiClient.get<{ status: string; updatedAt: string }>(`/payments/status/qr/${qrCodeId}`);
  }

  async createDynamicQr(paymentData: {
    userId: string;
    amount: number;
    walletType: string;
    walletAddress: string;
    email?: string;
    transactionType: 'dinamic';
    receivingMode: string;
    observation?: string;
    referenceId?: string;
    dueDate?: string;
    description?: string;
  }): Promise<Payment> {
    return apiClient.post<Payment>('/payments/dynamic-qr', paymentData);
  }

  async createStaticQr(paymentData: {
    userId: string;
    amount: number;
    walletType: string;
    walletAddress: string;
    email?: string;
    transactionType: 'static';
    receivingMode: string;
    observation?: string;
    referenceId?: string;
    dueDate?: string;
    description?: string;
  }): Promise<Payment> {
    return apiClient.post<Payment>('/payments/static-qr', paymentData);
  }
}

export default new PaymentRepository();