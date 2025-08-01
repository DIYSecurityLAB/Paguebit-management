import { z } from "zod";
import type { StoreModel, FeeRuleModel } from "../../data/model/store.model";

export const StoreSchema = z.object({
  id: z.string().min(1, "ID da loja não pode ser vazio"),
  name: z.string().min(1, "Nome da loja não pode ser vazio"),
  ownerId: z.string().min(1, "OwnerId é obrigatório"),
  whitelabelId: z.string().min(1, "WhitelabelId é obrigatório"),
  createdAt: z.string().min(1, "Data de criação é obrigatória"),
  updatedAt: z.string().min(1, "Data de atualização é obrigatória"),
});

export type StoreType = z.infer<typeof StoreSchema>;

export class Store {
  id!: string;
  name!: string;
  ownerId!: string;
  whitelabelId!: string;
  createdAt!: string;
  updatedAt!: string;
  users?: StoreModel["users"]; // Adicionado
  wallets?: StoreModel["wallets"]; // Adicionado
  feeRules?: FeeRuleModel[]; // Adicionado

  constructor(data: StoreType & Partial<Pick<Store, "users" | "wallets" | "feeRules">>) {
    const parsed = StoreSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map(e => e.message).join(", "));
    }
    Object.assign(this, parsed.data);
    if ("users" in data) this.users = data.users;
    if ("wallets" in data) this.wallets = data.wallets;
    if ("feeRules" in data) this.feeRules = data.feeRules;
  }

  static fromModel(model: StoreModel): Store {
    return new Store(model as StoreType & Partial<Pick<Store, "users" | "wallets" | "feeRules">>);
  }

  public toModel(): StoreModel {
    return {
      id: this.id,
      name: this.name,
      ownerId: this.ownerId,
      whitelabelId: this.whitelabelId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      users: this.users,
      wallets: this.wallets,
      feeRules: this.feeRules,
    };
  }
}
