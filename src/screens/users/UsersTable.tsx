import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, ExternalLink, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import Table, { TableColumn } from '../../components/Table';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import UsersModal from './UsersModal';
import { User } from '../../models/types';
import userRepository from '../../repository/user-repository';
import { toast } from 'sonner';

export default function UsersTable() {
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

  const filterOptions = useMemo(() => [
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
  ], []);

  // Handler para ordenação
  const handleSort = useCallback((column: string) => {
    if (orderBy === column) {
      // Se já está ordenando por essa coluna, inverte a direção
      setOrderDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Se não, define a nova coluna e começa por ordem descendente
      setOrderBy(column);
      setOrderDirection('desc');
    }
    // Volta para a primeira página ao ordenar
    setCurrentPage(1);
  }, [orderBy]);

  // Mapeia as colunas disponíveis na UI para os campos da API
  const sortableColumns: Record<string, string> = {
    'createdAt': 'createdAt',
    'email': 'email',
    'firstName': 'firstName',
  };

  const columns = useMemo<TableColumn<User>[]>(() => [
    {
      header: 'Nome',
      accessor: (user: User) => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return fullName ? 
          fullName : 
          <span className="text-red-500">sem informação</span>;
      },
      sortKey: 'firstName',
      sortable: true,
    },
    {
      header: 'Email',
      accessor: (user: User) => 
        user.email || <span className="text-red-500">sem informação</span>,
      sortKey: 'email',
      sortable: true,
    },
    {
      header: 'Documento',
      accessor: (user: User) => {
        const document = user.documentId ? 
          `${user.documentType}: ${user.documentId}` : 
          null;
        return document || <span className="text-red-500">sem informação</span>;
      },
    },
    {
      header: 'Telefone',
      accessor: (user: User) => 
        user.phoneNumber ? user.phoneNumber : (<span className="text-red-500">sem informação</span>),
    },
    {
      header: 'Função',
      accessor: (user: User) => (
        user.role ? 
          <span className="capitalize">{user.role}</span> :
          <span className="text-red-500">sem informação</span>
      ),
    },
    {
      header: 'Ações',
      accessor: (user: User) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
            }}
            leftIcon={<Eye className="h-4 w-4" />}
          >
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/users/${user.id}`);
            }}
            leftIcon={<ExternalLink className="h-4 w-4" />}
          >
            Detalhes
          </Button>
        </div>
      ),
    },
  ], [navigate]);

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

  return (
    <div className="space-y-4">
      {/* Botão para expandir/contrair filtros em dispositivos móveis */}
      <div className="sm:hidden mb-4">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="px-4 py-2 bg-card border border-border rounded-md text-sm text-foreground font-medium flex justify-between items-center w-full"
        >
          <span>{filtersExpanded ? "Ocultar filtros" : "Ver filtros"}</span>
          {filtersExpanded ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
        </button>
      </div>

      {/* Filtros visíveis em desktop ou quando expandidos em mobile */}
      <div className={`${filtersExpanded ? 'block' : 'hidden'} sm:block`}>
        <FilterBar
          filters={filterOptions}
          onFilterChange={handleFilterChange}
          className="mb-4"
          isLoading={isFiltering && isLoading}
        />
      </div>

      {error ? (
        <div className="text-center p-6 bg-card rounded-lg border border-border">
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
        <Table
          data={data?.data || []}
          columns={columns}
          isLoading={isLoading || isFiltering}
          sortColumn={orderBy}
          sortDirection={orderDirection}
          onSort={handleSort}
        />
      )}

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