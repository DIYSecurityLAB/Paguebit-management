import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Loading from '../../../components/Loading';
import Button from '../../../components/Button';
import { User } from '../../../domain/entities/User.entity';
import { UserRepository } from '../../../data/repository/user-repository';

// Importar componentes
import UserBasicInfo from './components/UserBasicInfo';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!id) return;
        setLoading(true);
        const userRepository = new UserRepository();
        const userData = await userRepository.getUserById(id);
        console.log('[UserDetail] userData response:', userData);
        // Corrigido: backend retorna o usuário puro, não { data: ... }
        if (userData && userData.id) {
          setUser(User.fromModel(userData));
        } else {
          setUser(null);
          setError('Usuário não encontrado');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  // Handler para atualizar o usuário após edições
  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (loading) return <Loading />;
  if (error) return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/users')} 
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Usuários
        </Button>
      </div>
      <div className="p-4 text-red-500">{error}</div>
    </div>
  );
  
  if (!user) return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/users')} 
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Usuários
        </Button>
      </div>
      <div className="p-4">Usuário não encontrado</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/users')} 
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Voltar para Usuários
        </Button>
        <h1 className="text-2xl font-bold ml-4">Detalhes do Usuário</h1>
      </div>
      
      {/* Informações do usuário */}
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UserBasicInfo user={user} onUserUpdate={handleUserUpdate} />
        </div>
        {/* Sempre exibe a(s) loja(s) do usuário */}
        {user.stores && user.stores.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Loja(s) vinculada(s)</h2>
            <ul className="space-y-2">
              {user.stores.map(store => (
                <li key={store.id} className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{store.id}</span>
                  {store.name && (
                    <span className="text-sm ml-2">{store.name}</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/stores/${store.id}`, '_blank')}
                    leftIcon={<ExternalLink className="h-4 w-4" />}
                  >
                    Abrir loja
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* Aqui você pode mostrar as lojas do usuário, se desejar */}
      {/* Exemplo:
      <div className="bg-card rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Lojas que participa</h2>
        <ul>
          {user.stores?.map(store => (
            <li key={store.id}>{store.name}</li>
          )) ?? <li>Nenhuma loja vinculada</li>}
        </ul>
      </div>
      */}
    </div>
  );
}