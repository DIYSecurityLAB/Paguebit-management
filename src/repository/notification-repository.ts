import apiClient from '../datasource/api-client';
import { NotifyModel, PaginatedResponse, PaginationParams } from '../models/types';

// Interface para mapear a estrutura que o backend retorna
interface BackendNotification {
  id: string;
  type: string;
  title: string;
  content: string; // backend usa content em vez de message
  userId?: string;
  referenceId?: string;
  referenceType?: string;
  read?: boolean;
  readCount?: number;
  readAt?: string;
  createdAt: string;
}

// Tipos válidos para NotifyModel.type
type ValidNotificationType = 'info' | 'alert' | 'warning' | 'success';

class NotificationRepository {
  async getUserNotifications(userId: string, params?: PaginationParams & { 
    read?: string
  }): Promise<PaginatedResponse<NotifyModel>> {
    return apiClient.get<PaginatedResponse<NotifyModel>>(`/notifications/users/${userId}`, { params });
  }

  async markNotificationAsRead(id: string): Promise<NotifyModel> {
    return apiClient.put<NotifyModel>(`/notifications/${id}/read`, {});
  }

  async markAllUserNotificationsAsRead(userId: string): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/notifications/users/${userId}/read-all`, {});
  }

  async getGeneralNotifications(): Promise<{ notifications: NotifyModel[] }> {
    const response = await apiClient.get<BackendNotification[]>('/notifications/general');
    // Mapear os dados para o formato esperado pelo frontend
    const notifications = response.map(this.mapNotificationToModel);
    return { notifications };
  }

  async markGeneralNotificationsAsRead(notificationIds: string[], userId: string): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>('/notifications/general/read', { notificationIds, userId });
  }

  async getAllNotifications(params?: PaginationParams & { storeId?: string }): Promise<{ notifications: NotifyModel[] }> {
    try {
      // Usar rota de admin
      const response = await apiClient.get<unknown>('/admin/notifications', { params });
      // Checagem de tipo segura
      if (Array.isArray(response)) {
        return { notifications: response.map(this.mapNotificationToModel) };
      }
      if (typeof response === 'object' && response !== null && 'data' in response) {
        const r = response as { data: BackendNotification[] };
        return { notifications: r.data.map(this.mapNotificationToModel) };
      }
      // fallback
      return { notifications: [] };
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return { notifications: [] };
    }
  }

  async createNotification(notification: {
    storeId: string;
    title: string;
    message: string;
    type: ValidNotificationType;  // Usar o tipo literal aqui
    referenceId?: string;
    referenceType?: string;
  }): Promise<NotifyModel> {
    // Extrair storeId e whitelabelId dos dados
    const { storeId, ...rest } = notification;
    const backendData = {
      ...rest,
      content: notification.message,
      // Remover o campo message pois o backend não o espera
      message: undefined
    };
    
    const response = await apiClient.post<BackendNotification>(`/admin/stores/${storeId}/notifications`, backendData);
    return this.mapNotificationToModel(response);
  }

  async createGeneralNotification(notification: {
    title: string;
    message: string;
    type: ValidNotificationType;  // Usar o tipo literal aqui
    referenceId?: string;
    referenceType?: string;
  }): Promise<NotifyModel> {
    // Converter message para content conforme esperado pelo backend
    const backendData = {
      ...notification,
      content: notification.message,
      // Remover o campo message pois o backend não o espera
      message: undefined
    };
    
    const response = await apiClient.post<BackendNotification>('/notifications/general', backendData);
    return this.mapNotificationToModel(response);
  }

  // Função para mapear os dados da API para o modelo usado no frontend
  private mapNotificationToModel(backendNotification: BackendNotification): NotifyModel {
    // Validar o tipo para garantir que seja um dos valores permitidos
    const validTypes: ValidNotificationType[] = ['info', 'alert', 'warning', 'success'];
    
    // Se o tipo do backend não for válido, usar 'info' como padrão
    const type = validTypes.includes(backendNotification.type as ValidNotificationType) 
      ? backendNotification.type as ValidNotificationType 
      : 'info';
    
    return {
      id: backendNotification.id,
      title: backendNotification.title,
      // Mapear content para message
      message: backendNotification.content,
      // Garantir que o tipo seja válido
      type,
      userId: backendNotification.userId,
      referenceId: backendNotification.referenceId,
      referenceType: backendNotification.referenceType,
      read: backendNotification.read || false,
      readAt: backendNotification.readAt,
      createdAt: backendNotification.createdAt,
      // Adicionar campos necessários do modelo
      isGeneral: backendNotification.userId === undefined,
      updatedAt: backendNotification.createdAt, // Se não houver updatedAt, usamos createdAt
      generalId: undefined // Definir se necessário pelo contexto
    };
  }
}

export default new NotificationRepository();