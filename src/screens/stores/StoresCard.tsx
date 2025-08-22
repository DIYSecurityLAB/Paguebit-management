import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, ExternalLink, ChevronUp, ChevronDown, ArrowUpDown, CalendarDays, User as UserIcon } from 'lucide-react';
import CardItem from '../../components/CardItem';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import StoresModal from './StoresModal';
import Select from '../../components/Select';
import { Store } from '../../domain/entities/Store.entity';
import { StoreRepository } from '../../data/repository/store-repository';
import { toast } from 'sonner';

export default function StoresCard() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const initialFilters = {
    id: '',
    name: '',
    ownerId: '',
    ownerEmail: '',
    paymentId: '',
    withdrawalId: '',
    createdAtFrom: '',
    createdAtTo: '',
    updatedAtFrom: '',
    updatedAtTo: ''
  };
  const [filters, setFilters] = useState(initialFilters);
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const queryClient = useQueryClient();
  const storeRepository = useMemo(() => new StoreRepository(), []);

  const { data, isLoading, error } = useQuery(
    ['stores', currentPage, itemsPerPage, filters, orderBy, orderDirection],
    async () => {
      const req: any = {
        ...filters,
        page: String(currentPage),
        limit: String(itemsPerPage),
        orderBy,
        order: orderDirection,
      };
      Object.keys(req).forEach(k => req[k] === '' && delete req[k]);
      const res = await storeRepository.listStores(req);
      return res;
    },
    {
      keepPreviousData: true,
      onError: (err) => {
        console.error('Erro ao carregar lojas:', err);
        toast.error('Não foi possível carregar as lojas. Tente novamente.');
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
      label: 'ID da Loja',
      type: 'text' as const,
      placeholder: 'Buscar por ID da loja',
    },
    {
      key: 'name',
      label: 'Nome da Loja',
      type: 'text' as const,
      placeholder: 'Buscar por nome da loja',
    },
    {
      key: 'ownerId',
      label: 'ID do Dono',
      type: 'text' as const,
      placeholder: 'Buscar por ID do dono',
    },
    {
      key: 'ownerEmail',
      label: 'Email do Dono',
      type: 'text' as const,
      placeholder: 'Buscar por email do dono',
    },
    {
      key: 'paymentId',
      label: 'ID do Pagamento',
      type: 'text' as const,
      placeholder: 'Buscar por ID do pagamento',
    },
    {
      key: 'withdrawalId',
      label: 'ID do Saque',
      type: 'text' as const,
      placeholder: 'Buscar por ID do saque',
    },
    {
      key: 'createdAt',
      label: 'Período de Criação',
      type: 'daterange' as const,
    },
    {
      key: 'updatedAt',
      label: 'Período de Atualização',
      type: 'daterange' as const,
    },
  ], []);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setIsFiltering(true);
    if (!newFilters || Object.keys(newFilters).length === 0 || Object.values(newFilters).every(v => v === '' || v === undefined)) {
      setFilters(initialFilters);
      setCurrentPage(1);
      setTimeout(() => {
        queryClient.invalidateQueries(['stores']);
      }, 100);
      return;
    }
    const updatedFilters = { ...initialFilters };
    Object.keys(updatedFilters).forEach(key => {
      if (newFilters[key] !== undefined) {
        // @ts-expect-error
        updatedFilters[key] = newFilters[key];
      }
    });
    setFilters(updatedFilters);
    setCurrentPage(1);
  }, [queryClient]);

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
      value: 'name-asc', 
      label: 'Nome (A-Z)', 
      icon: <UserIcon className="h-4 w-4 text-cyan-500" /> 
    },
    { 
      value: 'name-desc', 
      label: 'Nome (Z-A)', 
      icon: <UserIcon className="h-4 w-4 text-orange-500" /> 
    },
  ];

  const stores: Store[] = Array.isArray(data?.data)
    ? data!.data.map((model: any) => Store.fromModel(model))
    : [];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="w-full">
          <FilterBar
            filters={filterOptions}
            onFilterChange={handleFilterChange}
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
            <p className="text-status-rejected">Erro ao carregar as lojas. Tente novamente.</p>
            <button 
              onClick={() => {
                setIsFiltering(true);
                queryClient.invalidateQueries(['stores']);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : !stores.length ? (
          <div className="col-span-1 text-center p-6 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">Nenhuma loja encontrada</p>
            <button 
              onClick={() => {
                setIsFiltering(true);
                queryClient.invalidateQueries(['stores']);
              }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          stores.map((store) => (
            <CardItem
              key={store.id}
              title={store.name || "sem informação"}
              onClick={() => setSelectedStore(store)}
            >
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OwnerId:</span>
                  <span>{store.ownerId || <span className="text-red-500">sem informação</span>}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhitelabelId:</span>
                  <span>{store.whitelabelId || <span className="text-red-500">sem informação</span>}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span>{store.createdAt ? new Date(store.createdAt).toLocaleString() : <span className="text-red-500">sem informação</span>}</span>
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
                    setSelectedStore(store);
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
                    navigate(`/stores/${store.id}`);
                  }}
                >
                  Detalhes
                </Button>
              </div>
            </CardItem>
          ))
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

      {selectedStore && (
        <StoresModal
          store={selectedStore}
          isOpen={!!selectedStore}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </div>
  );
}
  