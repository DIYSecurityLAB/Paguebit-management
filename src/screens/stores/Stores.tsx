import ExcelExport from '../../components/ExcelExport';
import StoresTable from './StoresTable';
import StoresCard from './StoresCard';
import ViewToggle from '../../components/ViewToggle';
import { StoreRepository } from '../../data/repository/store-repository';
import { Store } from '../../domain/entities/Store.entity';
import { toast } from 'sonner';

export default function Stores() {
  const storeRepository = new StoreRepository();

  const exportStores = async () => {
    try {
      const res = await storeRepository.listStores({
        limit: '1000',
        orderBy: 'createdAt',
        order: 'desc'
      });
      return (res.data || []).map((model: any) => Store.fromModel(model));
    } catch (error) {
      console.error('Erro ao exportar lojas:', error);
      toast.error('Erro ao exportar relatório de lojas');
      throw error;
    }
  };

  const transformStoreData = (stores: Store[]) => {
    return stores.map(store => ({
      'ID': store.id || '-',
      'Nome': store.name || 'Não informado',
      'OwnerId': store.ownerId || 'Não informado',
      'WhitelabelId': store.whitelabelId || 'Não informado',
      'Criado em': store.createdAt || 'Não informado',
      'Atualizado em': store.updatedAt || 'Não informado',
    }));
  };

  const columnWidths = {
    'ID': 38,
    'Nome': 28,
    'OwnerId': 35,
    'WhitelabelId': 20,
    'Criado em': 20,
    'Atualizado em': 20,
  };

  const headerStyle = {
    backgroundColor: '4B5563',
    fontColor: 'FFFFFF',
    fontSize: 12,
    bold: true
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Lojas</h1>
        <ExcelExport
          onExport={exportStores}
          filename="relatorio_lojas"
          sheetName="Lojas"
          buttonText="Exportar para Excel"
          transformData={transformStoreData}
          columnWidths={columnWidths}
          headerStyle={headerStyle}
        />
      </div>
      <ViewToggle
        storageKey="storesViewMode"
        tableView={<StoresTable />}
        cardView={<StoresCard />}
      />
    </div>
  );
}
