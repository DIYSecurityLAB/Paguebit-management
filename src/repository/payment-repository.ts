import apiClient from '../datasource/api-client';
import { PaginatedResponse, PaymentQueryParams, Payment, PaymentStatus } from '../models/types';

class PaymentRepository {
  async getPayments(params?: PaymentQueryParams & { storeId?: string }): Promise<PaginatedResponse<Payment>> {
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
    
    try {
      const { data } = await apiClient.get<any>('/admin/payments', { params: cleanParams });
      // Adapta o formato do backend para o frontend
      if (data && Array.isArray(data.data) && typeof data.total === 'number') {
        return {
          data: data.data,
          pagination: {
            total: data.total,
            page: data.page || 1,
            limit: data.limit || 10
          }
        };
      }
      // fallback para formato antigo
      if (data && data.data && data.pagination) {
        return data;
      }
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10 }
      };
    } catch (err) {
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10 }
      };
    }
  }

  async getPaymentById(id: string): Promise<Payment> {
    const { data } = await apiClient.get<Payment>(`/admin/payments/${id}`);
    return data;
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    notes?: string,
    payerName?: string,
    userId?: string, // Novo parâmetro para auditoria
    previousStatus?: string // Para logar o valor anterior
  ): Promise<Payment> {
    // Preparar o corpo da requisição com todos os dados necessários
    const body: Record<string, any> = { status };
    
    // Adicionar notes apenas se fornecido
    if (notes !== undefined) {
      body.notes = notes;
    }
    
    // PATCH na nova rota de admin
    const { data } = await apiClient.patch<Payment>(`/admin/payments/${id}/status`, body);

    return data;
  }

  // Novo método para atualização genérica
  async updatePayment(id: string, data: Record<string, any>, currentUserId?: string, previousPayment?: Payment): Promise<Payment> {
    console.log(`Atualizando pagamento completo ID: ${id}`, data);
    const result = await apiClient.put<Payment>(`/payments/${id}`, data);
    return result;
  }

  async uploadReceipt(id: string, receipt: string, currentUserId?: string): Promise<Payment> {
    const result = await apiClient.post<Payment>(`/payments/${id}/receipt`, { receipt });
    return result;
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
  }, currentUserId?: string): Promise<Payment> {
    const result = await apiClient.post<Payment>('/payments/dynamic-qr', paymentData);
    return result;
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
  }, currentUserId?: string): Promise<Payment> {
    const result = await apiClient.post<Payment>('/payments/static-qr', paymentData);
    return result;
  }
}

export default new PaymentRepository();