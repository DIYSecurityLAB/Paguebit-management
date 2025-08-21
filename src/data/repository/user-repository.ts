import { apiDataSource } from "../datasource/api.datasource";
import type {
  UserModel,
  AdminListUsersReq,
  AdminListUsersRes,
  AdminUpdateUserReq,
  AdminUpdateUserRes,
  AdminReadUserRes,
} from "../model/user.model";

export class UserRepository {
  async listAllUsers(req: AdminListUsersReq): Promise<AdminListUsersRes> {
    const firebaseToken = localStorage.getItem("FIREBASE_TOKEN");
    const headers: Record<string, string> = {};
    if (firebaseToken) {
      headers["Authorization"] = `Bearer ${firebaseToken}`;
    }
    const res = await apiDataSource.get<AdminListUsersRes>(
      '/admin/users',
      { params: req, headers }
    );
    return res;
  }

  async getUserById(id: string): Promise<AdminReadUserRes> {
    const firebaseToken = localStorage.getItem("FIREBASE_TOKEN");
    const headers: Record<string, string> = {};
    if (firebaseToken) {
      headers["Authorization"] = `Bearer ${firebaseToken}`;
    }
    const res = await apiDataSource.get<AdminReadUserRes>(
      `/admin/users/${id}`,
      { headers }
    );
    return res;
  }

  async updateUser(id: string, req: AdminUpdateUserReq): Promise<UserModel> {
    const firebaseToken = localStorage.getItem("FIREBASE_TOKEN");
    const headers: Record<string, string> = {};
    if (firebaseToken) {
      headers["Authorization"] = `Bearer ${firebaseToken}`;
    }
    const res = await apiDataSource.patch<AdminUpdateUserRes>(
      `/admin/users/${id}`,
      req,
      { headers }
    );

    // Aceita resposta no formato { success, data, message } ou retorno puro do usuário.
    const maybeWrapped = res as unknown as { data?: unknown } | UserModel;
    const userModel = (maybeWrapped && (maybeWrapped as any).data) ? (maybeWrapped as any).data : (res as any);

    return userModel as UserModel;
  }
}
