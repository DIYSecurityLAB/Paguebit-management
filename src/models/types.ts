export interface User {
  id: string;
  providerId: string;
  firstName: string;
  lastName: string;
  email: string;
  documentId: string;
  phoneNumber: string;
  documentType: 'CPF' | 'CNPJ';
  wallets: {
    LiquidAddress?: string;
    OnChainAddress?: string;
    LightningAddress?: string;
    TronAddress?: string;
    PolygonAddress?: string;
  };
  address?: {
    postalCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  referral?: string;
  pictureUrl?: string;
  role: string;
  createdAt?: string;  
  updatedAt?: string;  
  verificationStatus?: {
    email?: string;
    phone?: string;
    document?: string;
  };
  verificationLevel?: number;  
  active: boolean; 
}

export interface UserCreateInput {
  providerId: string;
  firstName: string;
  lastName: string;
  email: string;
  documentId: string;
  phoneNumber: string;
  documentType: 'CPF' | 'CNPJ';
  wallets: {
    LiquidAddress?: string;
    OnChainAddress?: string;
    LightningAddress?: string;
    TronAddress?: string;
    PolygonAddress?: string;
  };
  address?: {
    postalCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  referral?: string;
  pictureUrl?: string;
}

export interface UserStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
  recentUsers: User[];
}

export enum PaymentStatus {
  PENDING = "pending",
  RECEIPT_SENT = "receipt_sent",
  UNDER_REVIEW = "under_review",
  COMPLETED = "approved",
  REJECTED = "not_approved",
  PAID = "paid",
  WITHDRAWAL_PROCESSING = "withdrawal_processing"
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  walletType?: string;
  walletAddress?: string;
  email: string;
  payerName?: string; // Nome do pagador (opcional)
  transactionType: 'dinamic' | 'static';
  receivingMode: string;
  observation?: string;
  qrCodeUrl?: string;
  qrCopyPaste?: string;
  status: string; // Idealmente, isso seria PaymentStatus, mas para manter compatibilidade mantemos como string
  createdAt: string;
  updatedAt: string;
  notes?: string;
  receipt?: string;
  qrCodeId: string;
}

export interface PaymentStatusUpdate {
  id: string;
  status: PaymentStatus;
  notes?: string;
}

export enum WithdrawalStatusEnum {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed"
}

export interface WithdrawalStatus {
  'pending': string;
  'processing': string;
  'completed': string;
  'failed': string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  paymentIds: string[];
  status: keyof WithdrawalStatus;
  createdAt: string;
  completedAt?: string;
  destinationWallet: string;
  destinationWalletType: string;
  failedReason?: string;
  txId?: string;
  notes?: string;
}

export interface WithdrawalCompleteInput {
  id: string;
  txId: string;
  notes: string;
}

export interface WithdrawalStatusUpdate {
  id: string;
  status: keyof WithdrawalStatus;
  failedReason?: string;
}

export interface NotifyModel {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'warning' | 'success';
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  isGeneral: boolean;
  generalId?: string;
  referenceId?: string;
  referenceType?: string;
}

export interface CustomerModel {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionsModel {
  amount: number;
  observation: string;
  createdAt: Date;
  updatedAt: Date;
  walletType: string;
  walletAddress: string;
  email: string;
  transactionType: string;
  receivingMode: "now" | "store";
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface WithdrawalQueryParams extends PaginationParams {
  userId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  name?: string;
  email?: string;
  paymentId?: string;
}

export interface PaymentQueryParams extends PaginationParams {
  userId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  name?: string;
  email?: string;
}

export interface UserQueryParams extends PaginationParams {
  name?: string;
  email?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token?: string;
}