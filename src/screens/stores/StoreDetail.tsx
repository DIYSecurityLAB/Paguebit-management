import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import { Store } from '../../domain/entities/Store.entity';
import { StoreRepository } from '../../data/repository/store-repository';
import StoreDashboard from './components/dashboard/StoreDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import StoreUsersTable from './components/tables/StoreUsersTable';
import StoreWalletsTable from './components/tables/StoreWalletsTable';
import StoreFeeRules from './components/fee-rules/StoreFeeRules';

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!id) return;
        setLoading(true);
        const storeRepository = new StoreRepository();
        const storeData = await storeRepository.getStoreById(id);
        const model = (storeData as any).data ? (storeData as any).data : storeData;
        setStore(Store.fromModel(model));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/stores')} 
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Lojas
        </Button>
      </div>
      <div className="p-4 text-red-500">{error}</div>
    </div>
  );
  
  if (!store) return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/stores')} 
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Lojas
        </Button>
      </div>
      <div className="p-4">Loja não encontrada</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/stores')} 
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Lojas
        </Button>
        <h1 className="text-2xl font-bold ml-4">Detalhes da Loja: {store.name}</h1>
      </div>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="fee-rules">Taxas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="p-1">
          <StoreDashboard store={store} />
        </TabsContent>
        
        <TabsContent value="info">
          <div className="bg-card rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <p className="text-foreground">{store.name}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">OwnerId</label>
                <p className="text-foreground">{store.ownerId}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">WhitelabelId</label>
                <p className="text-foreground">{store.whitelabelId}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Criado em</label>
                <p className="text-foreground">{store.createdAt ? new Date(store.createdAt).toLocaleString() : 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Atualizado em</label>
                <p className="text-foreground">{store.updatedAt ? new Date(store.updatedAt).toLocaleString() : 'Não informado'}</p>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Carteiras Cadastradas</h3>
              <StoreWalletsTable wallets={store.wallets || []} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Usuários vinculados</h2>
            <StoreUsersTable
              users={store.users || []}
              ownerId={store.ownerId}
              ownerEmail={undefined}
              ownerName={"Owner"}
              ownerWhitelabelId={store.whitelabelId}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="fee-rules">
          <div className="bg-card rounded-lg shadow-md p-6">
            <StoreFeeRules storeId={store.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
    