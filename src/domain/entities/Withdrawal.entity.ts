import { z } from "zod";
import { WithdrawalModel, WithdrawalStatus, WalletType, WithdrawalFeeDetail, CryptoType } from "../../data/model/withdrawal.model";
 import { PaymentModel } from "../../data/model/payment.model";
import { StoreModel } from "../../data/model/store.model";

export const WithdrawalStatusSchema = z.enum(['pending', 'completed', 'failed']);

export const WithdrawalSchema = z.object({
  id: z.string().min(1, "ID do saque não pode ser vazio"),
  storeId: z.string().min(1, "ID da loja não pode ser vazio"),
  whitelabelId: z.string().min(1, "ID do whitelabel não pode ser vazio"),
  amount: z.number().positive("Valor deve ser positivo"),
  cryptoType: z.nativeEnum(CryptoType).optional().nullable(),
  cryptoValue: z.number().optional().nullable(),
  paymentIds: z.array(z.string().min(1, "ID do pagamento não pode ser vazio")).min(1, "Selecione pelo menos um pagamento"),
  status: WithdrawalStatusSchema,
  createdAt: z.string().min(1, "Data de criação não pode ser vazia"),
  completedAt: z.string().nullable().optional(),
  destinationWallet: z.string().min(1, "Carteira de destino não pode ser vazia").nullable().optional(),
  destinationWalletType: z.string().min(1, "Tipo de carteira não pode ser vazio").nullable().optional(),
  failedReason: z.string().nullable().optional(),
  txId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  payments: z.array(z.any()).optional(),
  store: z.any().optional(),
  feesDetail: z.array(z.any()).optional(),
  ownerEmail: z.string().nullable().optional(),
  lightningInvoice: z.string().nullable().optional(),
  lightningExpiresAt: z.string().nullable().optional(),
});

export type WithdrawalType = z.infer<typeof WithdrawalSchema>;

export class Withdrawal {
  id!: string;
  storeId!: string;
  whitelabelId!: string;
  amount!: number;
  cryptoType?: CryptoType;
  cryptoValue?: number;
  paymentIds!: string[];
  status!: WithdrawalStatus;
  createdAt!: string;
  completedAt?: string | null;
  destinationWallet?: string | null;
  destinationWalletType?: WalletType | string | null;
  failedReason?: string | null;
  txId?: string | null;
  notes?: string | null;
  payments?: PaymentModel[];
  store?: StoreModel;
  feesDetail?: WithdrawalFeeDetail[];
  owner?: { email: string };
  ownerEmail?: string | null;
  lightningInvoice?: string | null;
  lightningExpiresAt?: string | null;

  constructor(data: WithdrawalType & Partial<Pick<Withdrawal, "feesDetail" | "owner" | "ownerEmail" | "lightningInvoice" | "lightningExpiresAt">>) {
    const parsed = WithdrawalSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map(e => e.message).join(", "));
    }
    Object.assign(this, parsed.data);
    if ("feesDetail" in data) this.feesDetail = data.feesDetail;
    if ("owner" in data) this.owner = data.owner;
    if ("ownerEmail" in data) this.ownerEmail = data.ownerEmail;
    if ("lightningInvoice" in data) this.lightningInvoice = data.lightningInvoice;
    if ("lightningExpiresAt" in data) this.lightningExpiresAt = data.lightningExpiresAt;
  }

  static fromModel(model: WithdrawalModel & { Store?: { owner?: { email: string } } }): Withdrawal {
    const withdrawalData = {
      ...model,
      feesDetail: model.feesDetail,
      owner: model.Store?.owner,
      ownerEmail: model.Store?.owner?.email || null,
      lightningInvoice: model.lightningInvoice || null,
      lightningExpiresAt: model.lightningExpiresAt || null,
    };
    return new Withdrawal(withdrawalData as WithdrawalType & Partial<Pick<Withdrawal, "feesDetail" | "owner" | "ownerEmail" | "lightningInvoice" | "lightningExpiresAt">>);
  }

  getStatusLabel(): string {
    const statusTranslations: Record<WithdrawalStatus, string> = {
      pending: "Pendente",
      completed: "Concluído",
      failed: "Falha"
    };
    return statusTranslations[this.status] ?? this.status;
  }

  getFormattedExchangeRate(): string {
    // Moedas fiat não tem cotação (já estão na moeda base)
    if (this.cryptoType === 'BRL' || this.cryptoType === 'EUR' || this.cryptoType === 'USD') {
      return `N/A (${this.cryptoType})`;
    }
    
    if (!this.cryptoValue || this.cryptoValue === 0 || !this.amount) {
      return 'N/A';
    }
    
    const rate = this.amount / this.cryptoValue;
    
    if (this.cryptoType === 'BTC') {
      return `R$ ${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / BTC`;
    } else if (this.cryptoType === 'USDT') {
      return `R$ ${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / USDT`;
    }
    
    return 'N/A';
  }

  getFormattedCryptoValueForSending(): string {
    if (!this.cryptoValue) {
      return 'N/A';
    }

    if (this.cryptoType === 'BTC') {
      return `${this.cryptoValue.toFixed(8)} BTC`;
    } else if (this.cryptoType === 'USDT') {
      return `${this.cryptoValue.toFixed(6)} USDT`;
    } else if (this.cryptoType === 'BRL') {
      return `R$ ${this.cryptoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (this.cryptoType === 'EUR') {
      return `€ ${this.cryptoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (this.cryptoType === 'USD') {
      return `$ ${this.cryptoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    return this.cryptoValue.toString();
  }

  public toModel(): WithdrawalModel & { feesDetail?: WithdrawalFeeDetail[]; owner?: { email: string }; ownerEmail?: string | null } {
    return {
      id: this.id,
      storeId: this.storeId,
      whitelabelId: this.whitelabelId,
      amount: this.amount,
      cryptoType: this.cryptoType,
      cryptoValue: this.cryptoValue,
      paymentIds: this.paymentIds,
      status: this.status,
      createdAt: this.createdAt,
      completedAt: this.completedAt ?? undefined,
      destinationWallet: this.destinationWallet ?? undefined,
      destinationWalletType: this.destinationWalletType ?? undefined,
      failedReason: this.failedReason ?? undefined,
      txId: this.txId ?? undefined,
      notes: this.notes ?? undefined,
      payments: this.payments,
      store: this.store,
      feesDetail: this.feesDetail,
      owner: this.owner,
      ownerEmail: this.ownerEmail,
      lightningInvoice: this.lightningInvoice ?? undefined,
      lightningExpiresAt: this.lightningExpiresAt ?? undefined,
    };
  }
}
