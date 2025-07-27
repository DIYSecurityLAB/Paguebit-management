export interface AuthStoreModel {
  id: string;
  name: string;
  whitelabelId: string;
  permissions: string[]; // ex: ["VIEW_PAYMENTS", "CREATE_PAYMENT"]
}

export interface AuthUserModel {
  id: string;
  whitelabelId: string;
  providerId: string;
  firstName: string;
  lastName: string;
  email: string;
  documentId: string;
  phoneNumber: string;
  documentType: string;
  referral?: string;
  createdAt: string;
  updatedAt: string;
  pictureUrl?: string;
  role: string;
  active: boolean;
  monthlyVolume: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUserModel;
  tokenExpiresAt: string;
}
 