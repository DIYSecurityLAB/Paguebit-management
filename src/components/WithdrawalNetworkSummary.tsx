import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { WithdrawalRepository } from '../data/repository/withdrawal-repository';
import { Withdrawal } from '../domain/entities/Withdrawal.entity';
import { WithdrawalModel } from '../data/model/withdrawal.model';
import { formatCurrency } from '../utils/format';
import { Coins } from 'lucide-react';

interface NetworkSummary {
  networkType: string;
  totalAmount: number;
  displayName: string;
  icon: string;
}

export default function WithdrawalNetworkSummary() {
  const [networkSummaries, setNetworkSummaries] = useState<NetworkSummary[]>([]);
  const withdrawalRepository = new WithdrawalRepository();

  // Buscar todos os saques pendentes para calcular o resumo por rede
  const { data, isLoading } = useQuery(
    ['pending-withdrawals-summary'],
    async () => {
      // Busca apenas saques pendentes para o resumo
      const response = await withdrawalRepository.listWithdrawals({
        status: 'pending',
        limit: '1000' // Limite alto para pegar todos os pendentes (string pois o tipo espera string)
      });
      // Garante que sempre retorna array de WithdrawalModel
      if (response && Array.isArray(response.data)) {
        return response.data;
      }
      if (response && response.data && typeof response.data === 'object' && 'length' in response.data) {
        return Array.from(response.data) as WithdrawalModel[];
      }
      return [];
    },
    {
      refetchInterval: 60000, // Atualiza a cada 1 minuto
      staleTime: 30000 // Considera os dados obsoletos após 30 segundos
    }
  );

  // Mapeamento de tipos de rede para exibição amigável
  const networkDisplayInfo: Record<string, { name: string, icon: string }> = {
    'OnChainAddress': { name: 'Bitcoin OnChain', icon: '₿' },
    'LightningAddress': { name: 'Lightning', icon: '⚡' },
    'LiquidAddress': { name: 'Liquid', icon: '💧' },
    'TronAddress': { name: 'Tron (USDT)', icon: '🔷' },
    'PolygonAddress': { name: 'Polygon (USDT)', icon: '⬡' },
  };

  // Calcula o resumo sempre que os dados mudam
  useEffect(() => {
    // Garante que data é sempre array de WithdrawalModel
    const withdrawals: WithdrawalModel[] = Array.isArray(data) ? data : [];
    if (!withdrawals || withdrawals.length === 0) {
      setNetworkSummaries([]);
      return;
    }

    // Converte WithdrawalModel para Withdrawal entity para garantir validação e métodos
    const withdrawalEntities = withdrawals.map(w => Withdrawal.fromModel(w));

    // Agrupar saques por tipo de rede e somar valores
    const summary = withdrawalEntities.reduce((acc: Record<string, number>, withdrawal) => {
      const networkType = withdrawal.destinationWalletType;
      if (!acc[networkType]) {
        acc[networkType] = 0;
      }
      acc[networkType] += withdrawal.amount || 0;
      return acc;
    }, {});

    // Formatar os dados para exibição
    const formattedSummaries = Object.entries(summary)
      .map(([networkType, totalAmount]) => {
        const displayInfo = networkDisplayInfo[networkType] || 
          { name: networkType, icon: '?' };
        
        return {
          networkType,
          totalAmount,
          displayName: displayInfo.name,
          icon: displayInfo.icon
        };
      })
      .filter(item => item.totalAmount > 0) // Remove redes com valor zero
      .sort((a, b) => b.totalAmount - a.totalAmount); // Ordena por valor (maior primeiro)

    setNetworkSummaries(formattedSummaries);
  }, [data]);

  // Se não há dados ou está carregando, não exibe nada
  if (isLoading || networkSummaries.length === 0) {
    return (
      <div className="mb-4 bg-card border border-border rounded-lg p-4 shadow-sm text-center text-muted-foreground">
        Nenhum saque pendente disponível para resumo por rede.
      </div>
    );
  }

  return (
    <div className="mb-4 bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center mb-3">
        <Coins className="h-4 w-4 mr-2 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Valores pendentes por rede
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {networkSummaries.map((summary) => (
          <div 
            key={summary.networkType}
            className="px-3 py-2 bg-muted rounded-md flex items-center"
          >
            <span className="text-lg mr-2">{summary.icon}</span>
            <div>
              <span className="text-xs text-muted-foreground block">
                {summary.displayName}
              </span>
              <span className="font-medium text-sm">
                {formatCurrency(summary.totalAmount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
