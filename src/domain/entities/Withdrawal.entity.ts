import { z } from "zod";
import { WithdrawalModel, WithdrawalStatus, WalletType } from "../../data/model/withdrawal.model";

export const WithdrawalStatusSchema = z.enum(['pending', 'completed', 'failed']);

export const WithdrawalSchema = z.object({
  id: z.string().min(1, "ID do saque não pode ser vazio"),
  storeId: z.string().min(1, "ID da loja não pode ser vazio"),
  whitelabelId: z.string().min(1, "ID do whitelabel não pode ser vazio"),
  amount: z.number().positive("Valor deve ser positivo"),
  paymentIds: z.array(z.string().min(1, "ID do pagamento não pode ser vazio")).min(1, "Selecione pelo menos um pagamento"),
  status: WithdrawalStatusSchema,
  createdAt: z.string().min(1, "Data de criação não pode ser vazia"),
  completedAt: z.string().optional(),
  destinationWallet: z.string().min(1, "Carteira de destino não pode ser vazia"),
  destinationWalletType: z.string().min(1, "Tipo de carteira não pode ser vazio"),
  failedReason: z.string().optional(),
  txId: z.string().optional(),
  notes: z.string().optional(),
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
  completedAt?: string;
  destinationWallet!: string;
  destinationWalletType!: WalletType | string;
  failedReason?: string;
  txId?: string;
  notes?: string;

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
    };
  }
}
  