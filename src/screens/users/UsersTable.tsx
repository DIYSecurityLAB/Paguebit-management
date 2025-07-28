import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, ExternalLink, ChevronUp, ChevronDown,
  ArrowUpDown, CalendarDays, Mail, User as UserIcon
} from 'lucide-react';
import Table, { TableColumn } from '../../components/Table';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import UsersModal from './UsersModal';
import { User } from '../../domain/entities/User.entity';
import { UserRepository } from '../../data/repository/user-repository';
import { toast } from 'sonner';
import Select from '../../components/Select';

export default function UsersTable() {
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

  const queryClient = useQueryClient();
  const userRepository = useMemo(() => new UserRepository(), []);

  const { data, isLoading, error } = useQuery(
    ['users', currentPage, itemsPerPage, filters, orderBy, orderDirection],
    async () => {
      // Monta o objeto de request conforme o model
      const req: any = {
        ...filters,
        page: String(currentPage),
        limit: String(itemsPerPage),
        orderBy,
        order: orderDirection,
      };
      // Ajusta range de datas se necessário
      if (filters.dateRangeFrom) req.createdAtFrom = filters.dateRangeFrom;
      if (filters.dateRangeTo) req.createdAtTo = filters.dateRangeTo;
      delete req.dateRangeFrom;
      delete req.dateRangeTo;
      // Remove campos vazios
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

  const handleSort = useCallback((column: string) => {
    if (orderBy === column) {
      setOrderDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(column);
      setOrderDirection('desc');
    }
    setCurrentPage(1);
  }, [orderBy]);

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
    setIsFiltering(true);
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

  return (
    <div className="space-y-4">
      <div className="space-y-3">
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
        <div className={`${filtersExpanded ? 'block' : 'hidden'} sm:block`}>
          <FilterBar
            filters={filterOptions}
            onFilterChange={handleFilterChange}
            className="mb-4"
            isLoading={isFiltering && isLoading}
          />
        </div>
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
                  setOrderBy(field);
                  setOrderDirection(direction as 'asc' | 'desc');
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>
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
          data={users}
          columns={columns}
          isLoading={isLoading || isFiltering}
          sortColumn={orderBy}
          sortDirection={orderDirection}
          onSort={handleSort}
        />
      )}

      {data && typeof data.total === 'number' && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.total}
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