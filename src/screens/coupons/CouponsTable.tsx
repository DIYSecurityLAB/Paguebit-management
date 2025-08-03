import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Eye, Edit, Calendar, ArrowUp, ArrowDown, Tag, CheckCircle, XCircle } from 'lucide-react';
import Table, { TableColumn } from '../../components/Table';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import CouponsModal from './CouponsModal';
import { Coupon } from '../../domain/entities/Coupon.entity';
import { CouponRepository } from '../../data/repository/coupon-repository';
import { toast } from 'sonner';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';

export default function CouponsTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    code: '',
    isActive: '',
    validFrom: '',
    validUntil: '',
  });
  const [orderBy, setOrderBy] = useState<string>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const couponRepository = useMemo(() => new CouponRepository(), []);

  const { data, isLoading, error } = useQuery(
    ['coupons', currentPage, itemsPerPage, filters, orderBy, orderDirection],
    async () => {
      // Remove propriedades vazias
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      const res = await couponRepository.listCoupons({
        page: currentPage,
        limit: itemsPerPage,
        ...cleanFilters,
        orderBy,
        order: orderDirection,
      });
      
      return res;
    },
    {
      keepPreviousData: true,
      onError: (err) => {
        console.error('Erro ao carregar cupons:', err);
        toast.error('Não foi possível carregar os cupons. Tente novamente.');
      },
      onSettled: () => {
        setIsFiltering(false);
      }
    }
  );

  const filterOptions = useMemo(() => [
    {
      key: 'code',
      label: 'Código',
      type: 'text' as const,
      placeholder: 'Buscar por código',
    },
    {
      key: 'isActive',
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
      label: 'Período de Validade',
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

  // Renderizar o indicador de ordenação
  const renderSortIndicator = (columnKey: string) => {
    if (orderBy === columnKey) {
      return orderDirection === 'asc' 
        ? <ArrowUp className="h-4 w-4 ml-1" /> 
        : <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return null;
  };

  const columns = useMemo<TableColumn<Coupon>[]>(() => [
    {
      header: 'Código',
      accessor: (coupon: Coupon) => (
        <div className="flex items-center">
          <Tag className="h-4 w-4 mr-2 text-primary" />
          <span>{coupon.code}</span>
        </div>
      ),
      sortKey: 'code',
      sortable: true,
    },
    {
      header: 'Desconto',
      accessor: (coupon: Coupon) => `${coupon.discountPercentage}%`,
      sortKey: 'discountPercentage',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (coupon: Coupon) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          coupon.isActive 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {coupon.isActive ? 'Ativo' : 'Inativo'}
        </span>
      ),
      sortKey: 'isActive',
      sortable: true,
    },
    {
      header: 'Valor Mínimo',
      accessor: (coupon: Coupon) => 
        coupon.minPurchaseValue 
          ? `R$ ${coupon.minPurchaseValue.toFixed(2)}` 
          : 'Não definido',
    },
    {
      header: 'Desconto Máximo',
      accessor: (coupon: Coupon) => 
        coupon.maxDiscountValue 
          ? `R$ ${coupon.maxDiscountValue.toFixed(2)}` 
          : 'Não definido',
    },
    {
      header: 'Validade',
      accessor: (coupon: Coupon) => (
        <div className="flex items-start flex-col">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
            <span className="text-xs">De: {format(new Date(coupon.validFrom), 'dd/MM/yyyy')}</span>
          </div>
          {coupon.validUntil && (
            <div className="flex items-center mt-1">
              <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="text-xs">Até: {format(new Date(coupon.validUntil), 'dd/MM/yyyy')}</span>
            </div>
          )}
          {!coupon.validUntil && (
            <span className="text-xs text-muted-foreground mt-1">Sem data de expiração</span>
          )}
        </div>
      ),
      sortKey: 'validUntil',
      sortable: true,
    },
    {
      header: 'Criado em',
      accessor: (coupon: Coupon) => format(new Date(coupon.createdAt), 'dd/MM/yyyy HH:mm'),
      sortKey: 'createdAt',
      sortable: true,
    },
    {
      header: 'Ações',
      accessor: (coupon: Coupon) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCoupon(coupon)}
            leftIcon={<Eye className="h-4 w-4" />}
          >
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCoupon(coupon);
            }}
            leftIcon={<Edit className="h-4 w-4" />}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={
              coupon.isActive
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }
            onClick={(e) => {
              e.stopPropagation();
              setCouponToDelete(coupon);
            }}
            leftIcon={
              coupon.isActive
                ? <XCircle className="h-4 w-4 text-red-500" />
                : <CheckCircle className="h-4 w-4 text-green-500" />
            }
          >
            {coupon.isActive ? "Desativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ], [navigate]);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setIsFiltering(true);
    const updatedFilters = {
      code: '',
      isActive: '',
      validFrom: '',
      validUntil: '',
    };
    if (newFilters.code) updatedFilters.code = newFilters.code;
    if (newFilters.isActive) updatedFilters.isActive = newFilters.isActive;
    if (newFilters.dateRangeFrom) updatedFilters.validFrom = newFilters.dateRangeFrom;
    if (newFilters.dateRangeTo) updatedFilters.validUntil = newFilters.dateRangeTo;
    setFilters(updatedFilters);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setIsFiltering(false);
    }
  }, [isLoading]);

  // Deletar cupom
  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;
    try {
      await couponRepository.updateCoupon(couponToDelete.id, { isActive: !couponToDelete.isActive });
      queryClient.invalidateQueries('coupons');
      toast.success(
        couponToDelete.isActive
          ? 'Cupom desativado com sucesso'
          : 'Cupom ativado com sucesso'
      );
      setCouponToDelete(null);
    } catch (error) {
      console.error('Erro ao atualizar status do cupom:', error);
      toast.error('Erro ao atualizar status do cupom. Tente novamente.');
    }
  };

  // Converter para entidades Coupon
  const coupons: Coupon[] = useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((model) => Coupon.fromModel(model));
  }, [data]);

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filterOptions}
        onFilterChange={handleFilterChange}
        isLoading={isFiltering && isLoading}
      />
      
      <Table
        data={coupons}
        columns={columns}
        isLoading={isLoading || isFiltering}
        sortColumn={orderBy}
        sortDirection={orderDirection}
        onSort={handleSort}
      />

      {data && typeof data.total === 'number' && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={data.total}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {selectedCoupon && (
        <CouponsModal
          coupon={selectedCoupon}
          isOpen={!!selectedCoupon}
          onClose={() => setSelectedCoupon(null)}
        />
      )}

      {couponToDelete && (
        <DeleteConfirmModal
          isOpen={!!couponToDelete}
          onClose={() => setCouponToDelete(null)}
          onConfirm={handleDeleteCoupon}
          title={couponToDelete.isActive ? "Desativar Cupom" : "Ativar Cupom"}
          message={
            couponToDelete.isActive
              ? `Tem certeza que deseja desativar o cupom "${couponToDelete.code}"?`
              : `Tem certeza que deseja ativar o cupom "${couponToDelete.code}"?`
          }
        />
      )}
    </div>
  );
}
