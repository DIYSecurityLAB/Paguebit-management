import ExcelExport from '../../components/ExcelExport';
import UsersTable from './UsersTable';
import UsersCard from './UsersCard';
import ViewToggle from '../../components/ViewToggle';
import userRepository from '../../repository/user-repository';
import { User } from '../../models/types';
import { toast } from 'sonner';

export default function Users() {
  // Função simplificada para exportar todos os usuários
  const exportUsers = async () => {
    try {
      // Agora retorna diretamente um array de usuários
      const users = await userRepository.exportUsers();
      return users;
    } catch (error) {
      console.error('Erro ao exportar usuários:', error);
      toast.error('Erro ao exportar relatório de usuários');
      throw error;
    }
  };

  // Função para transformar os dados antes da exportação
  const transformUserData = (users: User[]) => {
    return users.map(user => {
      // Grupo de informações principais
      const mainData = {
        'ID': user.id || '-',
        'Nome Completo': `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Não informado',
        'Email': user.email || 'Não informado',
        'Tipo de Documento': user.documentType || 'Não informado',
        'Documento': user.documentId || 'Não informado',
        'Telefone': user.phoneNumber || 'Não informado',
        'Função': user.role?.toUpperCase() || 'Não informado',
      };
      
      // Grupo de carteiras
      const walletData = {
        'Carteira BTC': user.wallets?.OnChainAddress || '-',
        'Carteira Lightning': user.wallets?.LightningAddress || '-',
        'Carteira Liquid': user.wallets?.LiquidAddress || '-',
        'Carteira Tron': user.wallets?.TronAddress || '-',
        'Carteira Polygon': user.wallets?.PolygonAddress || '-',
      };
      
      return {
        ...mainData,
        ...walletData
      };
    });
  };

  // Definir larguras de colunas personalizadas (em caracteres)
  const columnWidths = {
    'ID': 38,
    'Nome Completo': 28,
    'Email': 35,
    'Tipo de Documento': 15,
    'Documento': 20,
    'Telefone': 20,
    'Função': 12,
    'Carteira BTC': 50,
    'Carteira Lightning': 50,
    'Carteira Liquid': 50,
    'Carteira Tron': 50,
    'Carteira Polygon': 50,
  };

  // Definir estilo do cabeçalho com cores no formato correto (sem #)
  const headerStyle = {
    backgroundColor: '4B5563', // Cinza escuro sem #
    fontColor: 'FFFFFF',       // Branco sem #
    fontSize: 12,
    bold: true
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <ExcelExport
          onExport={exportUsers}
          filename="relatorio_usuarios"
          sheetName="Usuários"
          buttonText="Exportar para Excel"
          transformData={transformUserData}
          columnWidths={columnWidths}
          headerStyle={headerStyle}
        />
      </div>

      <ViewToggle
        storageKey="usersViewMode"
        tableView={<UsersTable />}
        cardView={<UsersCard />}
      />
    </div>
  );
}