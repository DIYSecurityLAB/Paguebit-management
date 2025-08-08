export enum PaymentStatus {
  WITHDRAWAL_PROCESSING = "withdrawal_processing",
  PAID = "paid",
  APPROVED = "approved",
  REJECTED = "rejected",
  NOT_APPROVED = "not_approved",
  REVIEW = "review",
  PENDING = "pending",
  RECEIPT_SENT = "receipt_sent",
}
// Payment principal (Response)
export type PaymentModel = {
  id: string;
  storeId: string;
  whitelabelId?: string;
  amount: number;
  email?: string;
  transactionType: "static" | "dynamic" | ""; 
  observation?: string;
  qrCodeUrl?: string;
  qrCopyPaste?: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  receipt?: string;
  qrCodeId?: string;
  payerName?: string;
  referenceId?: string;
  dueDate?: string;
  description?: string;
  depixAddress?: string;
  store?: { id: string; name: string }; 
  Store?: {
    id: string;
    name: string;
    ownerId: string;
    whitelabelId: string;
    couponId: string | null;
    createdAt: string;
    updatedAt: string;
    owner: {
      email: string;
    };
  };
};

export type CreatePaymentDto = {
  amount: number;
  email?: string;
  transactionType?: "static" | "dynamic";
  observation?: string;
  referenceId?: string;
  dueDate?: string;
  description?: string;
  depixAddress?: string;
  qrCodeId?: string;
};

export type UpdatePaymentDto = {
  observation?: string;
  status?: PaymentStatus;
  email?: string;
};

export type UploadReceiptDto = {
  receipt?: string;
};

export type WebhookPayloadDto = {
  qrId: string;
  status: string;
  payerName: string;
  valueInCents: number;
  bankTxId?: string;
  blockchainTxID?: string;
  customerMessage?: string;
  payerTaxNumber?: string;
  pixKey?: string;
  expiration?: string;
  whitelabelId?: string;
};

export type PaymentFilterOptions = {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'amount';
  order?: 'asc' | 'desc';
  email?: string;
  id?: string;
  transactionType?: string;
  receipt?: 'true' | 'false';
  observation?: string;
  notes?: string;
  whitelabelId?: string;
};

// Tipos para listagem de pagamentos (AdminListPaymentsDto)
export type AdminListPaymentsReq = {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
  orderBy?: 'createdAt' | 'updatedAt' | 'amount' | 'email' | 'transactionType' | 'status' | 'payerName' | 'id' | 'storeId' | 'whitelabelId';
  order?: 'asc' | 'desc';
  name?: string;
  email?: string;
  id?: string;
  transactionType?: string;
  noreceipt?: string;
  storeId?: string;
  whitelabelId?: string;
  qrCodeId?: string;
  payerName?: string;
  observation?: string;
  notes?: string;
  receipt?: string;
  qrCodeUrl?: string;
  qrCopyPaste?: string;
};

export type AdminListPaymentsRes = {
  data: PaymentModel[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUpdatePaymentStatusReq = {
  status: string;
};

export type AdminUpdatePaymentStatusRes = PaymentModel;