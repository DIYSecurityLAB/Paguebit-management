import { useState } from 'react';
import ViewToggle from '../../components/ViewToggle';
import WithdrawalsTable from './WithdrawalsTable';
import WithdrawalsCard from './WithdrawalsCard';
import ExcelExport from '../../components/ExcelExport';
import { WithdrawalRepository } from '../../data/repository/withdrawal-repository';
import { Withdrawal } from '../../domain/entities/Withdrawal.entity';
import { WithdrawalModel } from '../../data/model/withdrawal.model';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Tabs, TabsList, TabsTrigger } from '../../components/tabs';
import WithdrawalAccountingView from './WithdrawalAccountingView';
import { Calculator, ListFilter  } from 'lucide-react';

export default function Withdrawals() {
  const withdrawalRepository = new WithdrawalRepository();
  const [viewMode, setViewMode] = useState<'default' | 'accounting'>('default');

  // Função para exportar todos os saques (visualização padrão)
  const exportWithdrawals = async () => {
    try {
      const response = await withdrawalRepository.listWithdrawals({
        limit: '1000',
        orderBy: 'createdAt',
        order: 'desc'
      });
      return response.data || [];
    } catch (error) {
      console.error('Erro ao exportar saques:', error);
      toast.error('Erro ao exportar relatório de saques');
      throw error;
    }
  };

  // Função para transformar os dados de saques para o formato Excel (visualização padrão)
  const transformWithdrawalData = (withdrawals: WithdrawalModel[]) => {
    return withdrawals.map(model => {
      const withdrawal = Withdrawal.fromModel(model);
      const fee = withdrawal.feesDetail && withdrawal.feesDetail.length > 0 ? withdrawal.feesDetail[0] : undefined;
      const statusTranslation: Record<string, string> = {
        'pending': 'Pendente',
        'completed': 'Concluído',
        'failed': 'Falha'
      };
      return {
        'ID': withdrawal.id || '-',
        'ID da Loja': withdrawal.storeId || 'Não informado',
        'ID do Whitelabel': withdrawal.whitelabelId || 'Não informado',
        'Valor': formatCurrency(withdrawal.amount),
        'Status': statusTranslation[withdrawal.status] || withdrawal.status || 'Não informado',
        'Tipo de Carteira': withdrawal.destinationWalletType || 'Não informado',
        'Carteira de Destino': withdrawal.destinationWallet || 'Não informado',
        'ID da Transação': withdrawal.txId || '-',
        'Data de Criação': withdrawal.createdAt ? formatDateTime(withdrawal.createdAt) : 'Não informado',
        'Data de Conclusão': withdrawal.completedAt ? formatDateTime(withdrawal.completedAt) : '-',
        'Motivo da Falha': withdrawal.failedReason || '-',
        'Observações': withdrawal.notes || '-',
        'Valor Cobrado WL': formatCurrency(Number(fee?.whitelabelTotal || 0)),
        'Repasse WL': formatCurrency(Number(fee?.whitelabelNet || 0)),
        'Repasse Plataforma': formatCurrency(Number(fee?.platformTotal || 0)),
      };
    });
  };

  // Função para exportar dados para o Excel no modo Prestação de Contas
  const exportAccountingWithdrawals = async () => {
    try {
      const response = await withdrawalRepository.listWithdrawals({
        limit: '1000',
        orderBy: 'createdAt',
        order: 'desc'
      });
      return response.data || [];
    } catch (error) {
      console.error('Erro ao exportar saques:', error);
      toast.error('Erro ao exportar relatório de prestação de contas');
      throw error;
    }
  };

  // Função para transformar os dados para o Excel no modo Prestação de Contas
  const transformAccountingWithdrawalData = (withdrawals: WithdrawalModel[]) => {
    return withdrawals.map(model => {
      const withdrawal = Withdrawal.fromModel(model);
      const fee = withdrawal.feesDetail && withdrawal.feesDetail.length > 0 ? withdrawal.feesDetail[0] : undefined;
      const statusTranslation: Record<string, string> = {
        'pending': 'Pendente',
        'completed': 'Concluído',
        'failed': 'Falha'
      };
      return {
        'Status': statusTranslation[withdrawal.status] || withdrawal.status || '-',
        'Data': withdrawal.createdAt ? formatDateTime(withdrawal.createdAt) : '-',
        'Loja': withdrawal.store?.name || (withdrawal.storeId ? withdrawal.storeId.substring(0, 8) + '...' : '-'),
        'Valor do Saque': formatCurrency(Number(withdrawal.amount || 0)),
        'Valor Cobrado WL': formatCurrency(Number(fee?.whitelabelTotal || 0)),
        'Repasse WL': formatCurrency(Number(fee?.whitelabelNet || 0)),
        'Repasse Plataforma': formatCurrency(Number(fee?.platformTotal || 0)),
      };
    });
  };

  // Larguras de colunas para o modo padrão
  const columnWidths = {
    'ID': 10,
    'ID da Loja': 18,
    'ID do Whitelabel': 18,
    'Valor': 14,
    'Status': 14,
    'Tipo de Carteira': 18,
    'Carteira de Destino': 18,
    'ID da Transação': 18,
    'Data de Criação': 22,
    'Data de Conclusão': 22,
    'Motivo da Falha': 18,
    'Observações': 18,
    'Valor Cobrado WL': 18,
    'Repasse WL': 18,
    'Repasse Plataforma': 18,
  };

  // Larguras de colunas para o modo Prestação de Contas
  const accountingColumnWidths = {
    'Status': 15,
    'Data': 20,
    'Loja': 30,
    'Valor do Saque': 18,
    'Valor Cobrado WL': 18,
    'Repasse WL': 18,
    'Repasse Plataforma': 18,
  };

  // Definir estilo do cabeçalho
  const headerStyle = {
    backgroundColor: '4B5563', // Cinza escuro sem #
    fontColor: 'FFFFFF',       // Branco sem #
    fontSize: 12,
    bold: true
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Saques</h1>
        <div className="flex gap-3">
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as 'default' | 'accounting')}
            className="bg-card border border-border rounded-md"
          >
            <TabsList>
              <TabsTrigger value="default" className="flex items-center gap-2">
                <ListFilter className="h-4 w-4" />
                <span className="hidden sm:inline">Visualização Padrão</span>
                <span className="sm:hidden">Padrão</span>
              </TabsTrigger>
              <TabsTrigger value="accounting" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Prestação de Contas</span>
                <span className="sm:hidden">Contas</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {viewMode === 'default' ? (
            <ExcelExport
              onExport={exportWithdrawals}
              filename="relatorio_saques"
              sheetName="Saques"
              buttonText="Exportar"
              transformData={transformWithdrawalData}
              columnWidths={columnWidths}
              headerStyle={headerStyle}
            />
          ) : (
            <ExcelExport
              onExport={exportAccountingWithdrawals}
              filename="prestacao_contas_saques"
              sheetName="PrestacaoContas"
              buttonText="Exportar"
              transformData={transformAccountingWithdrawalData}
              columnWidths={accountingColumnWidths}
              headerStyle={headerStyle}
            />
          )}
        </div>
      </div>

      {viewMode === 'default' ? (
        <ViewToggle
          storageKey="withdrawals-view-mode"
          tableView={<WithdrawalsTable />}
          cardView={<WithdrawalsCard />}
        />
      ) : (
        <WithdrawalAccountingView />
      )}
    </div>
  );
}