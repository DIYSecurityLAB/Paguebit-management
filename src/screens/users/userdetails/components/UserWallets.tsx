import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { User } from '../../../../models/types';
import { toast } from 'sonner';

interface UserWalletsProps {
  user: User;
}

export default function UserWallets({ user }: UserWalletsProps) {
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  // Função para copiar o endereço da carteira
  const handleCopyWallet = (walletType: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedWallet(walletType);
    toast.success('Endereço copiado com sucesso!');
    
    // Limpar a mensagem de copiado após alguns segundos
    setTimeout(() => {
      setCopiedWallet(null);
    }, 1500);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Carteiras</h2>
      <div className="space-y-4">
        {Object.entries(user.wallets).map(([type, address]) => (
          address && (
            <div key={type}>
              <label className="text-sm text-muted-foreground">{type}</label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-foreground break-all flex-1">{address}</p>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                  onClick={() => handleCopyWallet(type, address)}
                  title="Copiar endereço da carteira"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {copiedWallet === type && (
                  <span className="text-xs text-green-600 ml-1">Copiado!</span>
                )}
              </div>
            </div>
          )
        ))}
        {!Object.values(user.wallets).some(Boolean) && (
          <p className="text-sm text-muted-foreground">Nenhuma carteira configurada</p>
        )}
      </div>
    </div>
  );
}
