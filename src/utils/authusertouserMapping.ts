import { AuthUser } from "@/domain/entities/auth.entity";
import { User } from "@/domain/entities/User.entity";
import { StorePermissionModel, DocumentTypeModel } from "@/data/model/user.model";

export const mapAuthUserToUser = (authUser: AuthUser): User => {
  const documentType: DocumentTypeModel =
    authUser.documentType === "CPF" || authUser.documentType === "CNPJ"
      ? authUser.documentType
      : "CPF";
  return {
    id: authUser.id,
    providerId: authUser.providerId,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    email: authUser.email,
    documentId: authUser.documentId,
    phoneNumber: authUser.phoneNumber,
    documentType,
    pictureUrl: authUser.pictureUrl,
    referral: authUser.referral,
    monthlyVolume: Number(authUser.monthlyVolume),
    role: authUser.role,
    updatedAt: authUser.updatedAt,
    createdAt: authUser.createdAt,
    storeId: authUser.storeId,
    stores: authUser.stores?.map(store => ({
      id: store.id,
      email: "",
      firstName: "",
      lastName: "",
      permissions: Array.isArray(store.permissions)
        ? store.permissions.map(p => ({ permission: p as StorePermissionModel }))
        : [],
    })),
  };
};
