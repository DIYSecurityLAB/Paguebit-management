import apiClient from '../datasource/api-client';
import { AuthResponse, User } from '../models/types';

class AuthRepository {
  async login(token: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', { token });
  }

  async getUserProfile(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }
}

export default new AuthRepository();