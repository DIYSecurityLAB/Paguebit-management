import ViewToggle from '../../components/ViewToggle';
import WithdrawalsTable from './WithdrawalsTable';
import WithdrawalsCard from './WithdrawalsCard';
import ExcelExport from '../../components/ExcelExport';
import { WithdrawalRepository } from '../../data/repository/withdrawal-repository';
import { Withdrawal } from '../../domain/entities/Withdrawal.entity';
import { WithdrawalModel } from '../../data/model/withdrawal.model';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '../../utils/format';

export default function Withdrawals() {
  const withdrawalRepository = new WithdrawalRepository();

  // Função para exportar todos os saques
  const exportWithdrawals = async () => {
    try {
      // Buscar todos os saques para exportação
      const response = await withdrawalRepository.listWithdrawals({
        limit: '1000', // string, conforme tipagem do repo
        orderBy: 'createdAt',
        order: 'desc'
      });
      // Retorna WithdrawalModel[]
      return response.data || [];
    } catch (error) {
      console.error('Erro ao exportar saques:', error);
      toast.error('Erro ao exportar relatório de saques');
      throw error;
    }
  };

  // Função para transformar os dados de saques para o formato Excel
  const transformWithdrawalData = (withdrawals: WithdrawalModel[]) => {
    return withdrawals.map(model => {
      const withdrawal = Withdrawal.fromModel(model);

      // Tradução dos status para o relatório
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
        'Observações': withdrawal.notes || '-'
      };
    });
  };

  // Definir larguras de colunas personalizadas (em caracteres)
  const columnWidths = {
    'ID': 38,
    'ID da Loja': 30,
    'ID do Whitelabel': 35,
    'Valor': 15,
    'Status': 15,
    'Tipo de Carteira': 20,
    'Carteira de Destino': 50,
    'ID da Transação': 40,
    'Data de Criação': 20,
    'Data de Conclusão': 20,
    'Motivo da Falha': 40,
    'Observações': 50,
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
        <ExcelExport
          onExport={exportWithdrawals}
          filename="relatorio_saques"
          sheetName="Saques"
          buttonText="Exportar para Excel"
          transformData={transformWithdrawalData}
          columnWidths={columnWidths}
          headerStyle={headerStyle}
        />
      </div>

      <ViewToggle
        storageKey="withdrawals-view-mode"
        tableView={<WithdrawalsTable />}
        cardView={<WithdrawalsCard />}
      />
    </div>
  );
}