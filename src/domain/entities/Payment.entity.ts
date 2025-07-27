import { z } from "zod";
import type { PaymentModel } from "../../data/model/payment.model";
import { PaymentStatus as PaymentStatusEnum } from "../../data/model/payment.model";

export const statusTranslations: Record<PaymentStatusEnum, string> = {
  [PaymentStatusEnum.PENDING]: "Pendente",
  [PaymentStatusEnum.RECEIPT_SENT]: "Comprovante Enviado",
  [PaymentStatusEnum.REVIEW]: "Em Análise",
  [PaymentStatusEnum.APPROVED]: "Aprovado",
  [PaymentStatusEnum.NOT_APPROVED]: "Não Aprovado",
  [PaymentStatusEnum.PAID]: "Pago",
  [PaymentStatusEnum.WITHDRAWAL_PROCESSING]: "Em Processamento de Saque",
  [PaymentStatusEnum.REJECTED]: "Rejeitado",
};

export const PaymentStatusSchema = z.nativeEnum(PaymentStatusEnum);

export type PaymentStatus = PaymentStatusEnum;

export const PaymentSchema = z.object({
  id: z.string().min(1, "ID do pagamento não pode ser vazio"),
  storeId: z.string().min(1, "ID da loja não pode ser vazio"),
  whitelabelId: z.string().optional(),
  amount: z.number().positive("Valor deve ser positivo"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  transactionType: z.enum(["static", "dynamic", ""]),
  observation: z.string().max(255).optional().nullable(),
  qrCodeUrl: z.string().optional().nullable(),
  qrCopyPaste: z.string().optional().nullable(),
  status: z.nativeEnum(PaymentStatusEnum),
  createdAt: z.string().min(1, "Data de criação não pode ser vazia"),
  updatedAt: z.string().min(1, "Data de atualização não pode ser vazia"),
  notes: z.string().optional().nullable(),
  receipt: z.string().optional().nullable(),
  qrCodeId: z.string().optional().nullable(),
  payerName: z.string().optional().nullable(),
  referenceId: z.string().optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  depixAddress: z.string().optional(),
  store: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }).optional(),
});

export type PaymentType = z.infer<typeof PaymentSchema>;

export class Payment {
  id!: string;
  storeId!: string;
  whitelabelId?: string;
  amount!: number;
  email?: string;
  transactionType!: "static" | "dynamic" | "";
  observation?: string;
  qrCodeUrl?: string;
  qrCopyPaste?: string;
  status!: PaymentStatus;
  createdAt!: string;
  updatedAt!: string;
  notes?: string;
  receipt?: string;
  qrCodeId?: string;
  payerName?: string;
  referenceId?: string;
  dueDate?: string;
  description?: string;
  depixAddress?: string;
  store?: { id: string; name: string };

  constructor(data: PaymentType) {
    const parsed = PaymentSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map(e => e.message).join(", "));
    }
    Object.assign(this, parsed.data);
  }

  static fromModel(model: PaymentModel): Payment {
    return new Payment(model as PaymentType);
  }

  static fromObject(obj: unknown): Payment {
    const parsed = PaymentSchema.parse(obj);
    return new Payment(parsed);
  }

  public toModel(): PaymentModel {
    return {
      id: this.id,
      storeId: this.storeId,
      whitelabelId: this.whitelabelId,
      amount: this.amount,
      email: this.email,
      transactionType: this.transactionType,
      observation: this.observation,
      qrCodeUrl: this.qrCodeUrl,
      qrCopyPaste: this.qrCopyPaste,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      notes: this.notes,
      receipt: this.receipt,
      qrCodeId: this.qrCodeId,
      payerName: this.payerName,
      referenceId: this.referenceId,
      dueDate: this.dueDate,
      description: this.description,
      depixAddress: this.depixAddress,
      store: this.store,
    };
  }

  getStatusLabel(): string {
    return statusTranslations[this.status] ?? this.status;
  }
}