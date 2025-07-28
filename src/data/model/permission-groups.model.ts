import { UserPermissionType } from "./store.model";

export enum PermissionCategory {
  PAYMENTS = "Pagamentos",
  WITHDRAWALS = "Saques",
  STORE = "Loja",
  CUSTOMERS = "Clientes",
  USERS = "Usuários",
  AUDIT = "Auditoria",
  NOTIFICATIONS = "Notificações",
  WALLETS = "Carteiras"
}

export interface PermissionGroup {
  category: PermissionCategory;
  description: string;
  permissions: UserPermissionType[];
}

export const permissionGroups: PermissionGroup[] = [
  {
    category: PermissionCategory.PAYMENTS,
    description: "Gerenciar pagamentos, criar cobranças e recibos",
    permissions: [
      UserPermissionType.VIEW_PAYMENTS,
      UserPermissionType.CREATE_PAYMENT,
      UserPermissionType.EDIT_PAYMENT,
      UserPermissionType.ADD_RECEIPT,
    ]
  },
  {
    category: PermissionCategory.WITHDRAWALS,
    description: "Gerenciar saques",
    permissions: [
      UserPermissionType.VIEW_WITHDRAWALS,
      UserPermissionType.CREATE_WITHDRAWAL,
    ]
  },
  {
    category: PermissionCategory.USERS,
    description: "Gerenciar usuários da loja",
    permissions: [
      UserPermissionType.VIEW_USERS,
      UserPermissionType.CREATE_USER,
      UserPermissionType.EDIT_USER,
      UserPermissionType.DELETE_USER,
    ]
  },
  {
    category: PermissionCategory.CUSTOMERS,
    description: "Gerenciar clientes da loja",
    permissions: [
      UserPermissionType.VIEW_CUSTOMERS,
      UserPermissionType.CREATE_CUSTOMER,
      UserPermissionType.EDIT_CUSTOMER,
      UserPermissionType.DELETE_CUSTOMER,
    ]
  },
  {
    category: PermissionCategory.STORE,
    description: "Gerenciar configurações da loja",
    permissions: [
      UserPermissionType.VIEW_STORE,
      UserPermissionType.CREATE_STORE,
      UserPermissionType.EDIT_STORE,
      UserPermissionType.DELETE_STORE,
    ]
  },
  {
    category: PermissionCategory.WALLETS,
    description: "Gerenciar carteiras de recebimento",
    permissions: [
      UserPermissionType.EDIT_RECEIVING_WALLET,
    ]
  },
  {
    category: PermissionCategory.AUDIT,
    description: "Acessar logs de auditoria",
    permissions: [
      UserPermissionType.VIEW_AUDIT_LOGS,
    ]
  },
  {
    category: PermissionCategory.NOTIFICATIONS,
    description: "Visualizar notificações",
    permissions: [
      UserPermissionType.VIEW_NOTIFICATIONS,
    ]
  }
];

export const getPermissionCategory = (permission: UserPermissionType): PermissionCategory => {
  for (const group of permissionGroups) {
    if (group.permissions.includes(permission)) {
      return group.category;
    }
  }
  return PermissionCategory.STORE;
};

export const isCategoryFullySelected = (
  category: PermissionCategory,
  selectedPermissions: UserPermissionType[]
): boolean => {
  const group = permissionGroups.find(g => g.category === category);
  if (!group) return false;
  return group.permissions.every(permission => selectedPermissions.includes(permission));
};

export const getPermissionsByCategory = (category: PermissionCategory): UserPermissionType[] => {
  const group = permissionGroups.find(g => g.category === category);
  return group ? group.permissions : [];
};
 