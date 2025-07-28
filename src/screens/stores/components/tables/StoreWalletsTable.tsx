import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StoreWallet {
  id: string;
  storeId: string;
  type: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StoreWalletsTableProps {
  wallets?: StoreWallet[]; // Torna opcional para evitar erro se não vier do backend
}

const StoreWalletsTable: React.FC<StoreWalletsTableProps> = ({ wallets }) => {
  // Garante que wallets é sempre um array se for passado, senão undefined
  const safeWallets = Array.isArray(wallets) ? wallets : undefined;

  const formatWalletType = (type: string): string => {
    const typeLabels: Record<string, string> = {
      Liquid: "Liquid",
      OnChain: "On-Chain",
      Lightning: "Lightning",
      Tron: "Tron",
      Polygon: "Polygon"
    };
    return typeLabels[type] || type;
  };

  // Só mostra mensagem se for array vazio explicitamente
  if (safeWallets && safeWallets.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">Nenhuma carteira encontrada</div>;
  }

  // Se não veio nada (undefined/null), não mostra nada
  if (!safeWallets) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Endereço</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Criada em</th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {safeWallets.map((wallet) => (
            <tr key={wallet.id}>
              <td className="px-4 py-3 text-sm text-foreground">
                {wallet.id}
              </td>
              <td className="px-4 py-3 text-sm text-foreground">
                {formatWalletType(wallet.type)}
              </td>
              <td className="px-4 py-3 text-sm text-foreground truncate max-w-xs">
                {wallet.address}
              </td>
              <td className="px-4 py-3 text-sm text-foreground">
                {wallet.createdAt ? 
                  format(new Date(wallet.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 
                  '-'
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StoreWalletsTable;
