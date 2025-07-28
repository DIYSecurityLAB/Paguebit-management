import { apiDataSource } from "../datasource/api.datasource";
import type { AuthResponse } from "../model/auth.model";

export class AuthRepository {
  async login(email: string, firebaseToken: string): Promise<AuthResponse & { accessToken?: string; refreshToken?: string; tokenExpiresAt?: string }> {
    // Envia o token no header e o email no body
    const config = {
      headers: {
        Authorization: `Bearer ${firebaseToken}`,
      },
    };
    const res = await apiDataSource.post<AuthResponse & { accessToken?: string; refreshToken?: string; tokenExpiresAt?: string }>(
      "/auth/login",
      { email },
      config
    );
    return res;
  }

  async getMe(): Promise<AuthResponse> {
    const res: AuthResponse = await apiDataSource.get<AuthResponse>("/auth/me");
    return res;
  }

  async refreshToken(refreshToken?: string) {
    // Usa o refreshToken passado, senão pega do localStorage
    const token = refreshToken || localStorage.getItem("REFRESH_TOKEN");
    if (!token) throw new Error("Refresh token não encontrado.");

    // Chama a API passando o refresh token no header Authorization
    const res = await apiDataSource.post(
      "/auth/refresh",
      undefined,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  }
}
