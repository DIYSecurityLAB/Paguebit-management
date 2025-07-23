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

  async getAllNotifications(params?: PaginationParams & { storeId?: string }): Promise<{ notifications: NotifyModel[] }> {
    try {
      // Usar rota de admin
      const response = await apiClient.get<unknown>('/admin/notifications', { params });
      // Checagem de tipo segura
      if (Array.isArray(response)) {
        return { notifications: response.map(this.mapNotificationToModel) };
      }
      if (typeof response === 'object' && response !== null && 'data' in response) {
        // Corrigir para aceitar array diretamente
        const r = response as { data: any };
        if (Array.isArray(r.data)) {
          return { notifications: r.data.map(this.mapNotificationToModel) };
        }
        // Caso venha como objeto paginado
        if (typeof r.data === 'object' && r.data !== null && Array.isArray((r.data as any).data)) {
          return { notifications: (r.data as any).data.map(this.mapNotificationToModel) };
        }
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
      // Remover campos relacionados a general notification
      // isGeneral, generalId
      updatedAt: backendNotification.createdAt
    };
  }
}

export default new NotificationRepository();