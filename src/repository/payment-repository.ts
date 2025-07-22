import apiClient from '../datasource/api-client';
import { PaginatedResponse, PaymentQueryParams, Payment, PaymentStatus, AuditLogInput } from '../models/types';
import auditRepository from './audit-repository';

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

    // Enviar log de auditoria se userId estiver presente
    if (userId) {
      const auditLog: AuditLogInput = {
        userId,
        action: `Alteração de status do pagamento`,
        paymentId: id,
        previousValue: previousStatus ? JSON.stringify({ status: previousStatus }) : undefined,
        newValue: JSON.stringify({ status }),
      };
      auditRepository.createAuditLog(auditLog).catch(() => {});
    }

    return data;
  }

  // Novo método para atualização genérica
  async updatePayment(id: string, data: Record<string, any>, currentUserId?: string, previousPayment?: Payment): Promise<Payment> {
    console.log(`Atualizando pagamento completo ID: ${id}`, data);
    const result = await apiClient.put<Payment>(`/payments/${id}`, data);
    if (currentUserId) {
      const audit: AuditLogInput = {
        userId: currentUserId,
        action: 'Atualização de pagamento',
        paymentId: id,
        previousValue: previousPayment ? JSON.stringify(previousPayment) : undefined,
        newValue: JSON.stringify(data),
      };
      auditRepository.createAuditLog(audit).catch(() => {});
    }
    return result;
  }

  async uploadReceipt(id: string, receipt: string, currentUserId?: string): Promise<Payment> {
    const result = await apiClient.post<Payment>(`/payments/${id}/receipt`, { receipt });
    if (currentUserId) {
      const audit: AuditLogInput = {
        userId: currentUserId,
        action: 'Upload de comprovante',
        paymentId: id,
        newValue: '[comprovante enviado]',
      };
      auditRepository.createAuditLog(audit).catch(() => {});
    }
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
    if (currentUserId) {
      const audit: AuditLogInput = {
        userId: currentUserId,
        action: 'Criação de pagamento dinâmico',
        paymentId: result.id,
        newValue: JSON.stringify(paymentData),
      };
      auditRepository.createAuditLog(audit).catch(() => {});
    }
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
    if (currentUserId) {
      const audit: AuditLogInput = {
        userId: currentUserId,
        action: 'Criação de pagamento estático',
        paymentId: result.id,
        newValue: JSON.stringify(paymentData),
      };
      auditRepository.createAuditLog(audit).catch(() => {});
    }
    return result;
  }
}

export default new PaymentRepository();