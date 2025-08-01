import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, ExternalLink, ChevronUp, ChevronDown, 
  ArrowUpDown, CalendarDays, Mail, User as UserIcon 
} from 'lucide-react';
import CardItem from '../../components/CardItem';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import UsersModal from './UsersModal';
import Select from '../../components/Select';
import { User } from '../../domain/entities/User.entity';
import { UserRepository } from '../../data/repository/user-repository';
import { toast } from 'sonner';

export default function UsersCard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    id: '',
    providerId: '',
    firstName: '',
    lastName: '',
    email: '',
    documentId: '',
    phoneNumber: '',
    documentType: '',
    referral: '',
    role: '',
    active: '',
    dateRangeFrom: '',
    dateRangeTo: ''
  });
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const queryClient = useQueryClient();
  const userRepository = useMemo(() => new UserRepository(), []);

  const { data, isLoading, error } = useQuery(
    ['users', currentPage, itemsPerPage, filters, orderBy, orderDirection],
    async () => {
      const req: any = {
        ...filters,
        page: String(currentPage),
        limit: String(itemsPerPage),
        orderBy,
        order: orderDirection,
      };
      if (filters.dateRangeFrom) req.createdAtFrom = filters.dateRangeFrom;
      if (filters.dateRangeTo) req.createdAtTo = filters.dateRangeTo;
      delete req.dateRangeFrom;
      delete req.dateRangeTo;
      Object.keys(req).forEach(k => req[k] === '' && delete req[k]);
      const res = await userRepository.listAllUsers(req);
      return res;
    },
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

  useEffect(() => {
    if (!isLoading) setIsFiltering(false);
  }, [isLoading]);

  const filterOptions = useMemo(() => [
    {
      key: 'id',
      label: 'ID',
      type: 'text' as const,
      placeholder: 'Buscar por ID',
    },
    {
      key: 'providerId',
      label: 'Provider ID',
      type: 'text' as const,
      placeholder: 'Buscar por Provider ID',
    },
    {
      key: 'firstName',
      label: 'Nome',
      type: 'text' as const,
      placeholder: 'Buscar por nome',
    },
    {
      key: 'lastName',
      label: 'Sobrenome',
      type: 'text' as const,
      placeholder: 'Buscar por sobrenome',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text' as const,
      placeholder: 'Buscar por email',
    },
    {
      key: 'documentId',
      label: 'Documento',
      type: 'text' as const,
      placeholder: 'Buscar por documento',
    },
    {
      key: 'phoneNumber',
      label: 'Telefone',
      type: 'text' as const,
      placeholder: 'Buscar por telefone',
    },
    {
      key: 'documentType',
      label: 'Tipo de Documento',
      type: 'text' as const,
      placeholder: 'Buscar por tipo de documento',
    },
    {
      key: 'referral',
      label: 'Indicação',
      type: 'text' as const,
      placeholder: 'Buscar por indicação',
    },
    {
      key: 'role',
      label: 'Função',
      type: 'select' as const,
      options: [
        { value: '', label: 'Todos' },
        { value: 'USER', label: 'Usuário' },
        { value: 'MANAGER', label: 'Administrador' },
        { value: 'SUPER_ADMIN', label: 'Super Admin' },
      ],
    },
    {
      key: 'active',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: '', label: 'Todos' },
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' },
      ],
    },
    {
      key: 'dateRange',
      label: 'Período de Criação',
      type: 'daterange' as const,
    },
  ], []);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setIsFiltering(true);

    // Se não houver filtros, zera todos os campos
    if (
      !newFilters ||
      Object.keys(newFilters).length === 0 ||
      Object.values(newFilters).every(v => v === '' || v === undefined)
    ) {
      setFilters({
        id: '',
        providerId: '',
        firstName: '',
        lastName: '',
        email: '',
        documentId: '',
        phoneNumber: '',
        documentType: '',
        referral: '',
        role: '',
        active: '',
        dateRangeFrom: '',
        dateRangeTo: ''
      });
      setCurrentPage(1);
      return;
    }

    // Sempre monta o objeto de filtros com todos os campos possíveis (vazios se não vierem)
    const updatedFilters: {
      id: string;
      providerId: string;
      firstName: string;
      lastName: string;
      email: string;
      documentId: string;
      phoneNumber: string;
      documentType: string;
      referral: string;
      role: string;
      active: string;
      dateRangeFrom: string;
      dateRangeTo: string;
    } = {
      id: '',
      providerId: '',
      firstName: '',
      lastName: '',
      email: '',
      documentId: '',
      phoneNumber: '',
      documentType: '',
      referral: '',
      role: '',
      active: '',
      dateRangeFrom: '',
      dateRangeTo: ''
    };

    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key] !== undefined) {
        // @ts-expect-error: pode haver chaves extras, mas só as conhecidas serão usadas
        updatedFilters[key] = newFilters[key];
      }
    });

    setFilters(updatedFilters);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setOrderBy(field);
    setOrderDirection(direction);
    setCurrentPage(1);
  }, []);

  const sortOptions = [
    { 
      value: 'createdAt-desc', 
      label: 'Mais recentes', 
      icon: <CalendarDays className="h-4 w-4 text-purple-500" /> 
    },
    { 
      value: 'createdAt-asc', 
      label: 'Mais antigos', 
      icon: <CalendarDays className="h-4 w-4 text-blue-500" /> 
    },
    { 
      value: 'email-asc', 
      label: 'Email (A-Z)', 
      icon: <Mail className="h-4 w-4 text-green-500" /> 
    },
    { 
      value: 'email-desc', 
      label: 'Email (Z-A)', 
      icon: <Mail className="h-4 w-4 text-red-500" /> 
    },
    { 
      value: 'firstName-asc', 
      label: 'Nome (A-Z)', 
      icon: <UserIcon className="h-4 w-4 text-cyan-500" /> 
    },
    { 
      value: 'firstName-desc', 
      label: 'Nome (Z-A)', 
      icon: <UserIcon className="h-4 w-4 text-orange-500" /> 
    },
  ];

  // Converte UserModel para User entity
  const users: User[] = Array.isArray(data?.data)
    ? data!.data.map((model: any) => User.fromModel(model))
    : [];

  // Função para buscar detalhes completos do usuário ao abrir o modal
  const handleOpenUserModal = async (user: User) => {
    setModalLoading(true);
    try {
      const userRepository = new UserRepository();
      const userData = await userRepository.getUserById(user.id);
      if (userData && userData.id) {
        setSelectedUser(User.fromModel(userData));
      } else {
        toast.error('Não foi possível carregar detalhes do usuário.');
      }
    } catch (err) {
      toast.error('Erro ao buscar detalhes do usuário.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho e filtros */}
      <div className="space-y-3">
        {/* Botão de expansão de filtros (apenas mobile) */}
        <div className="sm:hidden">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-md text-sm font-medium flex justify-between items-center"
          >
            <span>{filtersExpanded ? "Ocultar filtros" : "Exibir filtros"}</span>
            {filtersExpanded ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </button>
        </div>
        
        {/* Filtros (visíveis em desktop ou quando expandidos em mobile) */}
        <div className={`${filtersExpanded ? 'block' : 'hidden'} sm:block w-full`}>
          <FilterBar
            filters={filterOptions}
            onFilterChange={handleFilterChange}
            isLoading={isFiltering && isLoading}
          />
        </div>

        {/* Ordenação em um card separado com design aprimorado */}
        <div className="p-4 bg-card border border-border rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-sm font-medium flex items-center whitespace-nowrap">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              Ordenar por:
            </label>
            <div className="w-full sm:w-64">
              <Select
                options={sortOptions}
                value={`${orderBy}-${orderDirection}`}
                onChange={(value) => {
                  const [field, direction] = value.split('-');
                  handleSortChange(field, direction as 'asc' | 'desc');
                }}
              />
            </div>
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
        ) : !users.length ? (
          <div className="col-span-1 text-center p-6 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
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
          users.map((user) => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            const isMissingInfo = !fullName;

            return (
              <CardItem
                key={user.id}
                title={fullName || "sem informação"}
                titleClassName={isMissingInfo ? "text-red-500" : ""}
                onClick={() => handleOpenUserModal(user)}
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
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleOpenUserModal(user);
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

      {data && typeof data.total === 'number' && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.total}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Modal detalhado do usuário */}
      {selectedUser && (
        <UsersModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          loading={modalLoading}
        />
      )}
    </div>
  );
}