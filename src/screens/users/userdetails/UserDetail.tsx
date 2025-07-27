import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Loading from '../../../components/Loading';
import Button from '../../../components/Button';
import { User } from '../../../data/models/types';
import userRepository from '../../../data/repository/user-repository';

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
        const userData = await userRepository.getUserById(id);
        setUser(userData);
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