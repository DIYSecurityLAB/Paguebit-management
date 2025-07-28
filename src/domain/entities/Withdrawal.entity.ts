import { z } from "zod";
import { WithdrawalModel, WithdrawalStatus, WalletType } from "../../data/model/withdrawal.model";
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

  constructor(data: WithdrawalType) {
    const parsed = WithdrawalSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map(e => e.message).join(", "));
    }
    Object.assign(this, parsed.data);
  }

  static fromModel(model: WithdrawalModel): Withdrawal {
    return new Withdrawal(model as WithdrawalType);
  }

  public toModel(): WithdrawalModel {
    return {
      id: this.id,
      storeId: this.storeId,
      whitelabelId: this.whitelabelId,
      amount: this.amount,
      paymentIds: this.paymentIds,
      status: this.status,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      destinationWallet: this.destinationWallet,
      destinationWalletType: this.destinationWalletType,
      failedReason: this.failedReason,
      txId: this.txId,
      notes: this.notes,
      payments: this.payments,
      store: this.store,
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
