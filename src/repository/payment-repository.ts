import apiClient from '../datasource/api-client';
import { PaginatedResponse, PaymentQueryParams, Payment, PaymentStatus, AuditLogInput } from '../models/types';
import auditRepository from './audit-repository';

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
    
    // Se payerName for fornecido, use o endpoint genérico de atualização
    if (payerName !== undefined) {
      return this.updatePayment(id, { ...body, payerName });
    }
    
    // Caso contrário, use o endpoint específico de status
    console.log('Corpo da requisição (status):', body);
    const result = await apiClient.put<Payment>(`/payments/${id}/status`, body);

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

    return result;
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