import type { PaymentModel } from "./payment.model";
import type { StoreModel } from "./store.model";

export type WithdrawalStatus = 'pending' | 'completed' | 'failed';

export enum WalletType {
  Liquid = "Liquid",
  OnChain = "OnChain",
  Lightning = "Lightning",
  Tron = "Tron",
  Polygon = "Polygon",
}

export interface WithdrawalModel {
  id: string;
  storeId: string;
  whitelabelId: string;
  amount: number;
  paymentIds: string[];
  status: WithdrawalStatus;
  createdAt: string;
  completedAt?: string;
  destinationWallet?: string;
  destinationWalletType?: WalletType | string;
  failedReason?: string;
  txId?: string;
  notes?: string;
  payments?: PaymentModel[];
  store?: StoreModel;
}

export interface WithdrawalCreateRequest {
  amount: number;
  paymentIds: string[];
  destinationWallet: string;
  destinationWalletType: WalletType | string;
}

export interface WithdrawalListResponse {
  data: WithdrawalModel[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type AdminListWithdrawalsReq = {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
  orderBy?: 'createdAt' | 'completedAt' | 'amount' | 'status' | 'destinationWallet' | 'destinationWalletType' | 'txId' | 'id' | 'storeId' | 'whitelabelId';
  order?: 'asc' | 'desc';
  id?: string;
  paymentId?: string;
  storeId?: string;
  whitelabelId?: string;
  destinationWallet?: string;
  destinationWalletType?: string;
  txId?: string;
  failedReason?: string;
};

export type AdminListWithdrawalsRes = {
  data: WithdrawalModel[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUpdateWithdrawalStatusReq = {
  status: string;
  txId?: string;
  failedReason?: string;
};

export type AdminUpdateWithdrawalStatusRes = WithdrawalModel;