import { z } from "zod";
import { NotificationModel } from "../../data/model/notification.model";

// Schema de validação
export const NotificationSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  storeId: z.string().optional(),
  whitelabelId: z.string().optional(),
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  referenceId: z.string().optional(),
  read: z.boolean(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string().min(1, "Data de criação é obrigatória"),
});
export type NotificationType = z.infer<typeof NotificationSchema>;

export class Notification {
  id!: string;
  storeId?: string;
  whitelabelId?: string;
  title!: string;
  content!: string;
  type!: string;
  referenceId?: string;
  read!: boolean;
  readAt?: string | null;
  createdAt!: string;

  constructor(data: NotificationType) {
    const parsed = NotificationSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map(e => e.message).join(", "));
    }
    Object.assign(this, parsed.data);
  }

  static fromModel(model: NotificationModel): Notification {
    return new Notification(model);
  }

  public toModel(): NotificationModel {
    return {
      id: this.id,
      storeId: this.storeId,
      whitelabelId: this.whitelabelId,
      title: this.title,
      content: this.content,
      type: this.type,
      referenceId: this.referenceId,
      read: this.read,
      readAt: this.readAt,
      createdAt: this.createdAt,
    };
  }
}
