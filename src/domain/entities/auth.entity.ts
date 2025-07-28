import { AuthUserModel, AuthStoreModel } from "../../data/model/auth.model";

export class AuthStore {
  id!: string;
  name!: string;
  whitelabelId!: string;
  permissions!: string[];

  static fromModel(model: AuthStoreModel): AuthStore {
    const entity = new AuthStore();
    entity.id = model.id;
    entity.name = model.name;
    entity.whitelabelId = model.whitelabelId;
    entity.permissions = model.permissions;
    return entity;
  }
}

export class AuthUser {
  id!: string;
  whitelabelId!: string;
  providerId!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  documentId!: string;
  phoneNumber!: string;
  documentType!: string;
  referral?: string;
  createdAt!: string;
  updatedAt!: string;
  pictureUrl?: string;
  role!: string;
  active!: boolean;
  monthlyVolume!: string;
  storeId?: string | null;
  stores?: AuthStore[];

  static fromModel(model: AuthUserModel): AuthUser {
    const entity = new AuthUser();
    entity.id = model.id;
    entity.whitelabelId = model.whitelabelId;
    entity.providerId = model.providerId;
    entity.firstName = model.firstName;
    entity.lastName = model.lastName;
    entity.email = model.email;
    entity.documentId = model.documentId;
    entity.phoneNumber = model.phoneNumber;
    entity.documentType = model.documentType;
    entity.referral = model.referral;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    entity.pictureUrl = model.pictureUrl;
    entity.role = model.role;
    entity.active = model.active;
    entity.monthlyVolume = model.monthlyVolume;
    entity.storeId = model.storeId ?? null;
    entity.stores = model.stores?.map(AuthStore.fromModel) ?? [];
    return entity;
  }
}
