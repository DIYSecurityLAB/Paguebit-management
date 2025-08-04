import { z } from "zod";
import { WithdrawalModel, WithdrawalStatus, WalletType, WithdrawalFeeDetail } from "../../data/model/withdrawal.model";
 import { PaymentModel } from "../../data/model/payment.model";
import { StoreModel } from "../../data/model/store.model";

export const WithdrawalStatusSchema = z.enum(['pending', 'completed', 'failed']);

export const WithdrawalSchema = z.object({
  id: z.string().min(1, "ID do saque não pode ser vazio"),
  storeId: z.string().min(1, "ID da loja não pode ser vazio"),
  whitelabelId: z.string().min(1, "ID do whitelabel não pode ser vazio"),
  amount: z.number().positive("Valor deve ser positivo"),
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
});

export type WithdrawalType = z.infer<typeof WithdrawalSchema>;

export class Withdrawal {
  id!: string;
  storeId!: string;
  whitelabelId!: string;
  amount!: number;
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

  constructor(data: WithdrawalType & Partial<Pick<Withdrawal, "feesDetail" | "owner" | "ownerEmail">>) {
    const parsed = WithdrawalSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map(e => e.message).join(", "));
    }
    Object.assign(this, parsed.data);
    if ("feesDetail" in data) this.feesDetail = data.feesDetail;
    if ("owner" in data) this.owner = data.owner;
    if ("ownerEmail" in data) this.ownerEmail = data.ownerEmail;
  }

  static fromModel(model: WithdrawalModel & { Store?: { owner?: { email: string } } }): Withdrawal {
    const withdrawalData = {
      ...model,
      feesDetail: model.feesDetail,
      owner: model.Store?.owner,
      ownerEmail: model.Store?.owner?.email || null,
    };
    return new Withdrawal(withdrawalData as WithdrawalType & Partial<Pick<Withdrawal, "feesDetail" | "owner" | "ownerEmail">>);
  }

  public toModel(): WithdrawalModel & { feesDetail?: WithdrawalFeeDetail[]; owner?: { email: string }; ownerEmail?: string | null } {
    return {
      id: this.id,
      storeId: this.storeId,
      whitelabelId: this.whitelabelId,
      amount: this.amount,
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
    };
  }

  getStatusLabel(): string {
    const statusTranslations: Record<WithdrawalStatus, string> = {
      pending: "Pendente",
      completed: "Concluído",
      failed: "Falha"
    };
    return statusTranslations[this.status] ?? this.status;
  }
}
 