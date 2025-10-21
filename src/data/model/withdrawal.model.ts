import type { PaymentModel } from "./payment.model";
import type { StoreModel } from "./store.model";

export type WithdrawalStatus = 'pending' | 'completed' | 'failed';

export enum WalletType {
  Liquid = "Liquid",
  OnChain = "OnChain",
  Lightning = "Lightning",
  Tron = "Tron",
  Polygon = "Polygon",
  Pix = "Pix",
}

export enum FeeType {
  PERCENT = "PERCENT",
  FIXED = "FIXED",
}

export enum CryptoType {
  BTC = "BTC",
  USDT = "USDT",
  BRL = "BRL",
  EUR = "EUR",
  USD = "USD",
}

export interface WithdrawalFeeDetail {
  id: string;
  withdrawalId: string;
  whitelabelId: string;
  storeId: string;
  withdrawalAmount: string; // Decimal como string
  feeType: FeeType;
  feeValue: string; // Decimal como string
  feeAmount: string; // Decimal como string
  spreadPercent: string; // Decimal como string
  spreadAmount: string; // Decimal como string
  agioPercent: string; // Decimal como string
  agioAmount: string; // Decimal como string
  whitelabelTotal: string; // Decimal como string
  platformTotal: string; // Decimal como string
  whitelabelNet: string; // Decimal como string
  platformFeeType?: FeeType;
  platformFeeValue?: string; // Decimal como string
  platformFeeAmount?: string; // Decimal como string
  couponId?: string;
  couponDiscount?: number;
  couponAmount?: number;
  createdAt: string;
}

export interface WithdrawalModel {
  id: string;
  storeId: string;
  whitelabelId: string;
  amount: number;
  cryptoType?: CryptoType;
  cryptoValue?: number;
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
  feesDetail?: WithdrawalFeeDetail[];
  lightningInvoice?: string;
  lightningExpiresAt?: string;
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
  cryptoType?: string;
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