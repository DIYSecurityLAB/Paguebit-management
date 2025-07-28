import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface StoreUserPermission {
  permission: string;
}

interface StoreUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  permissions: StoreUserPermission[] | { permission: string }[];
  name?: string;
  whitelabelId?: string;
}

interface StoreUsersTableProps {
  users: any[]; // Ajuste o tipo conforme seu domínio
}

const StoreUsersTable: React.FC<StoreUsersTableProps> = ({ users }) => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(s) ||
        (u.email || '').toLowerCase().includes(s)
    );
  }, [users, search]);

  const getPermissionsLabel = (
    permissions: StoreUserPermission[] | { permission: string }[]
  ) => {
    const permissionNames = permissions.map((p) => {
      const permission = 'permission' in p ? p.permission : p.permission;

      const labels: Record<string, string> = {
        VIEW_PAYMENTS: "Visualizar Pagamentos",
        CREATE_PAYMENT: "Criar Pagamento",
        EDIT_PAYMENT: "Editar Pagamento",
        ADD_RECEIPT: "Adicionar Comprovante",
        VIEW_WITHDRAWALS: "Visualizar Saques",
        CREATE_WITHDRAWAL: "Criar Saque",
        VIEW_USERS: "Visualizar Usuários",
        CREATE_USER: "Criar Usuário",
        EDIT_USER: "Editar Usuário",
        DELETE_USER: "Excluir Usuário",
        VIEW_CUSTOMERS: "Visualizar Clientes",
        CREATE_CUSTOMER: "Criar Cliente",
        EDIT_CUSTOMER: "Editar Cliente",
        DELETE_CUSTOMER: "Excluir Cliente",
        VIEW_STORE: "Visualizar Loja",
        CREATE_STORE: "Criar Loja",
        EDIT_STORE: "Editar Loja",
        DELETE_STORE: "Excluir Loja",
        VIEW_AUDIT_LOGS: "Visualizar Logs",
        VIEW_NOTIFICATIONS: "Visualizar Notificações",
        EDIT_RECEIVING_WALLET: "Editar Carteira",
      };

      return labels[permission] || permission;
    });

    return (
      permissionNames.slice(0, 3).join(', ') +
      (permissionNames.length > 3
        ? ` + ${permissionNames.length - 3} mais`
        : '')
    );
  };

  if (!filteredUsers || filteredUsers.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Nenhum usuário vinculado
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2">
        <input
          className="border rounded px-2 py-1 text-sm w-full max-w-xs"
          placeholder="Filtrar por nome ou email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Permissões
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => window.open(`/users/${user.id}`, '_blank')}
              >
                <td className="px-4 py-3 text-sm text-foreground">
                  {user.id}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {user.name || `${user.firstName || ''} ${user.lastName || ''}`}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {user.email}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {user.permissions && user.permissions.length > 0
                    ? getPermissionsLabel(user.permissions)
                    : 'Sem permissões'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreUsersTable;
