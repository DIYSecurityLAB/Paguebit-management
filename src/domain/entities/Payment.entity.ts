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
  Store: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    ownerId: z.string(),
    whitelabelId: z.string(),
    couponId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    owner: z.object({
      email: z.string().email(),
    }),
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

  constructor(data: Partial<PaymentType>) {
    // Não faz validação, apenas atribui os dados
    Object.assign(this, data);
    
    // Normaliza a propriedade store para manter compatibilidade
    if (data.Store && !data.store) {
      this.store = {
        id: data.Store.id,
        name: data.Store.name,
      };
    }
  }

  static fromModel(model: PaymentModel): Payment {
    // Não faz validação, apenas atribui os dados
    const payment = new Payment(model as Partial<PaymentType>);
    
    // Normaliza a propriedade store para manter compatibilidade
    if (model.Store && !model.store) {
      payment.store = {
        id: model.Store.id,
        name: model.Store.name,
      };
    }
    
    return payment;
  }

  static fromObject(obj: unknown): Payment {
    // Não faz validação, apenas atribui os dados
    const payment = new Payment(obj as Partial<PaymentType>);
    
    // Normaliza a propriedade store para manter compatibilidade
    const objData = obj as any;
    if (objData?.Store && !objData.store) {
      payment.store = {
        id: objData.Store.id,
        name: objData.Store.name,
      };
    }
    
    return payment;
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
      Store: this.Store,
    };
  }

  getStatusLabel(): string {
    return statusTranslations[this.status] ?? this.status;
  }
}