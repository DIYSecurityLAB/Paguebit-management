export type StoreWalletType = "Liquid" | "OnChain" | "Lightning" | "Tron" | "Polygon";

export interface StoreWalletModel {
  id: string;
  storeId: string;
  type: StoreWalletType;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreWalletsInput {
  Liquid?: string;
  OnChain?: string;
  Lightning?: string;
  Tron?: string;
  Polygon?: string;
}

export type UpdateWalletsRequest = StoreWalletsInput;

// --- Usuário e Permissões ---
export interface StoreUserPermissionModel {
  id: string;
  userId: string;
  storeId: string;
  permission: UserPermissionType;
}

export interface StoreUserModel {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  permissions: StoreUserPermissionModel[] | { permission: UserPermissionType }[];
}

// --- Store ---
export interface StoreModel {
  id: string;
  name: string;
  ownerId: string;
  whitelabelId: string;
  createdAt: string;
  updatedAt: string;
  wallets?: StoreWalletModel[];
  users?: StoreUserModel[];
  permissions?: StoreUserPermissionModel[];
  feeRules?: FeeRuleModel[]; // Adicionado
}

// --- Fee Rules ---
export enum FeeType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export interface FeeRuleModel {
  id: string;
  whitelabelId?: string | null;
  storeId?: string | null;
  minAmount: number;
  maxAmount: number;
  feeType: FeeType;
  feeValue: number;
  spreadPercent?: number | null;
  appliesTo: 'PLATFORM' | 'WHITELABEL';
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeeRuleRequest {
  minAmount: number;
  maxAmount: number;
  feeType: FeeType;
  feeValue: number;
  spreadPercent?: number;
}

export interface UpdateFeeRuleRequest {
  minAmount?: number;
  maxAmount?: number;
  feeType?: FeeType;
  feeValue?: number;
  spreadPercent?: number;
}

export type CreateFeeRuleResponse = ApiResponse<FeeRuleModel>;
export type UpdateFeeRuleResponse = ApiResponse<FeeRuleModel>;
export type ListFeeRulesResponse = ApiResponse<FeeRuleModel[]>;

// --- Requests ---
export interface CreateStoreRequest {
  name: string;
  wallets?: StoreWalletsInput;
}

export interface UpdateStoreRequest {
  name: string;
}

export interface AddUserToStoreRequest {
  email: string;
  permissions: string[]; // agora string[] conforme DTO
}

export interface UpdateUserPermissionsRequest {
  permissions: string[]; // agora string[] conforme DTO
}

// --- Responses ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type CreateStoreResponse = ApiResponse<StoreModel>;
export type UpdateStoreResponse = ApiResponse<StoreModel>;
export type UpdateWalletsResponse = ApiResponse<StoreWalletModel[]>;
export type DeleteStoreResponse = ApiResponse<{ deleted: boolean }>;
export type GetStoreResponse = ApiResponse<StoreModel>;
export type AddUserToStoreResponse = ApiResponse<{
  user: StoreUserModel;
  permissions: StoreUserPermissionModel[];
}>;
export type ListStoreUsersResponse = ApiResponse<StoreUserModel[]>;
export type UpdateUserPermissionsResponse = ApiResponse<StoreUserPermissionModel[]>;
export type RemoveUserFromStoreResponse = ApiResponse<{ removed: boolean }>;
export type ListStoresByWhitelabelResponse = StoreModel[];

// --- Enum de Permissões ---
export enum UserPermissionType {
  VIEW_PAYMENTS = "VIEW_PAYMENTS",
  CREATE_PAYMENT = "CREATE_PAYMENT",
  EDIT_PAYMENT = "EDIT_PAYMENT",
  ADD_RECEIPT = "ADD_RECEIPT",
  VIEW_WITHDRAWALS = "VIEW_WITHDRAWALS",
  CREATE_WITHDRAWAL = "CREATE_WITHDRAWAL",
  VIEW_USERS = "VIEW_USERS",
  CREATE_USER = "CREATE_USER",
  EDIT_USER = "EDIT_USER",
  DELETE_USER = "DELETE_USER",
  VIEW_CUSTOMERS = "VIEW_CUSTOMERS",
  CREATE_CUSTOMER = "CREATE_CUSTOMER",
  EDIT_CUSTOMER = "EDIT_CUSTOMER",
  DELETE_CUSTOMER = "DELETE_CUSTOMER",
  VIEW_STORE = "VIEW_STORE",
  CREATE_STORE = "CREATE_STORE",
  EDIT_STORE = "EDIT_STORE",
  DELETE_STORE = "DELETE_STORE",
  VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS",
  VIEW_NOTIFICATIONS = "VIEW_NOTIFICATIONS",
  EDIT_RECEIVING_WALLET = "EDIT_RECEIVING_WALLET",
}

// --- Admin Store Listagem ---
export type AdminListStoresReq = {
  id?: string;
  name?: string;
  ownerId?: string;
  whitelabelId?: string;
  couponCode?: string; // Adicionado filtro de cupom
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  page?: string;
  limit?: string;
  orderBy?: 'id' | 'name' | 'ownerId' | 'whitelabelId' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
};

export type AdminListStoresRes = {
  data: StoreModel[];
  total: number;
  page: number;
  limit: number;
};
