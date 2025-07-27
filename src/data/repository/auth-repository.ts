import { apiDataSource } from "../datasource/api.datasource";
import type { AuthResponse } from "../model/auth.model";

export class AuthRepository {
  async login(email: string, firebaseToken: string): Promise<AuthResponse & { accessToken?: string; refreshToken?: string; tokenExpiresAt?: string }> {
    const res = await apiDataSource.post<AuthResponse & { accessToken?: string; refreshToken?: string; tokenExpiresAt?: string }>("/auth/login", { email, firebaseToken });
     return res;
  }

  async getMe(): Promise<AuthResponse> {
    const res: AuthResponse = await apiDataSource.get<AuthResponse>("/auth/me");
    return res;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse & { accessToken: string; refreshToken: string; tokenExpiresAt: string }> {
    const res: AuthResponse & { accessToken: string; refreshToken: string; tokenExpiresAt: string } =
      await apiDataSource.post<AuthResponse & { accessToken: string; refreshToken: string; tokenExpiresAt: string }>("/auth/refresh", { refreshToken });
    return res;
  }
}
