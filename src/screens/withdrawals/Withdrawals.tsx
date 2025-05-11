import ViewToggle from '../../components/ViewToggle';
import WithdrawalsTable from './WithdrawalsTable';
import WithdrawalsCard from './WithdrawalsCard';
import ExcelExport from '../../components/ExcelExport';
import withdrawalRepository from '../../repository/withdrawal-repository';
import { Withdrawal } from '../../models/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Withdrawals() {
  // Função para exportar todos os saques
  const exportWithdrawals = async () => {
    try {
      // Buscar todos os saques para exportação
      const response = await withdrawalRepository.getWithdrawals({
        limit: 1000, // Limite alto para exportar o máximo possível
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

  // Função para transformar os dados de saques para o formato Excel
  const transformWithdrawalData = (withdrawals: Withdrawal[]) => {
    return withdrawals.map(withdrawal => {
      // Extrair informações do usuário
      const user = (withdrawal as any).User;
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
      const userEmail = user?.email || '';
      
      // Tradução dos status para o relatório
      const statusTranslation: Record<string, string> = {
        'pending': 'Pendente',
        'processing': 'Processando',
        'completed': 'Concluído',
        'failed': 'Falha'
      };

      // Formatar os dados para o Excel
      return {
        'ID': withdrawal.id || '-',
        'Usuário': userName || 'Não informado',
        'Email': userEmail || 'Não informado',
        'ID do Usuário': withdrawal.userId || 'Não informado',
        'Valor': withdrawal.amount || 0,
        'Status': statusTranslation[withdrawal.status] || withdrawal.status || 'Não informado',
        'Tipo de Carteira': withdrawal.destinationWalletType || 'Não informado',
        'Carteira de Destino': withdrawal.destinationWallet || 'Não informado',
        'ID da Transação': withdrawal.txId || '-',
        'Data de Criação': withdrawal.createdAt ? format(new Date(withdrawal.createdAt), 'dd/MM/yyyy HH:mm:ss') : 'Não informado',
        'Data de Conclusão': withdrawal.completedAt ? format(new Date(withdrawal.completedAt), 'dd/MM/yyyy HH:mm:ss') : '-',
        'Motivo da Falha': withdrawal.failedReason || '-',
        'Observações': withdrawal.notes || '-'
      };
    });
  };

  // Definir larguras de colunas personalizadas (em caracteres)
  const columnWidths = {
    'ID': 38,
    'Usuário': 30,
    'Email': 35,
    'ID do Usuário': 38,
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