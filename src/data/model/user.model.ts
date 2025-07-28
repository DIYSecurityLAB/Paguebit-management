export type StorePermissionModel =
  | "VIEW_PAYMENTS"
  | "CREATE_PAYMENT"
  | "EDIT_PAYMENT"
  | "ADD_RECEIPT"
  | "VIEW_WITHDRAWALS"
  | "CREATE_WITHDRAWAL"
  | "VIEW_USERS"
  | "CREATE_USER"
  | "EDIT_USER"
  | "DELETE_USER"
  | "VIEW_CUSTOMERS"
  | "CREATE_CUSTOMER"
  | "EDIT_CUSTOMER"
  | "DELETE_CUSTOMER"
  | "VIEW_STORE"
  | "CREATE_STORE"
  | "EDIT_STORE"
  | "DELETE_STORE"
  | "VIEW_AUDIT_LOGS"
  | "VIEW_NOTIFICATIONS"
  | "EDIT_RECEIVING_WALLET";

// Modelo de permissões por loja
export interface StoreUserPermissionModel {
  id: string;
  userId: string;
  storeId: string;
  permission: StorePermissionModel;
}

export interface StoreUserModel {
  id: string;
  name?: string; // <-- adicionado para compatibilidade com ownedStores
  email?: string;
  firstName?: string;
  lastName?: string;
  permissions?: StoreUserPermissionModel[] | { permission: StorePermissionModel }[];
}

export type DocumentTypeModel = "CPF" | "CNPJ" ;

export interface UserModel {
  id: string;
  whitelabelId?: string;
  providerId: string;
  firstName: string;
  lastName: string;
  email: string;
  documentId: string;
  phoneNumber: string;
  documentType: DocumentTypeModel;
  pictureUrl?: string;
  referral?: string;
  monthlyVolume: number;
  role?: string;
  active?: boolean | string;
  updatedAt?: string;
  createdAt?: string;
  storeId?: string;
  stores?: StoreUserModel[];
}

// Tipos para listagem de usuários (AdminListUsersDto)
export type AdminListUsersReq = {
  id?: string;
  whitelabelId?: string;
  providerId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  documentId?: string;
  phoneNumber?: string;
  documentType?: string;
  referral?: string;
  role?: string;
  active?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  page?: string;
  limit?: string;
  orderBy?: 'id' | 'whitelabelId' | 'providerId' | 'firstName' | 'lastName' | 'email' | 'documentId' | 'phoneNumber' | 'documentType' | 'referral' | 'role' | 'active' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
};

export type AdminListUsersRes = {
  data: UserModel[];
  total: number;
  page: number;
  limit: number;
};

// Tipos para update de usuário (AdminUpdateUserDto)
export type AdminUpdateUserReq = {
  active?: string; // string pois o DTO usa @IsBooleanString
  referral?: string;
  phoneNumber?: string;
};

export type AdminUpdateUserRes = ApiResponse<UserModel>;

// Tipo para leitura de usuário por id
export type AdminReadUserRes = ApiResponse<UserModel>;

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type UpdateUserRes = ApiResponse<UserModel>;

export type ReadUserRes = ApiResponse<UserModel>;

export type ErrorRes = {
  code: string;
  message?: string;
  payload?: unknown;
};
