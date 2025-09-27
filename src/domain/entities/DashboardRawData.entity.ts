export interface DashboardMeta {
  users: number;
  payments: number;
  withdrawals: number;
  stores: number;
  batchSize: number;
}

export interface DashboardUser {
  id: string;
  whitelabelId: string;
  providerId: string;
  firstName: string;
  lastName: string;
  email: string;
  documentId: string;
  phoneNumber: string;
  documentType: string;
  referral: string | null;
  createdAt: string;
  updatedAt: string;
  role: string;
  active: boolean;
  monthlyVolume: string;
  country: string;
  hasPhoto: boolean;
}

export interface DashboardPayment {
  id: string;
  storeId: string;
  whitelabelId: string;
  amount: number;
  email: string;
  transactionType: string;
  observation: string | null;
  qrCodeUrl: string | null;
  qrCopyPaste: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  qrCodeId: string | null;
  payerName: string | null;
  hasReceipt: boolean;
}

export interface DashboardWithdrawal {
  id: string;
  storeId: string;
  whitelabelId: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  // ...outros campos que existirem no backend
  [key: string]: unknown;
}

export interface DashboardStore {
  id: string;
  name: string;
  whitelabelId?: string;
  createdAt?: string;
  updatedAt?: string;
  // ...outros campos conforme necessário
  [key: string]: unknown;
}

export interface DashboardRawData {
  meta: DashboardMeta;
  users: DashboardUser[];
  payments: DashboardPayment[];
  withdrawals: DashboardWithdrawal[];
  stores: DashboardStore[];
}
