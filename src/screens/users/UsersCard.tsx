import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import CardItem from '../../components/CardItem';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import UsersModal from './UsersModal';
import { User } from '../../models/types';
import userRepository from '../../repository/user-repository';
import { toast } from 'sonner';

export default function UsersCard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
  });
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['users', currentPage, itemsPerPage, filters, orderBy, orderDirection],
    () => userRepository.getUsers({
      page: currentPage,
      limit: itemsPerPage,
      ...filters,
      orderBy,
      order: orderDirection,
    }),
    {
      keepPreviousData: true,
      onError: (err) => {
        console.error('Erro ao carregar usuários:', err);
        toast.error('Não foi possível carregar os usuários. Tente novamente.');
      },
      onSettled: () => {
        setIsFiltering(false);
      }
    }
  );

  // Garantir que o estado de filtragem seja limpo após a conclusão de qualquer operação
  useEffect(() => {
    if (!isLoading) {
      setIsFiltering(false);
    }
  }, [isLoading]);

  const filterOptions = [
    {
      key: 'name',
      label: 'Nome',
      type: 'text' as const,
      placeholder: 'Buscar por nome',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text' as const,
      placeholder: 'Buscar por email',
    },
  ];

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    // Ativa o indicador de carregamento enquanto os filtros são aplicados
    setIsFiltering(true);
    
    // Se o objeto newFilters estiver vazio, resetamos todos os filtros
    if (Object.keys(newFilters).length === 0) {
      console.log("Limpando todos os filtros");
      setFilters({
        name: '',
        email: '',
      });
      
      // Força uma nova consulta ao limpar os filtros
      setTimeout(() => {
        queryClient.invalidateQueries(['users']);
      }, 100);
    } else {
      console.log("Aplicando filtros:", newFilters);
      // Atualizando apenas as propriedades fornecidas
      const updatedFilters = {
        name: '',
        email: '',
      };
      
      if (newFilters.name) updatedFilters.name = newFilters.name;
      if (newFilters.email) updatedFilters.email = newFilters.email;
      
      setFilters(updatedFilters);
    }
    
    // Resetar para a primeira página quando filtrar
    setCurrentPage(1);
  }, [queryClient]);

  // Adicionar suporte para mudar ordenação
  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setOrderBy(field);
    setOrderDirection(direction);
    setCurrentPage(1); // Voltar para a primeira página
  }, []);

  return (
    <div className="space-y-4">
      {/* Botão para expandir/contrair filtros em dispositivos móveis */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
        <div className="w-full sm:w-auto flex flex-col gap-3">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="sm:hidden px-4 py-2 bg-card border border-border rounded-md text-sm text-foreground font-medium flex justify-between items-center w-full"
          >
            <span>{filtersExpanded ? "Ocultar filtros" : "Ver filtros"}</span>
            {filtersExpanded ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </button>
          
          {/* Filtros visíveis em desktop ou quando expandidos em mobile */}
          <div className={`${filtersExpanded ? 'block' : 'hidden'} sm:block w-full`}>
            <FilterBar
              filters={filterOptions}
              onFilterChange={handleFilterChange}
              isLoading={isFiltering && isLoading}
            />
          </div>
        </div>
        
        {/* Ordenação - agora dentro do flex container principal */}
        <div className="w-full sm:w-auto mt-2 sm:mt-0">
          <div className="flex items-center">
            <label className="text-sm mr-2">Ordenar por:</label>
            <select 
              className="p-2 border border-border rounded-md bg-background text-sm flex-1 sm:flex-none" 
              value={`${orderBy}-${orderDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                handleSortChange(field, direction as 'asc' | 'desc');
              }}
            >
              <option value="createdAt-desc">Mais recentes</option>
              <option value="createdAt-asc">Mais antigos</option>
              <option value="email-asc">Email (A-Z)</option>
              <option value="email-desc">Email (Z-A)</option>
              <option value="firstName-asc">Nome (A-Z)</option>
              <option value="firstName-desc">Nome (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading || isFiltering ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-48 bg-card rounded-lg"></div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-1 text-center p-6 bg-card rounded-lg border border-border">
            <p className="text-status-rejected">Erro ao carregar os usuários. Tente novamente.</p>
            <button 
              onClick={() => {
                setIsFiltering(true);
                queryClient.invalidateQueries(['users']);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          data?.data.map((user) => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            const isMissingInfo = !fullName;

            return (
              <CardItem
                key={user.id}
                title={fullName || "sem informação"}
                titleClassName={isMissingInfo ? "text-red-500" : ""}
                onClick={() => setSelectedUser(user)}
              >
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{user.email || <span className="text-red-500">sem informação</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Documento:</span>
                    <span>{user.documentId ? 
                      `${user.documentType}: ${user.documentId}` : 
                      <span className="text-red-500">sem informação</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span>{user.phoneNumber || <span className="text-red-500">sem informação</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Função:</span>
                    <span className="capitalize">{user.role || <span className="text-red-500">sem informação</span>}</span>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-1/2"
                    leftIcon={<Eye className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(user);
                    }}
                  >
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-1/2"
                    leftIcon={<ExternalLink className="h-4 w-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/users/${user.id}`);
                    }}
                  >
                    Detalhes
                  </Button>
                </div>
              </CardItem>
            );
          })
        )}
      </div>

      {data && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.pagination.total}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {selectedUser && (
        <UsersModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}