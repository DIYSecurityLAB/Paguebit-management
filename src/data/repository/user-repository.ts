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

  async getUserById(id: string): Promise<UserModel> {
    const firebaseToken = localStorage.getItem("FIREBASE_TOKEN");
    const headers: Record<string, string> = {};
    if (firebaseToken) {
      headers["Authorization"] = `Bearer ${firebaseToken}`;
    }
    const res = await apiDataSource.get<AdminReadUserRes>(
      `/admin/users/${id}`,
      { headers }
    );
    return res.data;
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
    return res.data;
  }
}
