import { UserModel, StorePermissionModel, StoreUserPermissionModel as StoreUserPermissionModelType, DocumentTypeModel } from "../../data/model/user.model";
import { z } from "zod";

// StoreUser agora segue o model
export class StoreUser {
  id!: string;
  email!: string;
  firstName?: string;
  lastName?: string;
  permissions!: StoreUserPermissionModelType[] | { permission: StorePermissionModel }[];
  name?: string; // novo campo
  whitelabelId?: string; // novo campo
}

export class User {
  id!: string;
  whitelabelId?: string;
  providerId!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  documentId!: string;
  phoneNumber!: string;
  documentType!: DocumentTypeModel;
  pictureUrl?: string;
  referral?: string;
  monthlyVolume!: number;
  role?: string;
  active?: boolean | string;
  updatedAt?: string;
  createdAt?: string;
  storeId?: string;
  stores?: StoreUser[];

  public static fromModel(model: UserModel): User {
    const entity = new User();
    entity.id = model.id;
    entity.whitelabelId = model.whitelabelId;
    entity.providerId = model.providerId;
    entity.firstName = model.firstName;
    entity.lastName = model.lastName;
    entity.email = model.email;
    entity.documentId = model.documentId;
    entity.phoneNumber = model.phoneNumber;
    entity.documentType = model.documentType;
    entity.pictureUrl = model.pictureUrl;
    entity.referral = model.referral;
    entity.monthlyVolume = model.monthlyVolume;
    entity.role = model.role;
    entity.active = model.active;
    entity.updatedAt = model.updatedAt;
    entity.createdAt = model.createdAt;
    entity.storeId = model.storeId;
    entity.stores = model.stores?.map(store => ({
      id: store.id,
      email: store.email,
      firstName: store.firstName,
      lastName: store.lastName,
      permissions: store.permissions,
    }));
    return entity;
  }
}

export type DocumentType = DocumentTypeModel;

// Atualizar UpdateUser apenas para os campos permitidos pelo AdminUpdateUserDto
export const UpdateUser = z.object({
  active: z.string().optional(), // string pois o DTO usa @IsBooleanString
  referral: z.string().optional(),
  phoneNumber: z.string().optional(),
});
export type UpdateUser = z.infer<typeof UpdateUser>;

export type StoreUserPermissionModel = StoreUserPermissionModelType; // <-- exporta o tipo
 